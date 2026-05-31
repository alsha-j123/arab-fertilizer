const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────────────────────────
// SMTP transporter factory
// FIX: Gmail SMTP requires the "from" address to match the authenticated
//      EMAIL_USER.  Using a custom domain (e.g. noreply@arabfertilizer.com)
//      as the from address causes Gmail to reject the message with a 530/535
//      error.  We now always derive the display "from" from EMAIL_USER so the
//      SMTP AUTH and the envelope sender are the same account.
// ─────────────────────────────────────────────────────────────────────────────
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : '';

  if (!user || !pass) {
    throw new Error(
      'Email configuration missing: EMAIL_USER and EMAIL_PASS must be set in .env'
    );
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: { user, pass },
    // Increase timeout for slow SMTP handshakes (common on shared hosting)
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

// FIX: "from" must always be the Gmail account used for AUTH.
// EMAIL_FROM can provide a display name: "Arab Fertilizer <you@gmail.com>"
// but the address portion MUST equal EMAIL_USER.
const getSenderAddress = () => {
  const user = process.env.EMAIL_USER;
  const fromEnv = process.env.EMAIL_FROM || '';

  // If EMAIL_FROM is set and contains the EMAIL_USER address, use it as-is.
  if (fromEnv && user && fromEnv.includes(user)) {
    return fromEnv;
  }

  // Otherwise build a safe sender using just EMAIL_USER (always valid for Gmail)
  return user ? `Arab Fertilizer <${user}>` : 'Arab Fertilizer';
};

const formatCurrency = (amount) =>
  `PKR ${Number(amount).toLocaleString('en-PK')}`;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: safely convert an _id (ObjectId, string, or plain object) to string.
// FIX: When an order is stored as Mixed in EmailJob.data and re-read from
//      MongoDB, _id may arrive as a plain string or a plain { $oid: '...' }
//      object instead of a real ObjectId instance.
// ─────────────────────────────────────────────────────────────────────────────
const idToString = (id) => {
  if (!id) return 'UNKNOWN';
  if (typeof id === 'string') return id;
  if (typeof id.toString === 'function') return id.toString();
  if (id.$oid) return id.$oid; // BSON extended JSON
  return String(id);
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: safely extract shipping address fields from a deserialized order.
// ─────────────────────────────────────────────────────────────────────────────
const safeAddress = (order) => {
  const addr = order.shippingAddress || {};
  return {
    name: addr.name || 'Customer',
    street: addr.street || addr.address || '',
    city: addr.city || '',
    phone: addr.phone || '',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build items + pricing HTML rows (shared between customer & admin)
// ─────────────────────────────────────────────────────────────────────────────
const buildOrderTableHtml = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];

  const itemsHtml = items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:12px;color:#333">${item.name || 'Item'}</td>
        <td style="padding:12px;text-align:center;color:#666">${item.quantity || 0}</td>
        <td style="padding:12px;text-align:right;color:#2D5A27;font-weight:600">${formatCurrency((item.price || 0) * (item.quantity || 0))}</td>
      </tr>
    `
    )
    .join('');

  const subtotalVal =
    order.subtotal !== undefined ? order.subtotal : order.totalAmount || 0;
  const shippingVal =
    order.shippingCost !== undefined ? order.shippingCost : 0;
  const discountVal =
    order.discountAmount !== undefined ? order.discountAmount : 0;

  let pricingRows = `
    <tr style="border-top:1px solid #eee">
      <td colspan="2" style="padding:10px 12px;text-align:left;color:#555;font-size:14px">Subtotal</td>
      <td style="padding:10px 12px;text-align:right;color:#333;font-size:14px;font-weight:600">${formatCurrency(subtotalVal)}</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:10px 12px;text-align:left;color:#555;font-size:14px">Shipping</td>
      <td style="padding:10px 12px;text-align:right;color:#333;font-size:14px;font-weight:600">${shippingVal === 0 ? 'FREE' : formatCurrency(shippingVal)}</td>
    </tr>
  `;

  if (discountVal > 0) {
    pricingRows += `
      <tr>
        <td colspan="2" style="padding:10px 12px;text-align:left;color:#e74c3c;font-size:14px">Discount ${order.couponCode ? `(${order.couponCode})` : ''}</td>
        <td style="padding:10px 12px;text-align:right;color:#e74c3c;font-size:14px;font-weight:600">-${formatCurrency(discountVal)}</td>
      </tr>
    `;
  }

  pricingRows += `
    <tr style="background:#f0f8ee;border-top:2px solid #2D5A27">
      <td colspan="2" style="padding:12px;font-weight:700;color:#333">Total Amount</td>
      <td style="padding:12px;text-align:right;font-weight:700;font-size:18px;color:#2D5A27">${formatCurrency(order.totalAmount || 0)}</td>
    </tr>
  `;

  return { itemsHtml, pricingRows };
};

// ─────────────────────────────────────────────────────────────────────────────
// sendOrderConfirmation — sends branded HTML email to the customer
// ─────────────────────────────────────────────────────────────────────────────
const sendOrderConfirmation = async (email, userName, order) => {
  const transporter = createTransporter();
  const { itemsHtml, pricingRows } = buildOrderTableHtml(order);
  const addr = safeAddress(order);
  const orderId = idToString(order._id).substring(0, 12).toUpperCase();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
      <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#2D5A27,#5D4037);padding:40px 30px;text-align:center">
          <h1 style="color:#C8A951;margin:0;font-size:28px;letter-spacing:1px">🌿 Arab Fertilizer</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Fertilizers & Agro Chemicals</p>
        </div>
        
        <!-- Body -->
        <div style="padding:35px 30px">
          <h2 style="color:#2D5A27;margin:0 0 8px">Order Confirmed! ✅</h2>
          <p style="color:#666;margin:0 0 25px">Dear <strong>${userName}</strong>, your order has been successfully placed.</p>
          
          <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-bottom:25px;border-left:4px solid #2D5A27">
            <p style="margin:0;font-size:13px;color:#888">Order ID</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#333;letter-spacing:1px">#${orderId}</p>
          </div>
          
          <!-- Items -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <thead>
              <tr style="background:#2D5A27">
                <th style="padding:12px;text-align:left;color:#fff;border-radius:8px 0 0 0">Product</th>
                <th style="padding:12px;text-align:center;color:#fff">Qty</th>
                <th style="padding:12px;text-align:right;color:#fff;border-radius:0 8px 0 0">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>${pricingRows}</tfoot>
          </table>
          
          <!-- Details Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:25px">
            <div style="background:#f9f9f9;border-radius:8px;padding:15px">
              <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Payment Method</p>
              <p style="margin:5px 0 0;font-weight:600;color:#333">${order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '🏦 Bank Transfer'}</p>
            </div>
            <div style="background:#f9f9f9;border-radius:8px;padding:15px">
              <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Est. Delivery</p>
              <p style="margin:5px 0 0;font-weight:600;color:#333">${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' }) : '3–5 Business Days'}</p>
            </div>
          </div>
          
          <div style="background:#f9f9f9;border-radius:8px;padding:15px;margin-bottom:25px">
            <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Delivery Address</p>
            <p style="margin:5px 0 0;font-weight:600;color:#333">${addr.name}</p>
            <p style="margin:2px 0 0;color:#666">${addr.street}${addr.city ? ', ' + addr.city : ''}</p>
            ${addr.phone ? `<p style="margin:2px 0 0;color:#666">📞 ${addr.phone}</p>` : ''}
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background:#2D5A27;padding:25px 30px;text-align:center">
          <p style="color:rgba(255,255,255,0.8);margin:0;font-size:13px">Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color:#C8A951">${process.env.EMAIL_USER}</a></p>
          <p style="color:rgba(255,255,255,0.5);margin:8px 0 0;font-size:12px">© ${new Date().getFullYear()} Arab Fertilizers & Agro Chemicals</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: getSenderAddress(),
    to: email,
    subject: `✅ Your Arab Fertilizer Order is Confirmed! — #${orderId}`,
    html,
  });

  console.log(`[mailer] Order confirmation sent to ${email} (messageId: ${info.messageId})`);
  return info;
};

// ─────────────────────────────────────────────────────────────────────────────
// sendAdminOrderNotification — sends order alert to admin
// ─────────────────────────────────────────────────────────────────────────────
const sendAdminOrderNotification = async (order, userName) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('[mailer] ADMIN_EMAIL not set — skipping admin order notification');
    return;
  }

  const transporter = createTransporter();
  const { itemsHtml, pricingRows } = buildOrderTableHtml(order);
  const addr = safeAddress(order);
  const orderId = idToString(order._id).substring(0, 12).toUpperCase();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
      <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#5D4037,#2D5A27);padding:40px 30px;text-align:center">
          <h1 style="color:#C8A951;margin:0;font-size:28px;letter-spacing:1px">New Order Alert 🔔</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">A new order has been placed on Arab Fertilizer</p>
        </div>
        
        <!-- Body -->
        <div style="padding:35px 30px">
          <h2 style="color:#2D5A27;margin:0 0 8px">Action Required</h2>
          <p style="color:#666;margin:0 0 25px">Customer <strong>${userName}</strong> just placed a new order.</p>
          
          <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-bottom:25px;border-left:4px solid #C8A951">
            <p style="margin:0;font-size:13px;color:#888">Order ID</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#333;letter-spacing:1px">#${orderId}</p>
          </div>
          
          <!-- Items -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <thead>
              <tr style="background:#2D5A27">
                <th style="padding:12px;text-align:left;color:#fff;border-radius:8px 0 0 0">Product</th>
                <th style="padding:12px;text-align:center;color:#fff">Qty</th>
                <th style="padding:12px;text-align:right;color:#fff;border-radius:0 8px 0 0">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>${pricingRows}</tfoot>
          </table>
          
          <!-- Details Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:25px">
            <div style="background:#f9f9f9;border-radius:8px;padding:15px">
              <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Payment Method</p>
              <p style="margin:5px 0 0;font-weight:600;color:#333">${order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '🏦 Bank Transfer'}</p>
            </div>
            <div style="background:#f9f9f9;border-radius:8px;padding:15px">
              <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Customer Name</p>
              <p style="margin:5px 0 0;font-weight:600;color:#333">${userName}</p>
            </div>
          </div>
          
          <div style="background:#f9f9f9;border-radius:8px;padding:15px;margin-bottom:25px">
            <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Delivery Address</p>
            <p style="margin:5px 0 0;font-weight:600;color:#333">${addr.name}</p>
            <p style="margin:2px 0 0;color:#666">${addr.street}${addr.city ? ', ' + addr.city : ''}</p>
            ${addr.phone ? `<p style="margin:2px 0 0;color:#666">📞 ${addr.phone}</p>` : ''}
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background:#2D5A27;padding:25px 30px;text-align:center">
          <p style="color:rgba(255,255,255,0.8);margin:0;font-size:13px">Please log in to the admin panel to manage this order.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: getSenderAddress(),
    to: adminEmail,
    subject: `🚨 New Order Alert! — #${orderId} by ${userName}`,
    html,
  });

  console.log(`[mailer] Admin order notification sent to ${adminEmail} (messageId: ${info.messageId})`);
  return info;
};

// ─────────────────────────────────────────────────────────────────────────────
// sendPasswordResetOTP
// ─────────────────────────────────────────────────────────────────────────────
const sendPasswordResetOTP = async (email, userName, otp) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
      <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#2D5A27,#5D4037);padding:40px 30px;text-align:center">
          <h1 style="color:#C8A951;margin:0;font-size:28px;letter-spacing:1px">Password Reset</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Arab Fertilizer</p>
        </div>
        
        <!-- Body -->
        <div style="padding:35px 30px">
          <h2 style="color:#2D5A27;margin:0 0 8px">Hello ${userName},</h2>
          <p style="color:#666;margin:0 0 25px;line-height:1.6">We received a request to reset your password. Use the following 6-digit code to complete the process. This code will expire in 10 minutes.</p>
          
          <div style="background:#f0f8ee;border-radius:8px;padding:25px;margin-bottom:25px;text-align:center;border:2px dashed #2D5A27">
            <div style="font-size:36px;font-weight:800;color:#2D5A27;letter-spacing:8px;font-family:monospace">${otp}</div>
          </div>
          
          <p style="color:#888;margin:0 0 10px;font-size:13px;line-height:1.5">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
        </div>
        
        <!-- Footer -->
        <div style="background:#f9f9f9;padding:20px 30px;text-align:center;border-top:1px solid #eee">
          <p style="color:#999;margin:0;font-size:12px">© ${new Date().getFullYear()} Arab Fertilizers & Agro Chemicals</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: getSenderAddress(),
    to: email,
    subject: `🔐 Your Password Reset Code: ${otp}`,
    html,
  });

  console.log(`[mailer] Password reset OTP sent to ${email} (messageId: ${info.messageId})`);
  return info;
};

// ─────────────────────────────────────────────────────────────────────────────
// sendContactEmail — forwards contact form to admin
// ─────────────────────────────────────────────────────────────────────────────
const sendContactEmail = async (formData) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('[mailer] ADMIN_EMAIL not set — skipping contact form email');
    return;
  }

  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:sans-serif;line-height:1.6;color:#333;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;padding:30px;box-shadow:0 2px 10px rgba(0,0,0,0.05)">
        <h2 style="color:#2D5A27;border-bottom:2px solid #2D5A27;padding-bottom:10px">New Contact Inquiry 📩</h2>
        <p><strong>From:</strong> ${formData.name} (${formData.email})</p>
        <p><strong>Phone:</strong> ${formData.phone || 'N/A'}</p>
        <p><strong>Subject:</strong> ${formData.subject}</p>
        <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin-top:20px;white-space:pre-wrap">${formData.message}</div>
        <p style="font-size:12px;color:#888;margin-top:30px">Sent from Arab Fertilizer Contact Us form.</p>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: getSenderAddress(),
    to: adminEmail,
    // FIX: replyTo uses the visitor's email so admin can reply directly to them.
    replyTo: formData.email,
    subject: `📩 Contact Form: ${formData.subject}`,
    html,
  });

  console.log(`[mailer] Contact form email sent to ${adminEmail} (messageId: ${info.messageId})`);
  return info;
};

module.exports = {
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendPasswordResetOTP,
  sendContactEmail,
};