const router = require('express').Router();
const Goal = require('../models/Goal');
const User = require('../models/User');
const Couple = require('../models/Couple');
const auth = require('../middleware/auth');

const getMonthYear = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};


// 1. Create a goal with Automatic Salary Split Calculation
router.post('/', auth, async (req, res) => {
  try {
    const { name, targetAmount, targetDate, type } = req.body;
    const user = await User.findById(req.userId);

    let splitRatio = { user1Percent: 50, user2Percent: 50, isCustom: false };

    if (type === 'couple' && user.coupleId) {
      const couple = await Couple.findById(user.coupleId)
        .populate('user1', 'salary savingsPercent')
        .populate('user2', 'salary savingsPercent')

      if (couple.user1 && couple.user2) {
        const u1TakeHome = couple.user1.salary * (1 - couple.user1.savingsPercent / 100);
        const u2TakeHome = couple.user2.salary * (1 - couple.user2.savingsPercent / 100);
        const totalTakeHome = u1TakeHome + u2.TakeHome;

        if (totalTakeHome > 0) {
          const u1Percent = Math.round((u1TakeHome / totalTakeHome) * 100);
          splitRatio = {
            user1Percent: u1Percent,
            user2Percent: 100 - u1Percent,
            isCustom: false
          };
        }
      }
    }

    const goal = new Goal({
      userId: req.userId,
      coupleId: type === 'couple' ? user.coupleId : null,
      name,
      targetAmount,
      targetDate,
      type,
      splitRatio
    });

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 2. Override Goal Split Ratio
router.put('/:id/split', auth, async (req, res) => {
  try {
    const { user1Percent, user2Percent } = req.body;
    if (user1Percent + user2Percent !== 100) {
      return res.status(400).json({ message: 'Percentages must add up to 100%' });
    }

    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    goal.splitRatio = { user1Percent, user2Percent, isCustom: true };
    await goal.save();

    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 3. Parallel Monthly Contribution & Timeline Update (Features 2, 5, & 7)
// Expects body: { allocations: [{ goalId: "xxx", amount: 5000 }, { goalId: "yyy", amount: 2000 }] }
router.post('/contribute', auth, async (req, res) => {
  try {
    const { allocations } = req.body;
    const monthYear = getMonthYear();
    const updatedGoals = [];

    for (const item of allocations) {
      if (item.amount <= 0) continue;

      const goal = await Goal.findById(item.goalId);
      if (!goal || goal.status === 'completed') continue;

      goal.contributions.push({
        userId: req.userId,
        amount: item.amount,
        date: new Date(),
        monthYear
      });

      await goal.save();
      updatedGoals.push(goal);
    }

    res.json({ message: 'Contributions logged successfully!', updatedGoals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 4. Toggle Pause/Resume Goal
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    goal.status = status;
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all goals for user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const personalGoals = await Goal.find({ userId: req.userId, type: 'personal' })
      .populate('contributions.userId', 'name');

    const coupleGoals = user.coupleId
      ? await Goal.find({ coupleId: user.coupleId, type: 'couple' }).populate('contributions.userId', 'name')
      : [];

    res.json({ personalGoals, coupleGoals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update saved amount
router.put('/:id/progress', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    goal.savedSoFar = req.body.savedSoFar;
    await goal.save(); // triggers pre-save recalculation
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete goal
router.delete('/:id', auth, async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;