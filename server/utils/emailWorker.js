const EmailJob = require('../models/EmailJob');
const { sendOrderConfirmation, sendAdminOrderNotification, sendPasswordResetOTP, sendContactEmail } = require('./mailer');

const processJobs = async () => {
  try {
    // Find a pending or failed job that is ready to be attempted
    const job = await EmailJob.findOneAndUpdate(
      {
        status: { $in: ['pending', 'failed'] },
        nextAttemptAt: { $lte: new Date() },
        $expr: { $lt: ['$attempts', '$maxAttempts'] }
      },
      {
        status: 'processing',
        $inc: { attempts: 1 }
      },
      { new: true, sort: { createdAt: 1 } }
    );

    if (!job) {
      // No jobs to process
      return;
    }

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

      // Mark as completed
      job.status = 'completed';
      await job.save();
    } catch (error) {
      console.error(`Email Job ${job._id} failed:`, error.message);
      
      job.lastError = error.message;
      
      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
      } else {
        job.status = 'pending';
        // Exponential backoff for retries: 1min, 5min, 15min
        const backoffMinutes = [1, 5, 15];
        const delay = backoffMinutes[job.attempts - 1] || 15;
        job.nextAttemptAt = new Date(Date.now() + delay * 60 * 1000);
      }
      
      await job.save();
    }
  } catch (error) {
    console.error('Error polling email queue:', error.message);
  }
};

// Start polling
const startEmailWorker = () => {
  console.log('Starting Email Queue Worker...');
  // Poll every 10 seconds
  setInterval(processJobs, 10000);
};

module.exports = { startEmailWorker };
