const nodemailer = require("nodemailer");

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password (16 chars, no spaces)
    },
  });
};

/**
 * Send order confirmation email to customer
 * @param {string} toEmail - Customer's email address
 * @param {Object} order   - Order object from MongoDB
 */
const sendOrderConfirmation = async (toEmail, order) => {
  const transporter = createTransporter();

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;">${
          item.name
        }</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${
          item.quantity
        }</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">
          PKR ${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#2D5A27;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">
                🌿 Arab Fertilizers &amp; Agro Chemicals
              </h1>
              <p style="margin:8px 0 0;color:#b8d9b4;font-size:14px;">
                Order Confirmation
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">
                Dear <strong>${order.shippingAddress?.fullName || "Valued Customer"}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#555;line-height:1.6;">
                Thank you for your order! We've received it and will process it shortly.
              </p>

              <!-- Order Info -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f9f9f9;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="color:#888;font-size:13px;">Order ID</td>
                        <td style="color:#333;font-size:13px;font-weight:bold;text-align:right;">
                          #${order._id}
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#888;font-size:13px;">Payment Method</td>
                        <td style="color:#333;font-size:13px;text-align:right;">
                          ${order.paymentMethod === "cod" ? "Cash on Delivery" : "JazzCash"}
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#888;font-size:13px;">Order Date</td>
                        <td style="color:#333;font-size:13px;text-align:right;">
                          ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-PK", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <h3 style="margin:0 0 12px;color:#2D5A27;font-size:16px;">Order Summary</h3>
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border:1px solid #eee;border-radius:6px;border-collapse:collapse;">
                <thead>
                  <tr style="background:#2D5A27;">
                    <th style="padding:10px 8px;text-align:left;color:#fff;font-size:13px;border-radius:6px 0 0 0;">
                      Product
                    </th>
                    <th style="padding:10px 8px;text-align:center;color:#fff;font-size:13px;">
                      Qty
                    </th>
                    <th style="padding:10px 8px;text-align:right;color:#fff;font-size:13px;border-radius:0 6px 0 0;">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2"
                        style="padding:12px 8px;font-weight:bold;color:#333;border-top:2px solid #2D5A27;">
                      Total
                    </td>
                    <td style="padding:12px 8px;font-weight:bold;color:#2D5A27;
                               text-align:right;border-top:2px solid #2D5A27;font-size:16px;">
                      PKR ${order.totalAmount?.toLocaleString() || "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <!-- Shipping Address -->
              ${
                order.shippingAddress
                  ? `
              <h3 style="margin:24px 0 12px;color:#2D5A27;font-size:16px;">Shipping Address</h3>
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f9f9f9;border-radius:6px;">
                <tr>
                  <td style="padding:16px 20px;color:#555;line-height:1.7;font-size:14px;">
                    ${order.shippingAddress.fullName}<br/>
                    ${order.shippingAddress.address}<br/>
                    ${order.shippingAddress.city}, ${order.shippingAddress.province}<br/>
                    ${order.shippingAddress.phone || ""}
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <p style="margin:28px 0 0;color:#555;line-height:1.6;">
                If you have any questions, reply to this email or contact us.<br/>
                <strong style="color:#2D5A27;">Arab Fertilizers &amp; Agro Chemicals</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f0f0;padding:18px 32px;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;">
                © ${new Date().getFullYear()} Arab Fertilizers &amp; Agro Chemicals.
                All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const mailOptions = {
    from: `"Arab Fertilizers" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `✅ Order Confirmed — #${order._id}`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${toEmail} — MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send email to ${toEmail}:`, err.message);
    throw err;
  }
};

/**
 * Send a generic email (contact form, admin alerts, etc.)
 * @param {string} to      - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html    - HTML body
 */
const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Arab Fertilizers" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} — MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
    throw err;
  }
};

module.exports = { sendOrderConfirmation, sendEmail };