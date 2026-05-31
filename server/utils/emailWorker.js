const EmailJob = require('../models/EmailJob');
const {
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendPasswordResetOTP,
  sendContactEmail,
} = require('./mailer');

// ─────────────────────────────────────────────────────────────────────────────
// rehydrateOrder
//
// FIX: When an Order document is stored inside EmailJob.data (a Mixed field),
//      MongoDB re-reads it as a plain JS object — not a Mongoose document.
//      This means:
//        • order._id  may be a plain string, or a BSON { $oid: '...' } object
//        • order.items may be a plain array of plain objects
//      The mailer functions rely on order._id.toString() and accessing nested
//      fields safely.  This helper normalises the plain object so the mailer
//      can always call `idToString(order._id)` without throwing.
//
//      NOTE: We do NOT need to re-fetch from the DB here because all the data
//            the mailer needs was captured at order-creation time.
// ─────────────────────────────────────────────────────────────────────────────
const rehydrateOrder = (rawOrder) => {
  if (!rawOrder) return rawOrder;

  // Normalise _id so it always has a .toString() method
  let id = rawOrder._id;
  if (id && typeof id === 'object' && id.$oid) {
    id = id.$oid; // Extended JSON BSON format
  }

  return {
    ...rawOrder,
    _id: id || rawOrder._id || 'UNKNOWN',
    items: Array.isArray(rawOrder.items) ? rawOrder.items : [],
    shippingAddress: rawOrder.shippingAddress || {},
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// processJobs — pick up one pending email job and process it
// ─────────────────────────────────────────────────────────────────────────────
const processJobs = async () => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // Pick up pending/failed jobs OR jobs stuck in 'processing' for > 2 minutes
    // (handles Render/Heroku spin-down mid-job scenario)
    const job = await EmailJob.findOneAndUpdate(
      {
        $or: [
          {
            status: { $in: ['pending', 'failed'] },
            nextAttemptAt: { $lte: new Date() },
            $expr: { $lt: ['$attempts', '$maxAttempts'] },
          },
          {
            status: 'processing',
            updatedAt: { $lte: twoMinutesAgo },
          },
        ],
      },
      {
        status: 'processing',
        $inc: { attempts: 1 },
      },
      { new: true, sort: { createdAt: 1 } }
    );

    if (!job) return; // Nothing pending

    console.log(
      `[emailWorker] Processing job ${job._id} | type: ${job.type} | to: ${job.to} | attempt: ${job.attempts}/${job.maxAttempts}`
    );

    try {
      if (job.type === 'customer_order_confirmation') {
        const { email, userName, order } = job.data;
        await sendOrderConfirmation(email, userName, rehydrateOrder(order));

      } else if (job.type === 'admin_order_notification') {
        const { order, userName } = job.data;
        await sendAdminOrderNotification(rehydrateOrder(order), userName);

      } else if (job.type === 'forgot_password_otp') {
        const { email, userName, otp } = job.data;
        await sendPasswordResetOTP(email, userName, otp);

      } else if (job.type === 'contact_form') {
        await sendContactEmail(job.data);

      } else {
        // Unknown type — mark failed immediately so it doesn't loop forever
        console.error(`[emailWorker] Unknown job type "${job.type}" — marking as failed`);
        job.status = 'failed';
        job.lastError = `Unknown email job type: ${job.type}`;
        await job.save();
        return;
      }

      // Success
      job.status = 'completed';
      job.lastError = undefined;
      await job.save();
      console.log(`[emailWorker] ✅ Job ${job._id} completed (${job.type} → ${job.to})`);

    } catch (error) {
      // FIX: Log the full error stack so SMTP failures are visible in logs
      console.error(
        `[emailWorker] ❌ Job ${job._id} failed on attempt ${job.attempts}/${job.maxAttempts}: ${error.message}`
      );
      if (error.responseCode) {
        // Nodemailer SMTP error — log the full SMTP response for diagnosis
        console.error(
          `[emailWorker]    SMTP response code: ${error.responseCode} | response: ${error.response}`
        );
      }

      job.lastError = error.message;

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        console.error(
          `[emailWorker] 🚫 Job ${job._id} permanently failed after ${job.maxAttempts} attempts. ` +
          `Check EMAIL_USER / EMAIL_PASS in .env and ensure Gmail App Password is correct.`
        );
      } else {
        job.status = 'pending';
        // Exponential-ish backoff: 1 min → 5 min → 15 min
        const backoffMinutes = [1, 5, 15];
        const delay = backoffMinutes[job.attempts - 1] || 15;
        job.nextAttemptAt = new Date(Date.now() + delay * 60 * 1000);
        console.log(
          `[emailWorker] ⏳ Job ${job._id} will retry in ${delay} minute(s) at ${job.nextAttemptAt.toISOString()}`
        );
      }

      await job.save();
    }
  } catch (error) {
    // DB-level error (e.g. lost MongoDB connection) — don't crash the worker
    console.error('[emailWorker] Error polling email queue:', error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// startEmailWorker — called once from server.js after MongoDB connects
// ─────────────────────────────────────────────────────────────────────────────
const startEmailWorker = () => {
  // FIX: Warn early if email env vars are missing so the issue is obvious in logs
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      '[emailWorker] ⚠️  WARNING: EMAIL_USER or EMAIL_PASS is not set in .env!\n' +
      '             Order confirmation, OTP, and contact emails will NOT be delivered.\n' +
      '             → Set EMAIL_USER=your_gmail@gmail.com\n' +
      '             → Set EMAIL_PASS=your_16_char_app_password (from Google Account → Security → App Passwords)'
    );
  } else {
    console.log(`[emailWorker] ✅ Email configured for: ${process.env.EMAIL_USER}`);
  }

  if (!process.env.ADMIN_EMAIL) {
    console.warn(
      '[emailWorker] ⚠️  WARNING: ADMIN_EMAIL is not set in .env!\n' +
      '             Admin order notifications and contact form emails will be skipped.'
    );
  }

  console.log('[emailWorker] Starting Email Queue Worker (polling every 10s)...');

  // Poll every 10 seconds
  setInterval(processJobs, 10000);

  // Also run immediately on startup to clear any jobs left from a previous restart
  setTimeout(processJobs, 2000);
};

module.exports = { startEmailWorker };