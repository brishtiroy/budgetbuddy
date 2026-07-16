const mongoose = require('mongoose');

const coupleSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  inviteCode: { type: String, unique: true },
  inviteEmail: { type: String },
  isActive: { type: Boolean, default: false },

  // Feature: Joint reminder day
  reminderDay: { type: Number, min: 1, max: 28, default: 1 },

  budget: {
    rent: { type: Number, default: 0 },
    myCommute: { type: Number, default: 0 },
    otherFixed: { type: Number, default: 0 },
    breakdown: { type: Object, default: null },
  },

  // Fix: Explicitly added jointExpenses so PUT /expenses doesn't get ignored by Mongoose strict mode
  jointExpenses: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Couple', coupleSchema);