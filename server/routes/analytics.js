const router = require('express').Router();
const Goal = require('../models/Goal');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Couple = require('../models/Couple');
const auth = require('../middleware/auth');

// 1. Comprehensive Goal Achievement & Efficiency Overview (Feature 9)
router.get('/overview', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Fetch personal goals + couple goals if linked
    const personalGoals = await Goal.find({ userId: req.userId, type: 'personal' });
    const coupleGoals = user.coupleId
      ? await Goal.find({ coupleId: user.coupleId, type: 'couple' })
      : [];

    const allGoals = [...personalGoals, ...coupleGoals];

    if (allGoals.length === 0) {
      return res.json({
        totalGoals: 0,
        completed: 0,
        inProgress: 0,
        paused: 0,
        successRate: 0,
        totalSavedAllTime: 0,
        timeEfficiency: { early: 0, onTime: 0, late: 0 },
        completedGoalsDetails: []
      });
    }

    let completedCount = 0;
    let inProgressCount = 0;
    let pausedCount = 0;
    let totalSavedAllTime = 0;

    // Time efficiency counters
    let earlyCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    const completedGoalsDetails = [];

    allGoals.forEach(goal => {
      totalSavedAllTime += (goal.savedSoFar || 0);

      if (goal.status === 'completed') {
        completedCount++;

        // Calculate Time Efficiency for completed goals
        const targetDate = new Date(goal.targetDate);
        // Find the date of the very last contribution that pushed it to completion
        let completionDate = new Date(goal.updatedAt || Date.now());
        if (goal.contributions && goal.contributions.length > 0) {
          const sortedContribs = [...goal.contributions].sort((a, b) => new Date(b.date) - new Date(a.date));
          completionDate = new Date(sortedContribs[0].date);
        }

        // Compare months between target date and actual completion date
        const diffTime = targetDate.getTime() - completionDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let efficiencyStatus = 'On Time';
        if (diffDays > 15) {
          earlyCount++;
          efficiencyStatus = 'Early';
        } else if (diffDays < -15) {
          lateCount++;
          efficiencyStatus = 'Late';
        } else {
          onTimeCount++;
        }

        completedGoalsDetails.push({
          name: goal.name,
          targetAmount: goal.targetAmount,
          targetDate: goal.targetDate,
          actualCompletionDate: completionDate,
          efficiencyStatus,
          type: goal.type
        });

      } else if (goal.status === 'paused') {
        pausedCount++;
      } else {
        inProgressCount++;
      }
    });

    const successRate = Math.round((completedCount / allGoals.length) * 100);

    res.json({
      totalGoals: allGoals.length,
      completed: completedCount,
      inProgress: inProgressCount,
      paused: pausedCount,
      successRate: `${successRate}%`,
      totalSavedAllTime,
      timeEfficiency: {
        early: earlyCount,
        onTime: onTimeCount,
        late: lateCount
      },
      completedGoalsDetails
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Monthly Savings Velocity (For Line / Bar Charts)
router.get('/savings-velocity', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const personalGoals = await Goal.find({ userId: req.userId, type: 'personal' });
    const coupleGoals = user.coupleId
      ? await Goal.find({ coupleId: user.coupleId, type: 'couple' })
      : [];

    const allGoals = [...personalGoals, ...coupleGoals];

    // Map to aggregate savings by "YYYY-MM"
    const velocityMap = {};

    allGoals.forEach(goal => {
      if (goal.contributions) {
        goal.contributions.forEach(c => {
          // If in couple mode, only count currentUser's contributions for personal view, 
          // or include both for joint goals
          const month = c.monthYear;
          if (!velocityMap[month]) {
            velocityMap[month] = { personalSaved: 0, coupleSaved: 0, total: 0 };
          }

          if (goal.type === 'personal') {
            velocityMap[month].personalSaved += c.amount;
          } else {
            velocityMap[month].coupleSaved += c.amount;
          }
          velocityMap[month].total += c.amount;
        });
      }
    });

    // Convert map to sorted array (chronological order)
    const velocityArray = Object.keys(velocityMap)
      .sort()
      .map(month => ({
        monthYear: month,
        ...velocityMap[month]
      }));

    res.json(velocityArray);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Expense Categorization Breakdown (For Pie / Donut Charts)
router.get('/category-breakdown', auth, async (req, res) => {
  try {
    const { monthYear } = req.query; // Optional filter, otherwise fetches all-time
    const user = await User.findById(req.userId);

    const queryFilter = { userId: req.userId, type: 'personal' };
    if (monthYear) queryFilter.monthYear = monthYear;

    const personalExpenses = await Expense.find(queryFilter);

    const coupleQueryFilter = user.coupleId ? { coupleId: user.coupleId, type: 'couple' } : null;
    if (coupleQueryFilter && monthYear) coupleQueryFilter.monthYear = monthYear;

    const coupleExpenses = coupleQueryFilter ? await Expense.find(coupleQueryFilter) : [];

    // Aggregate by category
    const categoryMap = {};

    const processExpenses = (expensesList) => {
      expensesList.forEach(exp => {
        const cat = exp.category || 'other';
        categoryMap[cat] = (categoryMap[cat] || 0) + exp.amount;
      });
    };

    processExpenses(personalExpenses);
    processExpenses(coupleExpenses);

    // Format for frontend charting libraries (e.g., Chart.js or Recharts)
    const chartData = Object.keys(categoryMap).map(category => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: categoryMap[category]
    }));

    res.json({
      monthYear: monthYear || 'All Time',
      totalSpent: chartData.reduce((sum, item) => sum + item.value, 0),
      breakdown: chartData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;