require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scheduler_charm';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const adminExists = await Employee.findOne({ email: 'admin@scheduler.com' });
    if (!adminExists) {
      const admin = new Employee({
        name: 'Master Admin',
        email: 'admin@scheduler.com',
        password: 'adminpassword',
        role: 'Admin'
      });
      await admin.save();
      console.log('Default Admin user created! (Email: admin@scheduler.com, Password: adminpassword)');
    } else {
      console.log('Admin user already exists.');
    }
    
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Error:', err);
    mongoose.connection.close();
  });
