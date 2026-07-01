const mongoose = require('mongoose');

const coupleSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  inviteCode: { type: String, unique: true },
  inviteEmail: { type: String },
  isActive: { type: Boolean, default: false },
  budget: {
    rent: { type: Number, default: 0 },
    myCommute: { type: Number, default: 0 },
    otherFixed: { type: Number, default: 0 },
    breakdown: { type: Object, default: null },
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Couple', coupleSchema);