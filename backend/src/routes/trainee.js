const express = require('express');
const mongoose = require('mongoose');
const Trainee = require('../models/Trainee');
const DayPlan = require('../models/DayPlan');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── Стажер ───────────────────────────────────────────────────────────────

// GET /api/trainees/me
router.get('/me', authMiddleware, async (req, res) => {
  const trainee = await Trainee.findOne({ user: req.user._id }).populate('user', '-password');
  if (!trainee) return res.status(404).json({ message: 'Профіль стажера не знайдено' });

  const dayPlans = await DayPlan.find().sort({ day: 1 });
  res.json({ trainee: trainee.toPublic(trainee.user, dayPlans) });
});

// PATCH /api/trainees/me/tasks/:taskId — toggle task completion
router.patch('/me/tasks/:taskId', authMiddleware, async (req, res) => {
  const trainee = await Trainee.findOne({ user: req.user._id }).populate('user', '-password');
  if (!trainee) return res.status(404).json({ message: 'Профіль стажера не знайдено' });

  const dayPlans = await DayPlan.find().sort({ day: 1 });

  // Find which day this task belongs to
  let targetDayNum = null;
  for (const plan of dayPlans) {
    if (plan.tasks.id(req.params.taskId)) {
      targetDayNum = plan.day;
      break;
    }
  }
  if (!targetDayNum) return res.status(404).json({ message: 'Завдання не знайдено' });

  // Find or create trainee day entry
  let td = trainee.days.find(d => d.day === targetDayNum);
  if (!td) {
    trainee.days.push({ day: targetDayNum, completedTaskIds: [] });
    td = trainee.days[trainee.days.length - 1];
  }

  const taskObjId = new mongoose.Types.ObjectId(req.params.taskId);
  const idx = td.completedTaskIds.findIndex(id => id.toString() === req.params.taskId);
  if (idx === -1) {
    td.completedTaskIds.push(taskObjId);
  } else {
    td.completedTaskIds.splice(idx, 1);
  }

  await trainee.save();
  res.json({ trainee: trainee.toPublic(trainee.user, dayPlans) });
});

// PUT /api/trainees/me/days/:day/reflection
router.put('/me/days/:day/reflection', authMiddleware, async (req, res) => {
  const dayNum = Number(req.params.day);
  const trainee = await Trainee.findOne({ user: req.user._id }).populate('user', '-password');
  if (!trainee) return res.status(404).json({ message: 'Профіль стажера не знайдено' });

  const dayPlans = await DayPlan.find().sort({ day: 1 });

  let td = trainee.days.find(d => d.day === dayNum);
  if (!td) {
    trainee.days.push({ day: dayNum, completedTaskIds: [], reflection: { ...req.body, submittedAt: new Date() } });
  } else {
    td.reflection = { ...req.body, submittedAt: new Date() };
  }

  await trainee.save();
  res.json({ trainee: trainee.toPublic(trainee.user, dayPlans) });
});

// ─── Адмін ────────────────────────────────────────────────────────────────

// GET /api/trainees
router.get('/', authMiddleware, adminOnly, async (_req, res) => {
  const trainees = await Trainee.find().populate('user', '-password');
  const dayPlans = await DayPlan.find().sort({ day: 1 });
  res.json({ trainees: trainees.map(t => t.toPublic(t.user, dayPlans)) });
});

// POST /api/trainees/:userId — create trainee profile for user
router.post('/:userId', authMiddleware, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

  const exists = await Trainee.findOne({ user: user._id });
  if (exists) return res.status(409).json({ message: 'Профіль вже існує' });

  const dayPlans = await DayPlan.find().sort({ day: 1 });
  const trainee = await Trainee.create({
    user: user._id,
    position: req.body.position || '',
    startDate: req.body.startDate || new Date(),
    days: [],
  });
  res.status(201).json({ trainee: trainee.toPublic(user, dayPlans) });
});

// PATCH /api/trainees/:id — update position/startDate
router.patch('/:id', authMiddleware, adminOnly, async (req, res) => {
  const trainee = await Trainee.findById(req.params.id).populate('user', '-password');
  if (!trainee) return res.status(404).json({ message: 'Стажера не знайдено' });

  if (req.body.position !== undefined)  trainee.position  = req.body.position;
  if (req.body.startDate !== undefined) trainee.startDate = req.body.startDate;
  await trainee.save();

  const dayPlans = await DayPlan.find().sort({ day: 1 });
  res.json({ trainee: trainee.toPublic(trainee.user, dayPlans) });
});

module.exports = router;
