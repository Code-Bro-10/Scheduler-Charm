const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMeetingEmail = async (to, subject, userName, meetingTitle, date, time, status, meetingUrl) => {
  try {
    const mailOptions = {
      from: `"Scheduler Charm" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #09090b; color: white; border: 1px solid #333; border-radius: 24px;">
          <div style="text-align: center; margin-bottom: 30px;">
             <div style="width: 60px; hieght: 60px; background: linear-gradient(135deg, #7c3aed, #3b82f6); border-radius: 15px; margin: auto; display: inline-block; padding: 10px;">
                <span style="font-size: 30px;">⚡</span>
             </div>
             <h1 style="color: white; margin-top: 15px;">Scheduler Charm</h1>
          </div>
          
          <p style="font-size: 18px;">Hi <strong>${userName}</strong>,</p>
          <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">
            Your meeting request for <strong>"${meetingTitle}"</strong> has been processed by the system.
          </p>
          
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 25px; border-radius: 20px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">Current Status</p>
            <p style="margin: 5px 0 20px 0; font-size: 24px; font-bold; color: ${status === 'Approved' ? '#22c55e' : '#ef4444'}; text-transform: uppercase;">${status}</p>
            
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
              <p style="margin: 5px 0; color: #d4d4d8;">📅 <strong>Date:</strong> ${date}</p>
              <p style="margin: 5px 0; color: #d4d4d8;">🕒 <strong>Time:</strong> ${time}</p>
            </div>
          </div>
          
          ${status === 'Approved' ? `
            <div style="text-align: center; margin-top: 40px;">
              <a href="${meetingUrl}" style="background: linear-gradient(to right, #7c3aed, #3b82f6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);">
                Launch Virtual Meeting Room
              </a>
              <p style="color: #71717a; font-size: 12px; margin-top: 20px;">Meeting link: ${meetingUrl}</p>
            </div>
          ` : `
            <p style="color: #71717a; text-align: center;">If you believe this is an error, please reach out to your administrator.</p>
          `}
          
          <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; font-size: 12px; color: #52525b;">
            <p>© 2026 Scheduler Charm AI. Futuristic Meeting Management.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (err) {
    console.error("Nodemailer Error:", err);
  }
};

module.exports = { sendMeetingEmail };
