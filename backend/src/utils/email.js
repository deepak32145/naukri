const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 10 s — fail fast instead of hanging
  socketTimeout: 10000,
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Naukri Clone" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email send error:', error.message);
  }
};

const emailTemplates = {
  verifyEmail: (name, otp) => ({
    subject: 'Verify your Naukri account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#4f46e5;">Welcome to Naukri Clone!</h2>
        <p>Hi ${name},</p>
        <p>Your email verification OTP is:</p>
        <div style="background:#f3f4f6;padding:20px;text-align:center;border-radius:8px;margin:20px 0;">
          <span style="font-size:32px;font-weight:bold;color:#4f46e5;letter-spacing:8px;">${otp}</span>
        </div>
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p style="color:#6b7280;font-size:12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  }),

  passwordReset: (name, otp) => ({
    subject: 'Reset your Naukri password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#4f46e5;">Password Reset</h2>
        <p>Hi ${name},</p>
        <p>Your password reset OTP is:</p>
        <div style="background:#f3f4f6;padding:20px;text-align:center;border-radius:8px;margin:20px 0;">
          <span style="font-size:32px;font-weight:bold;color:#4f46e5;letter-spacing:8px;">${otp}</span>
        </div>
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p style="color:#6b7280;font-size:12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),

  applicationStatus: (candidateName, jobTitle, companyName, status) => ({
    subject: `Application Update: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#4f46e5;">Application Status Update</h2>
        <p>Hi ${candidateName},</p>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;">New Status: <strong style="color:#4f46e5;">${status.replace(/_/g, ' ').toUpperCase()}</strong></p>
        </div>
        <p>Log in to your account to view more details.</p>
      </div>
    `,
  }),

  interviewScheduled: (candidateName, jobTitle, companyName, date, time, mode, link) => ({
    subject: `Interview Scheduled: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#4f46e5;">Interview Scheduled!</h2>
        <p>Hi ${candidateName},</p>
        <p>Your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been scheduled.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:20px 0;">
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Mode:</strong> ${mode}</p>
          ${link ? `<p><strong>Link:</strong> <a href="${link}">${link}</a></p>` : ''}
        </div>
        <p>Best of luck!</p>
      </div>
    `,
  }),

  jobAlert: (candidateName, jobs) => ({
    subject: `New job matches for you!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#4f46e5;">New Job Matches</h2>
        <p>Hi ${candidateName},</p>
        <p>We found new jobs matching your preferences:</p>
        ${jobs.map(job => `
          <div style="border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin:12px 0;">
            <h3 style="margin:0 0 8px;color:#111827;">${job.title}</h3>
            <p style="margin:0;color:#6b7280;">${job.company} • ${job.location}</p>
            ${job.salary ? `<p style="margin:4px 0;color:#4f46e5;">₹${job.salary}</p>` : ''}
          </div>
        `).join('')}
        <p>Log in to apply now!</p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
