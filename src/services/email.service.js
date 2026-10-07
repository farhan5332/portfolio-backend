import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Created on first use, so the app still starts when SMTP is not configured.
let transporter;

const getTransporter = () => {
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
};

// Header values must be a single line
const oneLine = (value) => String(value).replace(/[\r\n]+/g, ' ').trim();

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Emails the site owner about a new contact form message.
// Returns false (without throwing) when SMTP is not set up.
export const sendContactNotification = async ({ name, email, subject, message }) => {
  if (!env.smtp.enabled) return false;

  const title = oneLine(subject || `New message from ${name}`);

  await getTransporter().sendMail({
    from: `"Portfolio contact form" <${env.smtp.from}>`,
    to: env.smtp.to,
    replyTo: { name: oneLine(name), address: email }, // "Reply" goes straight to the visitor
    subject: `[Portfolio] ${title}`,
    text: `From: ${name} <${email}>\nSubject: ${subject || '-'}\n\n${message}`,
    html: `
      <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject || '-')}</p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    `,
  });
  return true;
};
