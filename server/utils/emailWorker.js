const EmailJob = require('../models/EmailJob');
const {
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendPasswordResetOTP,
  sendContactEmail,
  testConnection,
} = require('./mailer');

// ─────────────────────────────────────────────────────────────────────────────
// rehydrateOrder
//
// When an Order document is stored inside EmailJob.data (a Mixed field),
// MongoDB re-reads it as a plain JS object — not a Mongoose document.
// This normalises the plain object so the mailer can safely access all fields.
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
// sendEmailNow — attempt to send an email directly (bypasses the queue).
// Used for immediate delivery when the job is first created.
// Returns true if sent successfully, false if it failed.
// ─────────────────────────────────────────────────────────────────────────────
const sendEmailNow = async (job) => {
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
      console.error(`[emailWorker] Unknown job type "${job.type}"`);
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// queueAndSend — create an EmailJob and attempt immediate delivery.
//
// This is the preferred way to send emails from route handlers.
// It queues the job first (for retry resilience), then immediately tries to
// send it. If the immediate send succeeds, the job is marked 'completed'.
// If it fails, the polling worker will retry it with exponential backoff.
//
// Usage:
//   const { queueAndSend } = require('../utils/emailWorker');
//   await queueAndSend('customer_order_confirmation', email, { email, userName, order });
// ─────────────────────────────────────────────────────────────────────────────
const queueAndSend = async (type, to, data) => {
  let job;
  try {
    job = await EmailJob.create({ type, to, data, status: 'pending' });
    console.log(`[emailWorker] Queued job ${job._id} | type: ${type} | to: ${to}`);
  } catch (dbErr) {
    // If we can't even save the job, log it and try to send directly anyway
    console.error(`[emailWorker] ❌ Failed to save EmailJob to DB: ${dbErr.message}`);
    // Attempt direct send as last resort
    try {
      const tempJob = { type, data };
      await sendEmailNow(tempJob);
    } catch (sendErr) {
      console.error(`[emailWorker] ❌ Direct send also failed: ${sendErr.message}`);
    }
    return;
  }

  // Immediately attempt to send (don't wait for the 10s polling interval)
  try {
    job.status = 'processing';
    job.attempts = 1;
    await job.save();

    const success = await sendEmailNow(job);

    if (success) {
      job.status = 'completed';
      job.lastError = undefined;
      await job.save();
      console.log(`[emailWorker] ✅ Immediate send succeeded for job ${job._id} (${type} → ${to})`);
    } else {
      // Mark as pending for the polling worker to retry
      job.status = 'pending';
      job.nextAttemptAt = new Date(Date.now() + 60 * 1000); // retry in 1 minute
      await job.save();
      console.warn(`[emailWorker] ⚠️ Immediate send failed for job ${job._id}, queued for retry in 1 minute`);
    }
  } catch (err) {
    console.error(`[emailWorker] ❌ Error during immediate send for job ${job._id}: ${err.message}`);
    // Reset to pending for the worker to pick up
    try {
      job.status = 'pending';
      job.attempts = 0;
      job.nextAttemptAt = new Date(Date.now() + 60 * 1000);
      job.lastError = err.message;
      await job.save();
    } catch (_) { /* ignore */ }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// processJobs — polling worker: pick up failed/stuck jobs and retry them.
// This handles the case where immediate delivery failed, or where Render
// was sleeping when the job was created.
// ─────────────────────────────────────────────────────────────────────────────
const processJobs = async () => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const job = await EmailJob.findOneAndUpdate(
      {
        $or: [
          {
            status: { $in: ['pending', 'failed'] },
            nextAttemptAt: { $lte: new Date() },
            $expr: { $lt: ['$attempts', '$maxAttempts'] },
          },
          {
            // Recover jobs stuck in 'processing' for > 2 minutes (server crash/sleep)
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
      const success = await sendEmailNow(job);
      if (!success) throw new Error('sendEmailNow returned false — check mailer logs');

      job.status = 'completed';
      job.lastError = undefined;
      await job.save();
      console.log(`[emailWorker] ✅ Job ${job._id} completed (${job.type} → ${job.to})`);

    } catch (error) {
      console.error(
        `[emailWorker] ❌ Job ${job._id} failed on attempt ${job.attempts}/${job.maxAttempts}: ${error.message}`
      );

      // Log detailed SMTP errors for easier debugging
      if (error.responseCode) {
        console.error(
          `[emailWorker]    SMTP code: ${error.responseCode} | response: ${error.response}`
        );
      }
      if (error.code === 'EAUTH') {
        console.error(
          '[emailWorker]    ⚠️ SMTP AUTH failed! Check EMAIL_USER and EMAIL_PASS in Render environment variables.'
        );
      }

      job.lastError = error.message;

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        console.error(
          `[emailWorker] 🚫 Job ${job._id} permanently failed after ${job.maxAttempts} attempts.\n` +
          '  → Verify EMAIL_USER and EMAIL_PASS in Render Dashboard → Environment Variables\n' +
          '  → EMAIL_PASS must be a Gmail App Password (16 chars), NOT your regular Gmail password\n' +
          '  → Generate at: Google Account → Security → 2-Step Verification → App passwords'
        );
      } else {
        job.status = 'pending';
        // Exponential backoff: attempt 1→1min, 2→5min, 3→15min
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
    // DB-level error — don't crash the worker
    console.error('[emailWorker] Error polling email queue:', error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// startEmailWorker — called once from server.js after MongoDB connects
// ─────────────────────────────────────────────────────────────────────────────
const startEmailWorker = async () => {
  // Warn early if email env vars are missing
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      '[emailWorker] ⚠️  WARNING: EMAIL_USER or EMAIL_PASS is not set!\n' +
      '             Order confirmation, OTP, and contact emails will NOT be delivered.\n' +
      '             → Set EMAIL_USER=arabagro89@gmail.com in Render Environment Variables\n' +
      '             → Set EMAIL_PASS=<16-char Gmail App Password> in Render Environment Variables\n' +
      '             → Generate App Password: Google Account → Security → 2-Step Verification → App passwords'
    );
  } else {
    console.log(`[emailWorker] ✅ Email configured for: ${process.env.EMAIL_USER}`);
    // Test SMTP connection at startup so errors are visible in logs immediately
    await testConnection();
  }

  if (!process.env.ADMIN_EMAIL) {
    console.warn(
      '[emailWorker] ⚠️  WARNING: ADMIN_EMAIL is not set!\n' +
      '             Admin order notifications and contact form emails will be skipped.'
    );
  }

  console.log('[emailWorker] Starting Email Queue Worker (polling every 30s)...');

  // Poll every 30 seconds to retry failed jobs
  // (immediate sends are handled by queueAndSend, not by polling)
  setInterval(processJobs, 30000);

  // Run immediately on startup to clear any jobs left from a previous restart
  setTimeout(processJobs, 3000);
};

module.exports = { startEmailWorker, queueAndSend };