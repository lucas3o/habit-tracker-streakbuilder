const express = require('express');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * Calculate streak statistics from an array of completion date strings.
 */
function calculateStreaks(completions, createdAt, refDate) {
  if (!completions || completions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, completionRate: 0 };
  }

  // Sort dates ascending
  const sorted = [...completions].sort();
  
  // Use client's local refDate or default to server local date
  const todayStr = refDate || new Date().toLocaleDateString('en-CA');
  
  const refDateObj = new Date(todayStr + 'T00:00:00');
  const yesterdayObj = new Date(refDateObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toLocaleDateString('en-CA');

  // Current streak: check if today or yesterday is completed, then count backward
  let currentStreak = 0;
  const dateSet = new Set(sorted);

  if (dateSet.has(todayStr) || dateSet.has(yesterdayStr)) {
    let checkDateObj = dateSet.has(todayStr) ? new Date(todayStr + 'T00:00:00') : new Date(yesterdayStr + 'T00:00:00');
    while (true) {
      const checkDateStr = checkDateObj.toLocaleDateString('en-CA');
      if (dateSet.has(checkDateStr)) {
        currentStreak++;
        checkDateObj.setDate(checkDateObj.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 1;
  let currentRun = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else if (diffDays > 1) {
      currentRun = 1;
    }
  }
  if (sorted.length === 1) longestStreak = 1;

  // Completion rate
  const startOfDay = new Date(todayStr + 'T00:00:00').getTime();
  const createdTime = new Date(createdAt).getTime();
  const daysSinceCreated = Math.max(1, Math.ceil((startOfDay - createdTime) / 86400000) + 1);
  const completionRate = Math.min(1, completions.length / daysSinceCreated);

  return { currentStreak, longestStreak, completionRate };
}

/**
 * Enrich a habit document with computed streak fields.
 */
function enrichHabit(habit, refDate) {
  const obj = habit.toObject();
  const streaks = calculateStreaks(obj.completions, obj.createdAt, refDate);
  return { ...obj, ...streaks };
}

// GET /api/habits - Get all habits for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { clientDate } = req.query;
    const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const enriched = habits.map(h => enrichHabit(h, clientDate));
    res.json(enriched);
  } catch (err) {
    console.error('Get habits error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/habits - Create a new habit
router.post('/', async (req, res) => {
  try {
    const { name, description, category, color } = req.body;
    const { clientDate } = req.query;

    if (!name) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = new Habit({
      userId: req.user.id,
      name,
      description: description || '',
      category: category || 'Routine',
      color: color || 'emerald'
    });

    await habit.save();
    res.status(201).json(enrichHabit(habit, clientDate));
  } catch (err) {
    console.error('Create habit error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/habits/:id - Update an existing habit
router.put('/:id', async (req, res) => {
  try {
    const { name, description, category, color } = req.body;
    const { clientDate } = req.query;

    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (name !== undefined) habit.name = name;
    if (description !== undefined) habit.description = description;
    if (category !== undefined) habit.category = category;
    if (color !== undefined) habit.color = color;

    await habit.save();
    res.json(enrichHabit(habit, clientDate));
  } catch (err) {
    console.error('Update habit error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/habits/:id - Delete a habit
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    res.json({ message: 'Habit deleted successfully' });
  } catch (err) {
    console.error('Delete habit error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/habits/:id/toggle - Toggle specific date completion
router.post('/:id/toggle', async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const { date, clientDate } = req.body;
    const targetDate = date || clientDate || new Date().toLocaleDateString('en-CA');

    const index = habit.completions.indexOf(targetDate);
    if (index > -1) {
      // Remove today (un-complete)
      habit.completions = habit.completions.filter(d => d !== targetDate);
    } else {
      // Add today (complete)
      habit.completions.push(targetDate);
    }

    await habit.save();
    res.json(enrichHabit(habit, clientDate || targetDate));
  } catch (err) {
    console.error('Toggle habit error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
