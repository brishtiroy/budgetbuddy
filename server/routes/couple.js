const router = require('express').Router();
const Couple = require('../models/Couple');
const User = require('../models/User');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate a 6-char invite code
function generateCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. "A3F7B2"
}

// Create couple and send invite email
router.post('/invite', auth, async (req, res) => {
  try {
    const { partnerEmail } = req.body;
    const code = generateCode();

    const couple = new Couple({
      user1: req.userId,
      inviteCode: code,
      inviteEmail: partnerEmail
    });
    await couple.save();

    // Update user1's coupleId and mode
    await User.findByIdAndUpdate(req.userId, { coupleId: couple._id, mode: 'couple' });

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: partnerEmail,
      subject: 'You have been invited to BudgetBuddy 💑',
      html: `
        <h2>Your partner invited you to BudgetBuddy!</h2>
        <p>Use this code when you sign up: <strong style="font-size:24px">${code}</strong></p>
        <p>Sign up at: <a href="http://localhost:5173/register">http://localhost:5173/register</a></p>
      `
    });

    res.json({ message: 'Invite sent!', code }); // Return code too so user can share manually
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join couple with code
router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const couple = await Couple.findOne({ inviteCode: code, isActive: false });
    if (!couple) return res.status(400).json({ message: 'Invalid or expired code' });

    couple.user2 = req.userId;
    couple.isActive = true;
    await couple.save();

    await User.findByIdAndUpdate(req.userId, { coupleId: couple._id, mode: 'couple' });

    res.json({ message: 'Joined successfully!', coupleId: couple._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get couple details (both partners' salaries, joint expenses)
router.get('/details', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.coupleId) return res.status(400).json({ message: 'Not in a couple' });

    const couple = await Couple.findById(user.coupleId)
      .populate('user1', 'name salary savingsPercent')
      .populate('user2', 'name salary savingsPercent');

    res.json(couple);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update joint expenses
router.put('/expenses', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const couple = await Couple.findByIdAndUpdate(
      user.coupleId,
      { jointExpenses: req.body },
      { new: true }
    );
    res.json(couple);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;