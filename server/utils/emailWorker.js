const EmailJob = require('../models/EmailJob');
const { sendOrderConfirmation, sendAdminOrderNotification, sendPasswordResetOTP, sendContactEmail } = require('./mailer');

const processJobs = async () => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // Pick up:
    // 1. pending/failed jobs that are ready to retry
    // 2. jobs stuck in 'processing' for >2 min (Render spin-down recovery)
    const job = await EmailJob.findOneAndUpdate(
      {
        $or: [
          {
            status: { $in: ['pending', 'failed'] },
            nextAttemptAt: { $lte: new Date() },
            $expr: { $lt: ['$attempts', '$maxAttempts'] }
          },
          {
            status: 'processing',
            updatedAt: { $lte: twoMinutesAgo }
          }
        ]
      },
      {
        status: 'processing',
        $inc: { attempts: 1 }
      },
      { new: true, sort: { createdAt: 1 } }
    );

    if (!job) return;

    try {
      if (job.type === 'customer_order_confirmation') {
        const { email, userName, order } = job.data;
        await sendOrderConfirmation(email, userName, order);
      } else if (job.type === 'admin_order_notification') {
        const { order, userName } = job.data;
        await sendAdminOrderNotification(order, userName);
      } else if (job.type === 'forgot_password_otp') {
        const { email, userName, otp } = job.data;
        await sendPasswordResetOTP(email, userName, otp);
      } else if (job.type === 'contact_form') {
        await sendContactEmail(job.data);
      }

      job.status = 'completed';
      await job.save();
      console.log(`✅ Email job ${job._id} (${job.type}) sent successfully`);

    } catch (error) {
      console.error(`❌ Email Job ${job._id} failed:`, error.message);
      job.lastError = error.message;

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        console.error(`🛑 Job ${job._id} permanently failed after ${job.attempts} attempts`);
      } else {
        job.status = 'pending';
        // Exponential backoff: 1min, 5min, 15min
        const backoffMinutes = [1, 5, 15];
        const delay = backoffMinutes[job.attempts - 1] || 15;
        job.nextAttemptAt = new Date(Date.now() + delay * 60 * 1000);
        console.log(`🔄 Job ${job._id} will retry in ${delay} minute(s)`);
      }

      await job.save();
    }
  } catch (error) {
    console.error('Error polling email queue:', error.message);
  }
};

const startEmailWorker = () => {
  console.log('📧 Starting Email Queue Worker...');

  // Run immediately on startup to flush any jobs left over from a previous spin-down
  setTimeout(processJobs, 2000);

  // Then poll every 10 seconds
  setInterval(processJobs, 10000);
};

module.exports = { startEmailWorker };