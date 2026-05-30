require('dotenv').config();
const mongoose = require('mongoose');
const EmailJob = require('../models/EmailJob');

const checkJobs = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arab-fertilizer';
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
    
    const stats = await EmailJob.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('Job Statistics:', stats);
    
    const recentFailed = await EmailJob.find({ status: 'failed' })
      .sort({ updatedAt: -1 })
      .limit(5);
    
    if (recentFailed.length > 0) {
      console.log('\nRecent Failed Jobs:');
      recentFailed.forEach(job => {
        console.log(`- ID: ${job._id}, Type: ${job.type}, Error: ${job.lastError}, Attempts: ${job.attempts}`);
      });
    } else {
      console.log('\nNo failed jobs found.');
    }

    const pendingJobs = await EmailJob.countDocuments({ status: 'pending' });
    console.log(`\nPending Jobs: ${pendingJobs}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error checking jobs:', error);
  }
};

checkJobs();
