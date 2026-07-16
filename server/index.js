const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const User = require('./models/User');
const Couple = require('./models/Couple');
require('dotenv').config();

const app = express();

// CORS — manual headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/couple', require('./routes/couple'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/analytics', require('./routes/analytics'));

// Test route
app.get('/ping', (req, res) => res.json({ ok: true }));

// ==========================================
// AUTOMATED CRON JOB: Savings Reminders
// Runs daily at 09:00 AM server time
// ==========================================
cron.schedule('0 9 * * *', async () => {
  try {
    const today = new Date().getDate(); // Returns day of month (1-31)
    console.log(`[Cron] Checking savings reminders for Day ${today}...`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('[Cron] Email credentials missing, skipping reminders.');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    // 1. Send reminders to Single Users whose reminderDay matches today
    const singleUsers = await User.find({ mode: 'single', reminderDay: today });
    for (const user of singleUsers) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '💰 BudgetBuddy Reminder: Log Your Monthly Savings!',
        html: `
          <h3>Hey ${user.name}!</h3>
          <p>This is your automated reminder to log your monthly savings and check your progress toward your financial goals today.</p>
          <p>Log in now to allocate your savings: <a href="http://localhost:5173/dashboard">BudgetBuddy Dashboard</a></p>
        `
      });
      console.log(`[Cron] Sent personal reminder to ${user.email}`);
    }

    // 2. Send joint reminders to Couples whose reminderDay matches today
    const activeCouples = await Couple.find({ isActive: true, reminderDay: today })
      .populate('user1', 'name email')
      .populate('user2', 'name email');

    for (const couple of activeCouples) {
      const recipients = [couple.user1?.email, couple.user2?.email].filter(Boolean);
      if (recipients.length > 0) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipients,
          subject: '💑 BudgetBuddy Couple Reminder: Time for your monthly savings check-in!',
          html: `
            <h3>Hey ${couple.user1?.name} & ${couple.user2?.name}!</h3>
            <p>It's your scheduled joint reminder day! Grab a cup of coffee, review your monthly budget, and log your contributions toward your joint goals.</p>
            <p><a href="http://localhost:5173/couple-dashboard">Open Couple Dashboard</a></p>
          `
        });
        console.log(`[Cron] Sent joint reminder to couple: ${recipients.join(', ')}`);
      }
    }
  } catch (err) {
    console.error('[Cron Error]:', err.message);
  }
});


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.error('MongoDB error:', err));