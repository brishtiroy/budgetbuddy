const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mode: { type: String, enum: ['single', 'couple'], default: 'single' },
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', default: null },
  salary: { type: Number, default: 0 },
  savingsPercent: { type: Number, default: 20 },

  // Feature: Day of the month (1-28) to send automated savings email reminder
  reminderDay: { type: Number, min: 1, max: 28, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);