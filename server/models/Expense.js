const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Couple', default: null },

  // Can be a personal expense or a shared couple expense
  type: { type: String, enum: ['personal', 'couple'], default: 'personal' },

  amount: { type: Number, required: true },
  category: {
    type: String,
    enum: ['food', 'groceries', 'outing', 'rent', 'commute', 'utilities', 'misc', 'other'],
    default: 'other'
  },
  description: { type: String, trim: true },

  date: { type: Date, default: Date.now },
  monthYear: { type: String, required: true }, // Format: "YYYY-MM" for easy filtering by month

  createdAt: { type: Date, default: Date.now }
});

// Indexing for faster queries when filtering expenses by month and user/couple
expenseSchema.index({ userId: 1, monthYear: 1 });
expenseSchema.index({ coupleId: 1, monthYear: 1 });

module.exports = mongoose.model('Expense', expenseSchema);