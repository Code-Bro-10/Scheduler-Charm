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

  socket.on('send_notification', (data) => {
    io.to(data.room).emit('receive_notification', data);
  });

  // Handle meeting status change and send email
  socket.on('meeting_status_change', async (data) => {
    console.log("Status change event received:", data);
    
    // 1. Send Real-time notification to the user's browser
    io.to(data.to).emit('receive_notification', {
      message: `Your meeting "${data.meetingTitle}" has been ${data.status}.`,
      type: data.status
    });

    // 2. Send Email Reminder via Resend
    const subject = data.status === 'Approved' ? 'Meeting Approved! 🚀' : 'Meeting Status Update';
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
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
