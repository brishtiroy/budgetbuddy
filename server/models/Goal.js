const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  monthYear: { type: String, required: true }
});

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', default: null },
  type: { type: String, enum: ['personal', 'couple'], default: 'personal' },
  name: { type: String, required: true },         // e.g. "Buy Dyson"
  targetAmount: { type: Number, required: true },  // e.g. 35000
  targetDate: { type: Date, required: true },      // e.g. May 2027

  status: { type: String, enum: ['in_progress', 'paused', 'completed'], default: 'in_progress' },

  splitRatio: {
    user1Percent: { type: Number, default: 50 },
    user2Percent: { type: Number, default: 50 },
    isCustom: { type: Boolean, default: false }
  },

  contributions: [contributionSchema],

  monthlySaving: { type: Number },                 // auto-calculated
  savedSoFar: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Auto-calculate monthly saving before save
goalSchema.pre('save', async function () {

  // 1. Automatically sum up all contributions to keep savedSoFar accurate
  if (this.contributions && this.contributions.length > 0) {
    this.savedSoFar = this.contributions.reduce((total, item) => total + item.amount, 0)
  }

  // 2. Check if goal has been reached!
  if (this.savedSoFar >= this.targetAmount) {
    this.status = 'completed';
    this.monthlySaving = 0;
    return;
  }

  // 3. Dynamically recalculate required monthly saving if still in progress
  if (this.status !== 'paused') {
    const now = new Date();
    const target = new Date(this.targetDate);
    const monthsLeft = (target.getFullYear() - now.getFullYear()) * 12
      + (target.getMonth() - now.getMonth());
    if (monthsLeft > 0) {
      this.monthlySaving = Math.ceil((this.targetAmount - this.savedSoFar) / monthsLeft);
    } else {
      // If target date is this month or passed, remaining amount is due now
      this.monthlySaving = Math.max(0, this.targetAmount - this.savedSoFar);
    }
  } else {
    this.monthlySaving = 0; // Don't require monthly savings while paused
  }
});

module.exports = mongoose.model('Goal', goalSchema);