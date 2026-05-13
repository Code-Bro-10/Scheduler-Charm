const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { sendMeetingEmail } = require('./utils/mailer');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (email) => {
    socket.join(email);
    console.log(`User joined room: ${email}`);
  });

  // Handle Initial Meeting Invitation Email
  socket.on('send_invitation_email', async (data) => {
    console.log("Invitation email request received:", data);
    try {
      await sendMeetingEmail(
        data.to,
        `New Meeting Invitation: ${data.meetingTitle}`,
        data.userName,
        data.meetingTitle,
        data.date,
        data.time,
        'Pending',
        data.meetingUrl
      );
    } catch (err) {
      console.error("Failed to send invitation email:", err);
    }
  });

  // NEW: Handle "Meeting Started" Email
  socket.on('meeting_started', async (data) => {
    console.log("Meeting started event received:", data);
    // Send email to all participants in the group
    const participants = data.participants; // Array of {email, name}
    
    for (const p of participants) {
      try {
        await sendMeetingEmail(
          p.email,
          `⚠️ SESSION STARTING: ${data.meetingTitle}`,
          p.name,
          data.meetingTitle,
          data.date,
          data.time,
          'Approved', // Mark as approved/ready to join
          data.meetingUrl
        );
        console.log(`Start notification sent to ${p.email}`);
      } catch (err) {
        console.error(`Failed to send start email to ${p.email}:`, err);
      }
    }
  });

  // Handle meeting status change (Approve/Reject)
  socket.on('meeting_status_change', async (data) => {
    console.log("Status change event received:", data);
    io.to(data.to).emit('receive_notification', {
      message: `Your meeting "${data.meetingTitle}" has been ${data.status}.`,
      type: data.status
    });

    try {
      const subject = data.status === 'Approved' ? 'Meeting Approved! 🚀' : 'Meeting Declined ❌';
      await sendMeetingEmail(
        data.to,
        subject,
        data.userName,
        data.meetingTitle,
        data.date,
        data.time,
        data.status,
        data.meetingUrl
      );
    } catch (err) {
      console.error("Failed to send status update email:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
