const router = require('express').Router();
const Goal = require('../models/Goal');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a goal
router.post('/', auth, async (req, res) => {
  try {
    const { name, targetAmount, targetDate, type } = req.body;
    const user = await User.findById(req.userId);

    const goal = new Goal({
      userId: req.userId,
      coupleId: type === 'couple' ? user.coupleId : null,
      name, targetAmount, targetDate, type
    });
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
    const personalGoals = await Goal.find({ userId: req.userId, type: 'personal' });
    const coupleGoals = user.coupleId 
      ? await Goal.find({ coupleId: user.coupleId, type: 'couple' }) 
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