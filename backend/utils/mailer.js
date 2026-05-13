const nodemailer = require('nodemailer');
require('dotenv').config();

// Auto-clean the password in code (removes spaces just for the connection)
// This respects the user's preference to keep spaces in the .env file
const cleanPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: cleanPass, 
  },
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Mail Server Connection Error:', error);
  } else {
    console.log('✅ Mail Server is ready to take our messages');
  }
});

const sendMeetingEmail = async (to, subject, userName, meetingTitle, date, time, status, meetingUrl) => {
  console.log(`📧 Attempting to send email to: ${to}...`);
  
  const mailOptions = {
    from: `"Scheduler Charm" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 15px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px;">
          <h2 style="color: #6366f1; margin-bottom: 5px;">Scheduler Charm</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 0;">Enterprise Meeting Orchestration</p>
        </div>
        
        <div style="padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #f3f4f6;">
          <h3 style="color: #111827; margin-top: 0;">Hello ${userName},</h3>
          <p style="color: #4b5563; line-height: 1.6;">
            ${status === 'Pending' 
              ? `You have been invited to a new meeting: <strong>${meetingTitle}</strong>.` 
              : `Important update regarding your meeting: <strong>${meetingTitle}</strong>.`}
          </p>
          
          <div style="margin: 20px 0; border-left: 4px solid #6366f1; padding-left: 15px;">
            <p style="margin: 5px 0; font-size: 14px; color: #374151;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #374151;"><strong>⏰ Time:</strong> ${time}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #374151;"><strong>📊 Status:</strong> <span style="color: ${status === 'Approved' ? '#059669' : status === 'Rejected' ? '#dc2626' : '#d97706'}">${status}</span></p>
          </div>

          ${status === 'Approved' || status === 'Pending' ? `
            <div style="text-align: center; margin-top: 30px;">
              <a href="${meetingUrl}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                Join Virtual Meeting
              </a>
              <p style="color: #9ca3af; font-size: 11px; margin-top: 15px;">Alternatively, copy this link: <br/> ${meetingUrl}</p>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 25px; color: #9ca3af; font-size: 12px;">
          <p>&copy; 2026 Scheduler Charm. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email successfully delivered to ${to}. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ CRITICAL: Email failed to send to ${to}:`, error);
    throw error;
  }
};

module.exports = { sendMeetingEmail };
