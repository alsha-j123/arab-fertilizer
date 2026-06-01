/**
 * mailer.js — Email delivery via Resend API
 *
 * WHY RESEND INSTEAD OF GMAIL SMTP?
 * Render's free tier blocks all outbound SMTP connections (ports 465 & 587).
 * This causes "Connection timeout" errors with nodemailer + Gmail SMTP.
 * Resend uses HTTPS (port 443) which is never blocked, and has a free tier
 * of 3,000 emails/month — more than enough for this app.
 *
 * SETUP (5 minutes):
 *   1. Go to https://resend.com and create a free account
 *   2. Dashboard → API Keys → Create API Key → copy it
 *   3. Add to Render environment variables:
 *        RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxx
 *   4. (Optional but recommended) Add your domain in Resend → Domains
 *      and update EMAIL_FROM to use that domain for better deliverability.
 *      Until then, use: EMAIL_FROM=Arab Fertilizer <onboarding@resend.dev>
 *      (Resend's shared domain works immediately, no DNS setup needed)
 */

const https = require('https');

// ─────────────────────────────────────────────────────────────────────────────
// Low-level Resend API call (pure Node.js https — no extra dependency needed)
// ─────────────────────────────────────────────────────────────────────────────
const sendViaResend = ({ from, to, subject, html, replyTo }) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return reject(new Error(
        '[mailer] RESEND_API_KEY is not set.\n' +
        '  → Sign up free at https://resend.com\n' +
        '  → Dashboard → API Keys → Create API Key\n' +
        '  → Add RESEND_API_KEY to Render Environment Variables'
      ));
    }

    const body = JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ messageId: parsed.id, status: res.statusCode });
          } else {
            reject(new Error(
              `Resend API error ${res.statusCode}: ${parsed.message || parsed.name || data}`
            ));
          }
        } catch (e) {
          reject(new Error(`Resend API parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy(new Error('Resend API request timed out after 20s'));
    });

    req.write(body);
    req.end();
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// getSenderAddress — derive the "from" field
//
// Priority:
//   1. EMAIL_FROM env var (e.g. "Arab Fertilizer <arabagro89@gmail.com>")
//      → only works once you verify your domain in Resend
//   2. Resend's shared domain (works immediately, no DNS setup):
//      "Arab Fertilizer <onboarding@resend.dev>"
// ─────────────────────────────────────────────────────────────────────────────
const getSenderAddress = () => {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  // Resend shared domain — works out of the box with no domain verification
  return 'Arab Fertilizer <onboarding@resend.dev>';
};

// ─────────────────────────────────────────────────────────────────────────────
// testConnection — verify the API key is valid at server startup
// ─────────────────────────────────────────────────────────────────────────────
const testConnection = () => {
  return new Promise((resolve) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error(
        '[mailer] ❌ RESEND_API_KEY is not set!\n' +
        '  Emails will NOT be sent until this is configured.\n' +
        '  → Sign up free at https://resend.com\n' +
        '  → Create an API key and add RESEND_API_KEY to Render Environment Variables'
      );
      return resolve(false);
    }

    // Call Resend's /domains endpoint to verify the key is valid
    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/domains',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('[mailer] ✅ Resend API key verified — emails ready to send');
        resolve(true);
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        console.error(
          `[mailer] ❌ Resend API key invalid (HTTP ${res.statusCode})\n` +
          '  → Check RESEND_API_KEY in Render Environment Variables\n' +
          '  → Generate a new key at https://resend.com/api-keys'
        );
        resolve(false);
      } else {
        console.warn(`[mailer] ⚠️ Resend API responded with HTTP ${res.statusCode} during key check`);
        resolve(true); // Don't block startup for unexpected status codes
      }
    });
    req.on('error', (err) => {
      console.error('[mailer] ❌ Could not reach Resend API:', err.message);
      resolve(false);
    });
    req.setTimeout(10000, () => {
      req.destroy();
      console.warn('[mailer] ⚠️ Resend API key check timed out — proceeding anyway');
      resolve(true);
    });
    req.end();
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  `PKR ${Number(amount).toLocaleString('en-PK')}`;

const idToString = (id) => {
  if (!id) return 'UNKNOWN';
  if (typeof id === 'string') return id;
  if (id.$oid) return id.$oid;
  if (typeof id.toString === 'function') return id.toString();
  return String(id);
};

const safeAddress = (order) => {
  const addr = order.shippingAddress || {};
  return {
    name: addr.name || 'Customer',
    street: addr.street || addr.address || '',
    city: addr.city || '',
    phone: addr.phone || '',
  };
};

const buildOrderTableHtml = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];

  const itemsHtml = items.map((item) => `
    <tr style="border-bottom:1px solid #eee">
      <td style="padding:12px;color:#333">${item.name || 'Item'}</td>
      <td style="padding:12px;text-align:center;color:#666">${item.quantity || 0}</td>
      <td style="padding:12px;text-align:right;color:#2D5A27;font-weight:600">
        ${formatCurrency((item.price || 0) * (item.quantity || 0))}
      </td>
    </tr>`).join('');

  const subtotalVal = order.subtotal !== undefined ? order.subtotal : order.totalAmount || 0;
  const shippingVal = order.shippingCost !== undefined ? order.shippingCost : 0;
  const discountVal = order.discountAmount !== undefined ? order.discountAmount : 0;

  let pricingRows = `
    <tr style="border-top:1px solid #eee">
      <td colspan="2" style="padding:10px 12px;color:#555;font-size:14px">Subtotal</td>
      <td style="padding:10px 12px;text-align:right;color:#333;font-size:14px;font-weight:600">${formatCurrency(subtotalVal)}</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:10px 12px;color:#555;font-size:14px">Shipping</td>
      <td style="padding:10px 12px;text-align:right;color:#333;font-size:14px;font-weight:600">${shippingVal === 0 ? 'FREE' : formatCurrency(shippingVal)}</td>
    </tr>`;

  if (discountVal > 0) {
    pricingRows += `
    <tr>
      <td colspan="2" style="padding:10px 12px;color:#e74c3c;font-size:14px">Discount${order.couponCode ? ` (${order.couponCode})` : ''}</td>
      <td style="padding:10px 12px;text-align:right;color:#e74c3c;font-size:14px;font-weight:600">-${formatCurrency(discountVal)}</td>
    </tr>`;
  }

  pricingRows += `
    <tr style="background:#f0f8ee;border-top:2px solid #2D5A27">
      <td colspan="2" style="padding:12px;font-weight:700;color:#333">Total Amount</td>
      <td style="padding:12px;text-align:right;font-weight:700;font-size:18px;color:#2D5A27">${formatCurrency(order.totalAmount || 0)}</td>
    </tr>`;

  return { itemsHtml, pricingRows };
};

// Shared email wrapper element
const emailWrapper = (content) => `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
    ${content}
  </div>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────
// sendOrderConfirmation — customer confirmation email
// ─────────────────────────────────────────────────────────────────────────────
const sendOrderConfirmation = async (email, userName, order) => {
  if (!email) throw new Error('[mailer] sendOrderConfirmation: email is required');

  const { itemsHtml, pricingRows } = buildOrderTableHtml(order);
  const addr = safeAddress(order);
  const orderId = idToString(order._id).substring(0, 12).toUpperCase();

  const html = emailWrapper(`
    <div style="background:linear-gradient(135deg,#2D5A27,#5D4037);padding:40px 30px;text-align:center">
      <h1 style="color:#C8A951;margin:0;font-size:28px;letter-spacing:1px">🌿 Arab Fertilizer</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Fertilizers &amp; Agro Chemicals</p>
    </div>
    <div style="padding:35px 30px">
      <h2 style="color:#2D5A27;margin:0 0 8px">Order Confirmed! ✅</h2>
      <p style="color:#666;margin:0 0 25px">Dear <strong>${userName}</strong>, your order has been successfully placed.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-bottom:25px;border-left:4px solid #2D5A27">
        <p style="margin:0;font-size:13px;color:#888">Order ID</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#333;letter-spacing:1px">#${orderId}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr style="background:#2D5A27">
            <th style="padding:12px;text-align:left;color:#fff">Product</th>
            <th style="padding:12px;text-align:center;color:#fff">Qty</th>
            <th style="padding:12px;text-align:right;color:#fff">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>${pricingRows}</tfoot>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:25px">
        <tr>
          <td style="width:50%;padding:0 8px 0 0;vertical-align:top">
            <div style="background:#f9f9f9;border-radius:8px;padding:15px">
              <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase">Payment</p>
              <p style="margin:5px 0 0;font-weight:600;color:#333">${order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '🏦 Bank Transfer'}</p>
            </div>
          </td>
          <td style="width:50%;padding:0 0 0 8px;vertical-align:top">
            <div style="background:#f9f9f9;border-radius:8px;padding:15px">
              <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase">Est. Delivery</p>
              <p style="margin:5px 0 0;font-weight:600;color:#333">3–5 Business Days</p>
            </div>
          </td>
        </tr>
      </table>
      <div style="background:#f9f9f9;border-radius:8px;padding:15px;margin-bottom:25px">
        <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase">Delivery Address</p>
        <p style="margin:5px 0 0;font-weight:600;color:#333">${addr.name}</p>
        <p style="margin:2px 0 0;color:#666">${addr.street}${addr.city ? ', ' + addr.city : ''}</p>
        ${addr.phone ? `<p style="margin:2px 0 0;color:#666">📞 ${addr.phone}</p>` : ''}
      </div>
    </div>
    <div style="background:#2D5A27;padding:25px 30px;text-align:center">
      <p style="color:rgba(255,255,255,0.8);margin:0;font-size:13px">Questions? Email us at <a href="mailto:${process.env.EMAIL_USER || process.env.ADMIN_EMAIL}" style="color:#C8A951">${process.env.EMAIL_USER || process.env.ADMIN_EMAIL}</a></p>
      <p style="color:rgba(255,255,255,0.5);margin:8px 0 0;font-size:12px">© ${new Date().getFullYear()} Arab Fertilizers &amp; Agro Chemicals</p>
    </div>`);

  const info = await sendViaResend({
    from: getSenderAddress(),
    to: email,
    subject: `✅ Order Confirmed — #${orderId} | Arab Fertilizer`,
    html,
  });

  console.log(`[mailer] ✅ Order confirmation sent to ${email} (id: ${info.messageId})`);
  return info;
};

// ─────────────────────────────────────────────────────────────────────────────
// sendAdminOrderNotification — new order alert to admin
// ─────────────────────────────────────────────────────────────────────────────
const sendAdminOrderNotification = async (order, userName) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('[mailer] ADMIN_EMAIL not set — skipping admin order notification');
    return;
  }

  const { itemsHtml, pricingRows } = buildOrderTableHtml(order);
  const addr = safeAddress(order);
  const orderId = idToString(order._id).substring(0, 12).toUpperCase();

  const html = emailWrapper(`
    <div style="background:linear-gradient(135deg,#5D4037,#2D5A27);padding:40px 30px;text-align:center">
      <h1 style="color:#C8A951;margin:0;font-size:28px;letter-spacing:1px">New Order Alert 🔔</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">A new order has been placed on Arab Fertilizer</p>
    </div>
    <div style="padding:35px 30px">
      <h2 style="color:#2D5A27;margin:0 0 8px">Action Required</h2>
      <p style="color:#666;margin:0 0 25px">Customer <strong>${userName}</strong> just placed a new order.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-bottom:25px;border-left:4px solid #C8A951">
        <p style="margin:0;font-size:13px;color:#888">Order ID</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#333;letter-spacing:1px">#${orderId}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr style="background:#2D5A27">
            <th style="padding:12px;text-align:left;color:#fff">Product</th>
            <th style="padding:12px;text-align:center;color:#fff">Qty</th>
            <th style="padding:12px;text-align:right;color:#fff">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>${pricingRows}</tfoot>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:25px">
        <tr>
          <td style="width:50%;padding:0 8px 0 0;vertical-align:top">
            <div style="background:#f9f9f9;border-radius:8px;padding:15px">
              <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase">Payment</p>
              <p style="margin:5px 0 0;font-weight:600;color:#333">${order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '🏦 Bank Transfer'}</p>
            </div>
          </td>
          <td style="width:50%;padding:0 0 0 8px;vertical-align:top">
            <div style="background:#f9f9f9;border-radius:8px;padding:15px">
              <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase">Customer</p>
              <p style="margin:5px 0 0;font-weight:600;color:#333">${userName}</p>
            </div>
          </td>
        </tr>
      </table>
      <div style="background:#f9f9f9;border-radius:8px;padding:15px">
        <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase">Delivery Address</p>
        <p style="margin:5px 0 0;font-weight:600;color:#333">${addr.name}</p>
        <p style="margin:2px 0 0;color:#666">${addr.street}${addr.city ? ', ' + addr.city : ''}</p>
        ${addr.phone ? `<p style="margin:2px 0 0;color:#666">📞 ${addr.phone}</p>` : ''}
      </div>
    </div>
    <div style="background:#2D5A27;padding:25px 30px;text-align:center">
      <p style="color:rgba(255,255,255,0.8);margin:0;font-size:13px">Log in to the admin panel to manage this order.</p>
    </div>`);

  const info = await sendViaResend({
    from: getSenderAddress(),
    to: adminEmail,
    subject: `🚨 New Order #${orderId} by ${userName} | Arab Fertilizer`,
    html,
  });

  console.log(`[mailer] ✅ Admin order notification sent to ${adminEmail} (id: ${info.messageId})`);
  return info;
};

// ─────────────────────────────────────────────────────────────────────────────
// sendPasswordResetOTP
// ─────────────────────────────────────────────────────────────────────────────
const sendPasswordResetOTP = async (email, userName, otp) => {
  if (!email) throw new Error('[mailer] sendPasswordResetOTP: email is required');

  const html = emailWrapper(`
    <div style="background:linear-gradient(135deg,#2D5A27,#5D4037);padding:40px 30px;text-align:center">
      <h1 style="color:#C8A951;margin:0;font-size:28px;letter-spacing:1px">Password Reset 🔐</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Arab Fertilizer</p>
    </div>
    <div style="padding:35px 30px">
      <h2 style="color:#2D5A27;margin:0 0 8px">Hello ${userName},</h2>
      <p style="color:#666;margin:0 0 25px;line-height:1.6">We received a request to reset your password. Use the code below — it expires in <strong>10 minutes</strong>.</p>
      <div style="background:#f0f8ee;border-radius:8px;padding:30px;margin-bottom:25px;text-align:center;border:2px dashed #2D5A27">
        <div style="font-size:40px;font-weight:800;color:#2D5A27;letter-spacing:10px;font-family:monospace">${otp}</div>
      </div>
      <p style="color:#888;font-size:13px;line-height:1.5">If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div style="background:#f9f9f9;padding:20px 30px;text-align:center;border-top:1px solid #eee">
      <p style="color:#999;margin:0;font-size:12px">© ${new Date().getFullYear()} Arab Fertilizers &amp; Agro Chemicals</p>
    </div>`);

  const info = await sendViaResend({
    from: getSenderAddress(),
    to: email,
    subject: `🔐 Your Password Reset Code: ${otp} | Arab Fertilizer`,
    html,
  });

  console.log(`[mailer] ✅ Password reset OTP sent to ${email} (id: ${info.messageId})`);
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

  const html = emailWrapper(`
    <div style="background:linear-gradient(135deg,#2D5A27,#5D4037);padding:30px;text-align:center">
      <h1 style="color:#C8A951;margin:0;font-size:24px">New Contact Inquiry 📩</h1>
    </div>
    <div style="padding:30px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-weight:600;color:#555;width:100px">From:</td><td style="padding:8px 0;color:#333">${formData.name} (${formData.email})</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;color:#555">Phone:</td><td style="padding:8px 0;color:#333">${formData.phone || 'N/A'}</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;color:#555">Subject:</td><td style="padding:8px 0;color:#333">${formData.subject}</td></tr>
      </table>
      <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin-top:20px;white-space:pre-wrap;color:#333;line-height:1.6">${formData.message}</div>
    </div>
    <div style="background:#f9f9f9;padding:15px 30px;border-top:1px solid #eee;text-align:center">
      <p style="color:#999;margin:0;font-size:12px">Sent from Arab Fertilizer Contact Form</p>
    </div>`);

  const info = await sendViaResend({
    from: getSenderAddress(),
    to: adminEmail,
    replyTo: formData.email,
    subject: `📩 Contact: ${formData.subject} — from ${formData.name}`,
    html,
  });

  console.log(`[mailer] ✅ Contact form email sent to ${adminEmail} (id: ${info.messageId})`);
  return info;
};

module.exports = {
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendPasswordResetOTP,
  sendContactEmail,
  testConnection,
};