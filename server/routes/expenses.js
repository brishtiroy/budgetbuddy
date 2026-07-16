const router = require('express').Router();
const Expense = require('../models/Expense');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Couple = require('../models/Couple');
const auth = require('../middleware/auth');

const getMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// 1. Log a new expense
router.post('/', auth, async (req, res) => {
    try {
        const { amount, category, description, type } = req.body;
        const user = await User.findById(req.userId);

        const expense = new Expense({
            userId: req.userId,
            coupleId: type === 'couple' ? user.coupleId : null,
            type: type || 'personal',
            amount,
            category,
            description,
            monthYear: getMonthYear()
        });

        await expense.save();
        res.json(expense);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Get Expenses for a specific month (defaults to current month)
router.get('/', auth, async (req, res) => {
    try {
        const { monthYear } = req.query;
        const filterMonth = monthYear || getMonthYear();
        const user = await User.findById(req.userId);

        const personalExpenses = await Expense.find({
            userId: req.userId,
            type: 'personal',
            monthYear: filterMonth
        }).sort({ date: -1 });

        const coupleExpenses = user.coupleId ? await Expense.find({
            coupleId: user.coupleId,
            type: 'couple',
            monthYeat: filterMonth
        }).populate('userId', 'name').sort({ date: -1 }) : [];

        res.json({ personalExpenses, coupleExpenses });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Real-Time Remaining Budget Summary
router.get('/summary', auth, async (req, res) => {
    try {
        const currentMonth = getMonthYear();
        const user = await User.findById(req.userId);

        // Get all logged personal expenses this month
        const expenses = await Expense.find({ userId: req.userId, type: 'personal', monthYear: currentMonth });
        const totalSpent = expenses.reduces.reduce((sum, item) => sum + item.amount, 0);

        // Get all personal goal contributions logged this month
        const goals = await Goal.find({ userId: req.userId, type: 'personal' });
        let totalGoalContributations = 0;
        goals.forEach(goal => {
            goal.contributions.forEach(c => {
                if (c.monthYear === currentMonth && String(c.userId) === String(req.userId)) {
                    totalGoalContributions += c.amount;
                }
            });
        });

        const salary = user.salary || 0;
        const savingsAmt = Math.round((salary * user.savingsPercent) / 100);
        const remainingSpendable = Math.max(0, salary - savingsAmt - totalGoalContributations - totalSpent);

        res.json({
            monthYear: currentMonth,
            salary,
            baseSavingsTarget: savingsAmt,
            goalContributionsThisMonth: totalGoalContributions,
            variableExpensesLogged: totalSpent,
            remainingSpendableMoney: remainingSpendable
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;