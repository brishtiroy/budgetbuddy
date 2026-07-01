const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', default: null },
  type: { type: String, enum: ['personal', 'couple'], default: 'personal' },
  name: { type: String, required: true },         // e.g. "Buy Dyson"
  targetAmount: { type: Number, required: true },  // e.g. 35000
  targetDate: { type: Date, required: true },      // e.g. May 2027
  monthlySaving: { type: Number },                 // auto-calculated
  savedSoFar: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Auto-calculate monthly saving before save
goalSchema.pre('save', async function() {
  const now = new Date();
  const target = new Date(this.targetDate);
  const monthsLeft = (target.getFullYear() - now.getFullYear()) * 12 
                   + (target.getMonth() - now.getMonth());
  if (monthsLeft > 0) {
    this.monthlySaving = Math.ceil((this.targetAmount - this.savedSoFar) / monthsLeft);
  }
});

module.exports = mongoose.model('Goal', goalSchema);