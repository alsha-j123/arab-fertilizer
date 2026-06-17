const nodemailer = require("nodemailer");

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("SMTP credentials missing: EMAIL_USER or EMAIL_PASS not set in environment variables.");
  }

  // Strip any spaces from the app password (common copy-paste issue from Google)
  const cleanPass = pass.replace(/\s+/g, "");

  console.log(`[mailer] Creating transporter for ${user} (pass length: ${cleanPass.length})`);

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false
    },
    // Timeouts to prevent hanging connections on Render
    connectionTimeout: 10000,  // 10s to establish TCP connection
    greetingTimeout: 10000,    // 10s for SMTP greeting
    socketTimeout: 15000,      // 15s for socket inactivity
  });
};

// ─────────────────────────────────────────
// testConnection — called by emailWorker on startup
// ─────────────────────────────────────────
const testConnection = async () => {
  try {
    console.log("[mailer] Testing SMTP connection to smtp.gmail.com:465...");
    console.log(`[mailer]   EMAIL_USER = ${process.env.EMAIL_USER || "NOT SET"}`);
    console.log(`[mailer]   EMAIL_PASS = ${process.env.EMAIL_PASS ? `SET (${process.env.EMAIL_PASS.replace(/\s+/g, "").length} chars)` : "NOT SET"}`);
    const transporter = createTransporter();
    await transporter.verify();
    console.log("[mailer] ✅ SMTP connection verified successfully — emails WILL be delivered");
  } catch (err) {
    console.error("[mailer] ❌ SMTP connection FAILED:", err.message);
    console.error("[mailer] ❌ Full error:", err);
    if (err.code === "EAUTH") {
      console.error(
        "[mailer] ⚠️  Gmail auth failed. Check EMAIL_USER and EMAIL_PASS in Render env vars.\n" +
        "          EMAIL_PASS must be a 16-char App Password (no spaces), NOT your Gmail password.\n" +
        "          Generate at: Google Account → Security → 2-Step Verification → App passwords"
      );
    }
    if (err.code === "ESOCKET" || err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED") {
      console.error(
        "[mailer] ⚠️  Network issue connecting to smtp.gmail.com:465.\n" +
        "          This can happen on Render's free tier. The email worker will keep retrying."
      );
    }
  }
};

// ─────────────────────────────────────────
// Shared HTML wrapper
// ─────────────────────────────────────────
const htmlWrapper = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:8px;overflow:hidden;
                    box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#2D5A27;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px;">
              🌿 Arab Fertilizers &amp; Agro Chemicals
            </h1>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f0f0f0;padding:16px 32px;text-align:center;">
            <p style="margin:0;color:#999;font-size:12px;">
              © ${new Date().getFullYear()} Arab Fertilizers &amp; Agro Chemicals. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─────────────────────────────────────────
// sendOrderConfirmation
// Called by emailWorker as: sendOrderConfirmation(email, userName, order)
// ─────────────────────────────────────────
const sendOrderConfirmation = async (toEmail, userName, order) => {
  const transporter = createTransporter();
  const addr = order.shippingAddress || {};

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;">${item.name || "Product"}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">
        PKR ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
      </td>
    </tr>`).join("");

  const content = `
    <p style="margin:0 0 16px;font-size:16px;color:#333;">
      Dear <strong>${userName || addr.name || "Valued Customer"}</strong>,
    </p>
    <p style="margin:0 0 24px;color:#555;line-height:1.6;">
      Thank you for your order! We've received it and will process it shortly.
    </p>

    <!-- Order Meta -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9f9f9;border-radius:6px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr>
            <td style="color:#888;font-size:13px;">Order ID</td>
            <td style="color:#333;font-size:13px;font-weight:bold;text-align:right;">#${order._id}</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:13px;">Payment Method</td>
            <td style="color:#333;font-size:13px;text-align:right;">
              ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}
            </td>
          </tr>
          <tr>
            <td style="color:#888;font-size:13px;">Order Date</td>
            <td style="color:#333;font-size:13px;text-align:right;">
              ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-PK", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- Items -->
    <h3 style="margin:0 0 12px;color:#2D5A27;font-size:16px;">Order Summary</h3>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #eee;border-radius:6px;border-collapse:collapse;">
      <thead>
        <tr style="background:#2D5A27;">
          <th style="padding:10px 8px;text-align:left;color:#fff;font-size:13px;">Product</th>
          <th style="padding:10px 8px;text-align:center;color:#fff;font-size:13px;">Qty</th>
          <th style="padding:10px 8px;text-align:right;color:#fff;font-size:13px;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:8px;color:#888;font-size:12px;border-top:1px solid #eee;">Shipping</td>
          <td style="padding:8px;text-align:right;color:#555;font-size:12px;border-top:1px solid #eee;">
            ${(order.shippingCost || 0) === 0 ? "FREE" : "PKR " + (order.shippingCost || 0).toLocaleString()}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:12px 8px;font-weight:bold;color:#333;border-top:2px solid #2D5A27;">Total</td>
          <td style="padding:12px 8px;font-weight:bold;color:#2D5A27;text-align:right;
                     border-top:2px solid #2D5A27;font-size:16px;">
            PKR ${(order.totalAmount || 0).toLocaleString()}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Shipping Address -->
    ${addr.street || addr.city ? `
    <h3 style="margin:24px 0 12px;color:#2D5A27;font-size:16px;">Shipping Address</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:6px;">
      <tr><td style="padding:16px 20px;color:#555;line-height:1.7;font-size:14px;">
        ${addr.name   ? addr.name + "<br/>"   : ""}
        ${addr.street ? addr.street + "<br/>" : ""}
        ${addr.city   ? addr.city             : ""}${addr.province ? ", " + addr.province : ""}<br/>
        ${addr.phone  ? "📞 " + addr.phone    : ""}
      </td></tr>
    </table>` : ""}

    <p style="margin:28px 0 0;color:#555;line-height:1.6;">
      If you have any questions, reply to this email.<br/>
      <strong style="color:#2D5A27;">Arab Fertilizers &amp; Agro Chemicals</strong>
    </p>`;

  await transporter.sendMail({
    from:    `"Arab Fertilizers" <${process.env.EMAIL_USER}>`,
    to:      toEmail,
    subject: `✅ Order Confirmed — #${order._id}`,
    html:    htmlWrapper(content),
  });

  console.log(`[mailer] ✅ Order confirmation sent to ${toEmail}`);
};

// ─────────────────────────────────────────
// sendAdminOrderNotification
// Called by emailWorker as: sendAdminOrderNotification(order, userName)
// ─────────────────────────────────────────
const sendAdminOrderNotification = async (order, userName) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[mailer] ⚠️  ADMIN_EMAIL not set — skipping admin notification");
    return;
  }

  const transporter = createTransporter();
  const addr = order.shippingAddress || {};

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.name || "Product"}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">
        PKR ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
      </td>
    </tr>`).join("");

  const content = `
    <h2 style="color:#2D5A27;margin:0 0 16px;">🛒 New Order Received</h2>
    <p style="color:#555;margin:0 0 20px;">
      A new order has been placed by <strong>${userName || addr.name || "a customer"}</strong>.
    </p>
    <table width="100%" cellpadding="4" cellspacing="0" style="background:#f9f9f9;border-radius:6px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="4">
          <tr>
            <td style="color:#888;font-size:13px;">Order ID</td>
            <td style="color:#333;font-weight:bold;font-size:13px;text-align:right;">#${order._id}</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:13px;">Customer</td>
            <td style="color:#333;font-size:13px;text-align:right;">${userName || "N/A"}</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:13px;">Email</td>
            <td style="color:#333;font-size:13px;text-align:right;">${addr.email || "N/A"}</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:13px;">Phone</td>
            <td style="color:#333;font-size:13px;text-align:right;">${addr.phone || "N/A"}</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:13px;">Payment</td>
            <td style="color:#333;font-size:13px;text-align:right;">
              ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}
            </td>
          </tr>
          <tr>
            <td style="color:#888;font-size:13px;">Total</td>
            <td style="color:#2D5A27;font-weight:bold;font-size:14px;text-align:right;">
              PKR ${(order.totalAmount || 0).toLocaleString()}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-collapse:collapse;border-radius:6px;">
      <thead>
        <tr style="background:#2D5A27;">
          <th style="padding:8px;text-align:left;color:#fff;font-size:12px;">Product</th>
          <th style="padding:8px;text-align:center;color:#fff;font-size:12px;">Qty</th>
          <th style="padding:8px;text-align:right;color:#fff;font-size:12px;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>`;

  await transporter.sendMail({
    from:    `"Arab Fertilizers" <${process.env.EMAIL_USER}>`,
    to:      adminEmail,
    subject: `🛒 New Order #${order._id} — PKR ${(order.totalAmount || 0).toLocaleString()}`,
    html:    htmlWrapper(content),
  });

  console.log(`[mailer] ✅ Admin notification sent to ${adminEmail}`);
};

// ─────────────────────────────────────────
// sendPasswordResetOTP
// Called by emailWorker as: sendPasswordResetOTP(email, userName, otp)
// ─────────────────────────────────────────
const sendPasswordResetOTP = async (toEmail, userName, otp) => {
  const transporter = createTransporter();

  const content = `
    <p style="margin:0 0 16px;font-size:16px;color:#333;">
      Dear <strong>${userName || "User"}</strong>,
    </p>
    <p style="margin:0 0 20px;color:#555;line-height:1.6;">
      You requested a password reset. Use the OTP below — it expires in <strong>10 minutes</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <span style="display:inline-block;background:#2D5A27;color:#fff;
                   font-size:32px;font-weight:bold;letter-spacing:10px;
                   padding:16px 32px;border-radius:8px;">
        ${otp}
      </span>
    </div>
    <p style="color:#888;font-size:13px;text-align:center;">
      If you did not request this, please ignore this email.
    </p>`;

  await transporter.sendMail({
    from:    `"Arab Fertilizers" <${process.env.EMAIL_USER}>`,
    to:      toEmail,
    subject: `🔐 Your Password Reset OTP — Arab Fertilizers`,
    html:    htmlWrapper(content),
  });

  console.log(`[mailer] ✅ OTP email sent to ${toEmail}`);
};

// ─────────────────────────────────────────
// sendContactEmail
// Called by emailWorker as: sendContactEmail(data)
// ─────────────────────────────────────────
const sendContactEmail = async (data) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[mailer] ⚠️  ADMIN_EMAIL not set — skipping contact email");
    return;
  }

  const transporter = createTransporter();
  const { name, email, phone, message, subject } = data;

  const content = `
    <h2 style="color:#2D5A27;margin:0 0 20px;">📩 New Contact Form Message</h2>
    <table width="100%" cellpadding="8" cellspacing="0" style="background:#f9f9f9;border-radius:6px;margin-bottom:20px;">
      <tr>
        <td style="color:#888;font-size:13px;width:100px;">Name</td>
        <td style="color:#333;font-size:13px;font-weight:bold;">${name || "N/A"}</td>
      </tr>
      <tr>
        <td style="color:#888;font-size:13px;">Email</td>
        <td style="color:#333;font-size:13px;">${email || "N/A"}</td>
      </tr>
      <tr>
        <td style="color:#888;font-size:13px;">Phone</td>
        <td style="color:#333;font-size:13px;">${phone || "N/A"}</td>
      </tr>
      <tr>
        <td style="color:#888;font-size:13px;">Subject</td>
        <td style="color:#333;font-size:13px;">${subject || "N/A"}</td>
      </tr>
    </table>
    <h3 style="color:#2D5A27;font-size:15px;margin:0 0 10px;">Message:</h3>
    <div style="background:#f9f9f9;border-left:4px solid #2D5A27;padding:16px;border-radius:4px;color:#555;line-height:1.7;">
      ${(message || "").replace(/\n/g, "<br/>")}
    </div>`;

  await transporter.sendMail({
    from:    `"Arab Fertilizers Contact Form" <${process.env.EMAIL_USER}>`,
    to:      adminEmail,
    replyTo: email,
    subject: `📩 Contact Form: ${subject || "New Message"} — from ${name}`,
    html:    htmlWrapper(content),
  });

  console.log(`[mailer] ✅ Contact email sent to ${adminEmail}`);
};

// ─────────────────────────────────────────
// sendEmail — generic helper
// ─────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Arab Fertilizers" <${process.env.EMAIL_USER}>`,
    to, subject, html,
  });
  console.log(`[mailer] ✅ Email sent to ${to}`);
};

module.exports = {
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendPasswordResetOTP,
  sendContactEmail,
  sendEmail,
  testConnection,
};