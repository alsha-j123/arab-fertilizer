require('dotenv').config();
const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

const testEmail = async () => {
  console.log('Testing email transporter...');
  console.log('USER:', process.env.EMAIL_USER);
  console.log('USER Length:', process.env.EMAIL_USER?.length);
  console.log('PASS Length:', process.env.EMAIL_PASS?.length);
  if (process.env.EMAIL_PASS) {
    console.log('PASS Starts with:', process.env.EMAIL_PASS.substring(0, 2));
    console.log('PASS Ends with:', process.env.EMAIL_PASS.substring(process.env.EMAIL_PASS.length - 2));
  }
  
  const passWithSpaces = process.env.EMAIL_PASS;
  const passWithoutSpaces = passWithSpaces.replace(/\s/g, '');
  
  console.log('PASS (original):', passWithSpaces ? '********' : 'MISSING');
  console.log('PASS (no spaces):', passWithoutSpaces ? '********' : 'MISSING');
  
  const trySend = async (pass, label, configOverride = {}) => {
    console.log(`\n--- Trying ${label} ---`);
    const config = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: pass
      },
      ...configOverride
    };
    const transporter = nodemailer.createTransport(config);
    
    try {
      await transporter.verify();
      console.log(`✅ Transporter verified with ${label}`);
      
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Arab Fertilizer <noreply@arabfertilizer.com>',
        to: process.env.EMAIL_USER,
        subject: `Test Email (${label})`,
        text: `This is a test email using ${label}.`
      });
      
      console.log(`✅ Email sent with ${label}: ` + info.response);
      return true;
    } catch (error) {
      console.error(`❌ ${label} failed:`, error.message);
      return false;
    }
  };

  const success1 = await trySend(passWithSpaces, 'PASS WITH SPACES');
  if (!success1) {
    const success2 = await trySend(passWithoutSpaces, 'PASS WITHOUT SPACES');
    if (!success2) {
      await trySend(passWithoutSpaces, 'PASS WITHOUT SPACES (EXPLICIT SMTP)', {
        service: undefined,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true
      });
    }
  }
};

testEmail();
