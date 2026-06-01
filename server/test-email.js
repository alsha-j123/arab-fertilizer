/**
 * test-email.js
 * Run once to verify your Gmail + App Password are working.
 *
 * Usage (from /server directory):
 *   node test-email.js your-test-recipient@gmail.com
 *
 * Make sure EMAIL_USER and EMAIL_PASS are in your .env before running.
 */

require("dotenv").config();
const nodemailer = require("nodemailer");

const recipient = process.argv[2];

if (!recipient) {
  console.error("❌  Please pass a recipient email as an argument.");
  console.error("    Example: node test-email.js test@example.com");
  process.exit(1);
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("❌  EMAIL_USER or EMAIL_PASS is missing from your .env file.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

(async () => {
  console.log(`\n📧  Sending test email to: ${recipient}`);
  console.log(`    From: ${process.env.EMAIL_USER}\n`);

  try {
    const info = await transporter.sendMail({
      from: `"Arab Fertilizers Test" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: "✅ Nodemailer Test — Arab Fertilizers",
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;max-width:480px;">
          <h2 style="color:#2D5A27;">🌿 Arab Fertilizers</h2>
          <p>Nodemailer is working correctly!</p>
          <p style="color:#888;font-size:12px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log("✅  Email sent successfully!");
    console.log(`    Message ID: ${info.messageId}`);
    console.log("\n🎉  Your Gmail + Nodemailer setup is working.\n");
  } catch (err) {
    console.error("❌  Failed to send email:");
    console.error(`    ${err.message}\n`);

    if (err.message.includes("Invalid login")) {
      console.error("💡  Hint: Check that:");
      console.error("      • EMAIL_USER is your full Gmail address");
      console.error("      • EMAIL_PASS is a Gmail App Password (16 chars)");
      console.error("      • 2-Step Verification is enabled on the account");
      console.error("      • https://myaccount.google.com/apppasswords\n");
    }
    process.exit(1);
  }
})();