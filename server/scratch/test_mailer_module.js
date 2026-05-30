require('dotenv').config();
const { sendPasswordResetOTP } = require('../utils/mailer');

const testMailerModule = async () => {
  console.log('Testing mailer.js module...');
  console.log('USER:', process.env.EMAIL_USER);
  
  try {
    await sendPasswordResetOTP(process.env.EMAIL_USER, 'Test User', '123456');
    console.log('✅ Email sent successfully via mailer.js module');
  } catch (error) {
    console.error('❌ Mailer module test failed:', error.message);
  }
};

testMailerModule();
