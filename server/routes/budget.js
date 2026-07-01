const router = require('express').Router();
const User = require('../models/User');
const Couple = require('../models/Couple');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

// Update salary and savings preference
router.put('/salary', auth, async (req, res) => {
  try {
    const { salary, savingsPercent } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { salary, savingsPercent },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Single breakdown — real expenses
router.post('/single-breakdown', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { rent, commute, otherFixed } = req.body;
    const goals = await Goal.find({ userId: req.userId, type: 'personal' });

    const salary = user.salary;
    const savingsAmt = Math.round(salary * user.savingsPercent / 100);
    const totalGoalsSaving = goals.reduce((sum, g) => sum + (g.monthlySaving || 0), 0);
    const fixedExpenses = (rent || 0) + (commute || 0) + (otherFixed || 0);
    const afterFixed = salary - savingsAmt - fixedExpenses - totalGoalsSaving;

    res.json({
      salary,
      savingsPercent: user.savingsPercent,
      monthlySavings: savingsAmt,
      goalsSaving: totalGoalsSaving,
      fixedExpenses,
      rent: rent || 0,
      commute: commute || 0,
      otherFixed: otherFixed || 0,
      spendable: Math.max(afterFixed, 0),
      suggestions: {
        food: Math.round(afterFixed * 0.30),
        groceries: Math.round(afterFixed * 0.25),
        outing: Math.round(afterFixed * 0.25),
        misc: Math.round(afterFixed * 0.20),
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Couple breakdown — save to DB so partner sees it too
router.post('/couple-breakdown', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.coupleId) return res.status(400).json({ message: 'Not in a couple' });

    const couple = await Couple.findById(user.coupleId)
      .populate('user1', 'salary savingsPercent name')
      .populate('user2', 'salary savingsPercent name');

    const u1 = couple.user1;
    const u2 = couple.user2;
    if (!u1 || !u2) return res.status(400).json({ message: 'Partner has not joined yet' });

    const { rent, commute, otherFixed } = req.body;

    // Save inputs to couple record so partner sees them
    couple.budget.rent = rent || 0;
    couple.budget.myCommute = commute || 0;
    couple.budget.otherFixed = otherFixed || 0;

    const u1Salary = u1.salary;
    const u2Salary = u2.salary;
    const combinedSalary = u1Salary + u2Salary;

    const u1Savings = Math.round(u1Salary * u1.savingsPercent / 100);
    const u2Savings = Math.round(u2Salary * u2.savingsPercent / 100);

    const fixedExpenses = (rent || 0) + (commute || 0) + (otherFixed || 0);
    const totalAfterSavings = (u1Salary - u1Savings) + (u2Salary - u2Savings);
    const spendable = Math.max(totalAfterSavings - fixedExpenses, 0);

    // Proportional contribution based on take-home
    const u1TakeHome = u1Salary - u1Savings;
    const u2TakeHome = u2Salary - u2Savings;
    const total = u1TakeHome + u2TakeHome;
    const u1Ratio = total > 0 ? u1TakeHome / total : 0.5;
    const u2Ratio = total > 0 ? u2TakeHome / total : 0.5;

    const coupleGoals = await Goal.find({ coupleId: couple._id, type: 'couple' });
    const coupleGoalsSaving = coupleGoals.reduce((sum, g) => sum + (g.monthlySaving || 0), 0);
    const afterGoals = Math.max(spendable - coupleGoalsSaving, 0);

    const breakdown = {
      user1: { name: u1.name, salary: u1Salary, personalSavings: u1Savings, takeHome: u1TakeHome },
      user2: { name: u2.name, salary: u2Salary, personalSavings: u2Savings, takeHome: u2TakeHome },
      combinedSalary,
      fixedExpenses,
      rent: rent || 0,
      commute: commute || 0,
      otherFixed: otherFixed || 0,
      spendable: afterGoals,
      coupleGoalsSaving,
      contributions: {
        user1Amount: Math.round(total * u1Ratio - (rent || 0) * u1Ratio),
        user2Amount: Math.round(total * u2Ratio - (rent || 0) * u2Ratio),
      },
      suggestions: {
        food: Math.round(afterGoals * 0.30),
        groceries: Math.round(afterGoals * 0.25),
        outing: Math.round(afterGoals * 0.25),
        misc: Math.round(afterGoals * 0.20),
      }
    };

    couple.budget.breakdown = breakdown;
    await couple.save();

    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get saved couple breakdown — for partner who logs in later
router.get('/couple-breakdown', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.coupleId) return res.status(400).json({ message: 'Not in a couple' });

    const couple = await Couple.findById(user.coupleId)
      .populate('user1', 'salary savingsPercent name')
      .populate('user2', 'salary savingsPercent name');

    res.json({
      budget: couple.budget,
      user1: couple.user1,
      user2: couple.user2,
      isActive: couple.isActive
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;