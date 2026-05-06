const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Employee = require('../models/Employee');

// Configure Nodemailer transporter (you would typically use environment variables)
// For this demo, using an ethereal test account or simple config
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'mylene.strosin78@ethereal.email', 
    pass: process.env.EMAIL_PASS || 'd8gA98eAkvB18eHwWd',
  },
});

// GET all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST add an employee and send email
router.post('/', async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Check if exists
    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Employee already exists' });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    const employee = new Employee({ name, email, role, password: tempPassword });
    await employee.save();

    // Send email to the user
    try {
      const mailOptions = {
        from: '"Scheduler Charm Admin" <admin@schedulercharm.com>',
        to: email,
        subject: 'Welcome to Scheduler Charm!',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #7c3aed;">Welcome, ${name}!</h2>
            <p>You have been added to the <strong>Scheduler Charm</strong> platform as a <strong>${role}</strong>.</p>
            <p>You can now log in to your portal to manage your meetings and schedule.</p>
            <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Your Login Credentials:</strong></p>
              <p style="margin: 5px 0 0 0;">Email: ${email}</p>
              <p style="margin: 5px 0 0 0;">Password: <strong>${tempPassword}</strong></p>
            </div>
            <p>Please log in and change your password as soon as possible.</p>
            <br/>
            <p>Best regards,<br/>The Scheduler Charm Team</p>
          </div>
        `
      };
      const info = await transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // We don't fail the whole request if email fails, but it's good to log
    }

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE an employee
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
