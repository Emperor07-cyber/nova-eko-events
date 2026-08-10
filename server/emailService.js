const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

const DEFAULT_BRAND_NAME = process.env.EMAIL_DEFAULT_BRAND_NAME || 'Ekotix';
const DEFAULT_SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'Ekotix234@gmail.com';
const DEFAULT_LOGO_URL = process.env.EMAIL_DEFAULT_LOGO_URL || 'https://www.ekotixx.com/images/Logo1.jpg';

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

const formatNaira = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const readEventBranding = (event = {}) => {
  const branding = event.emailBranding || {};
  return {
    brandName: branding.brandName || event.title || DEFAULT_BRAND_NAME,
    supportEmail: branding.supportEmail || event.hostEmail || DEFAULT_SUPPORT_EMAIL,
    logoUrl: branding.logoUrl || event.image || DEFAULT_LOGO_URL,
    primaryColor: branding.primaryColor || '#10612B',
    accentColor: branding.accentColor || '#1F7A47',
    footerNote: branding.footerNote || `Thanks for choosing ${branding.brandName || event.title || DEFAULT_BRAND_NAME}.`,
  };
};

const getFromAddress = (brand) => {
  if (process.env.EMAIL_FROM) {
    return process.env.EMAIL_FROM;
  }

  return `"${brand.brandName}" <${process.env.SMTP_USER || DEFAULT_SUPPORT_EMAIL}>`;
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildLine = (label, value) => `
  <tr>
    <td style="padding:10px 0;color:#64748b;font-size:14px;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(value)}</td>
  </tr>
`;

const buildReceiptHtml = ({ ticket, event, branding, resend = false }) => {
  const title = event?.title || ticket?.eventTitle || 'Your event';
  const date = event?.date === 'TBA' ? 'To be announced' : event?.date || 'Not set';
  const location = event?.location || 'Location not set';
  const ticketType = ticket?.ticketType || ticket?.type || 'General';
  const quantity = Number(ticket?.quantity || 1);
  const baseAmount = Number(ticket?.totalPaid || ticket?.hostFee || 0);
  const platformFee = Number(ticket?.serviceFee || ticket?.platformFee || 0);
  const totalCharged = Number(ticket?.totalCharged || baseAmount + platformFee || 0);
  const qrValue = ticket?.token || ticket?.transactionId || ticket?.id || '';
  const supportEmail = branding.supportEmail || DEFAULT_SUPPORT_EMAIL;
  const brandName = branding.brandName || DEFAULT_BRAND_NAME;

  return `
    <div style="margin:0;padding:0;background:#f4f7f4;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:680px;margin:0 auto;padding:24px;">
        <div style="background:#ffffff;border:1px solid #dbe7dd;border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(16,97,43,0.08);">
          <div style="background:linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor});padding:28px;color:#ffffff;text-align:center;">
            <img src="${escapeHtml(branding.logoUrl)}" alt="${escapeHtml(brandName)}" style="width:72px;height:72px;object-fit:cover;border-radius:18px;background:#ffffff;margin-bottom:14px;" />
            <h1 style="margin:0 0 8px;font-size:28px;line-height:1.2;">${escapeHtml(brandName)}</h1>
            <p style="margin:0;font-size:16px;opacity:0.95;">${resend ? 'Ticket email resend' : 'Your ticket receipt'}</p>
          </div>

          <div style="padding:28px;">
            <p style="margin:0 0 16px;color:#0f172a;font-size:16px;">Hi ${escapeHtml(ticket?.name || ticket?.email || 'there')},</p>
            <p style="margin:0 0 22px;color:#475569;line-height:1.7;">
              ${resend ? 'Here is your ticket receipt again. You can use the QR code below at check-in.' : 'Thanks for your purchase. Your ticket has been confirmed and is ready for check-in.'}
            </p>

            <div style="display:block;text-align:center;margin:24px 0;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrValue)}" alt="Ticket QR code" style="width:200px;height:200px;border:8px solid #eef6ef;border-radius:18px;" />
              <p style="margin:12px 0 0;color:#64748b;font-size:13px;">Order reference: ${escapeHtml(ticket?.transactionId || ticket?.id || '')}</p>
            </div>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              ${buildLine('Event', title)}
              ${buildLine('Date', date)}
              ${buildLine('Location', location)}
              ${buildLine('Ticket type', ticketType)}
              ${buildLine('Quantity', String(quantity))}
              ${buildLine('Base amount', formatNaira(baseAmount))}
              ${buildLine('Service fee', formatNaira(platformFee))}
              ${buildLine('Total paid', formatNaira(totalCharged))}
            </table>

            <div style="margin-top:24px;padding:18px;border-radius:16px;background:#f0f8f2;border:1px solid #d9eadf;">
              <p style="margin:0 0 6px;color:#0f172a;font-weight:700;">Need help?</p>
              <p style="margin:0;color:#475569;line-height:1.7;">
                Contact ${escapeHtml(supportEmail)} if anything looks off.
              </p>
            </div>
          </div>

          <div style="padding:18px 28px 28px;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
            ${escapeHtml(branding.footerNote)}
          </div>
        </div>
      </div>
    </div>
  `;
};

const buildReceiptText = ({ ticket, event, branding, resend = false }) => {
  const title = event?.title || ticket?.eventTitle || 'Your event';
  const date = event?.date === 'TBA' ? 'To be announced' : event?.date || 'Not set';
  const location = event?.location || 'Location not set';
  const ticketType = ticket?.ticketType || ticket?.type || 'General';
  const quantity = Number(ticket?.quantity || 1);
  const baseAmount = Number(ticket?.totalPaid || ticket?.hostFee || 0);
  const platformFee = Number(ticket?.serviceFee || ticket?.platformFee || 0);
  const totalCharged = Number(ticket?.totalCharged || baseAmount + platformFee || 0);

  return [
    `${resend ? 'Ticket email resend' : 'Ticket receipt'} from ${branding.brandName || DEFAULT_BRAND_NAME}`,
    `Event: ${title}`,
    `Date: ${date}`,
    `Location: ${location}`,
    `Ticket type: ${ticketType}`,
    `Quantity: ${quantity}`,
    `Base amount: ${formatNaira(baseAmount)}`,
    `Service fee: ${formatNaira(platformFee)}`,
    `Total paid: ${formatNaira(totalCharged)}`,
    `Support: ${branding.supportEmail || DEFAULT_SUPPORT_EMAIL}`,
  ].join('\n');
};

const sendTicketReceiptEmail = async ({ ticket, event, resend = false }) => {
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  if (!ticket?.email) {
    throw new Error('Ticket email is missing');
  }

  const branding = readEventBranding(event || {});
  const subject = `${branding.brandName} ${resend ? 'ticket resend' : 'ticket receipt'} - ${event?.title || ticket?.eventTitle || 'Event'}`;
  const html = buildReceiptHtml({ ticket, event, branding, resend });
  const text = buildReceiptText({ ticket, event, branding, resend });

  await transporter.sendMail({
    from: getFromAddress(branding),
    to: ticket.email,
    replyTo: branding.supportEmail || DEFAULT_SUPPORT_EMAIL,
    subject,
    text,
    html,
  });

  return { sent: true, brandName: branding.brandName, supportEmail: branding.supportEmail };
};

const loadEventById = async (eventId) => {
  if (!eventId) return null;
  const snap = await admin.database().ref(`events/${eventId}`).once('value');
  return snap.val() || null;
};

module.exports = {
  loadEventById,
  readEventBranding,
  sendTicketReceiptEmail,
};
