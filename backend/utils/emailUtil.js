import nodemailer from 'nodemailer';
import path from 'path';

import { createConfirmToken } from './tokenUtil.js';
import config from '../config.js';

const APP_URL = `http://localhost:${process.env.APP_PORT}`;

const transporter = nodemailer.createTransport({
  host: config.EMAIL_HOST, port: config.EMAIL_PORT, secure: true,
  auth: { user: config.EMAIL_USER, pass: config.EMAIL_PASSWORD }
});

export const sendEmailConfirmation = async (user, email) => {
  try {
    user.email = email;
    send(user, 'Confirm your email address',
`
<div>To confirm your email address, please click on the following
  <b><a href="${APP_URL}/email-confirmation/${await createConfirmToken(user, email)}" style="color: #94c255; text-decoration: none;">link</a></b>.
  It will <b style="color: #9583a7;">expire soon</b> and can only be <b style="color: #9583a7;">used once</b>.
</div><br>
<div>If you did not request this email, please ignore it.</div>
`
    );
  } catch (err) {
    err.message = `Email sending failed: ${err.message}`;
    throw err;
  }
};

export const sendPasswordReset = async (user) => {
  try {
    send(user, 'Reset your password',
`
<div>A request has been made to reset your password. To set a new password, please use the following
  <b><a href="${APP_URL}/password-reset/${await createConfirmToken(user)}" style="color: #94c255; text-decoration: none;">link</a></b>.
  The link will <b style="color: #9583a7;">expire soon</b> and can only be <b style="color: #9583a7;">used once</b>.
</div><br>
<div>If you did not request this email, you can safely ignore it.</div>
`
    );
  } catch (err) {
    err.message = `Email sending failed: ${err.message}`;
    throw err;
  }
};

export const sendCalendarParticipation = async (user, calendar, token) => {
  try {
    send(user, 'Confirm your participation in the calendar',
`
<div>You have been invited to be a participant of the calendar <b>${calendar.name}</b>. To confirm your participation, please click on the following
  <b><a href="${APP_URL}/participation-confirmation/${token}?entity=calendar" style="color: #94c255; text-decoration: none;">link</a></b>.
  It will <b style="color: #9583a7;">expire soon</b> and can only be <b style="color: #9583a7;">used once</b>.
</div><br>
<div>If you did not expect this invitation, please ignore or cancel it.</div>
`
    );
  } catch (err) {
    err.message = `Email sending failed: ${err.message}`;
    throw err;
  }
};

const send = (user, subject, content) => {
  transporter.sendMail({
    from: `"Chronos" <${config.EMAIL_USER}>`,
    to: user.email,
    subject: 'Chronos: ' + subject,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chronos: ${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
</head>
<body style="background: #f1f1f1; color: #200c34; font: 1rem 'Poppins', sans-serif; padding: 20px; text-align: center;">
  <div style="background: #fefefe; border-radius: 15px; padding: 15px; width: 500px; max-width: 80%; margin: auto;">
    <div style="color: #573a74; font-size: 1.8rem;"><b>Hello, ${user.login}!</b></div>
    <br>
    ${content}
    <br>
    <div>Best regards,</div>
    <div style="color: transparent; font-size: 0.1rem;">Chronos</div>
    <a href="${APP_URL}"><img src="cid:logo" style="width: 150px;" alt="Chronos"></a>
  </div>
</body>
</html>
`,
    attachments: [{ filename: 'logo.png', path: path.join('db', 'logo.png'), cid: 'logo' }],
  }, (err) => {
    err.message = `Sending failed: ${err.message}`;
    throw err;
  });
};
