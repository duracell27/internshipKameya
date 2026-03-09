const express = require('express');
const Trainee = require('../models/Trainee');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── Стажер ───────────────────────────────────────────────────────────────

// GET /api/trainees/me
router.get('/me', authMiddleware, async (req, res) => {
  const trainee = await Trainee.findOne({ user: req.user._id }).populate('user', '-password');
  if (!trainee) return res.status(404).json({ message: 'Профіль стажера не знайдено' });
  res.json({ trainee: trainee.toPublic(trainee.user) });
});

// PATCH /api/trainees/me/tasks/:taskId — перемкнути виконання завдання
router.patch('/me/tasks/:taskId', authMiddleware, async (req, res) => {
  const trainee = await Trainee.findOne({ user: req.user._id }).populate('user', '-password');
  if (!trainee) return res.status(404).json({ message: 'Профіль стажера не знайдено' });

  let found = false;
  for (const day of trainee.days) {
    const task = day.tasks.id(req.params.taskId);
    if (task) {
      task.completed = !task.completed;
      found = true;
      break;
    }
  }

  if (!found) return res.status(404).json({ message: 'Завдання не знайдено' });
  await trainee.save();
  res.json({ trainee: trainee.toPublic(trainee.user) });
});

// PUT /api/trainees/me/days/:day/reflection — зберегти рефлексію
router.put('/me/days/:day/reflection', authMiddleware, async (req, res) => {
  const dayNum = Number(req.params.day);
  const trainee = await Trainee.findOne({ user: req.user._id }).populate('user', '-password');
  if (!trainee) return res.status(404).json({ message: 'Профіль стажера не знайдено' });

  const day = trainee.days.find(d => d.day === dayNum);
  if (!day) return res.status(404).json({ message: 'День не знайдено' });

  day.reflection = { ...req.body, submittedAt: new Date() };
  await trainee.save();
  res.json({ trainee: trainee.toPublic(trainee.user) });
});

// ─── Адмін ────────────────────────────────────────────────────────────────

// GET /api/trainees — всі стажери
router.get('/', authMiddleware, adminOnly, async (_req, res) => {
  const trainees = await Trainee.find().populate('user', '-password');
  res.json({ trainees: trainees.map(t => t.toPublic(t.user)) });
});

// POST /api/trainees/:userId — створити профіль стажера для юзера
router.post('/:userId', authMiddleware, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

  const exists = await Trainee.findOne({ user: user._id });
  if (exists) return res.status(409).json({ message: 'Профіль вже існує' });

  const trainee = await Trainee.create({
    user: user._id,
    position: req.body.position || '',
    startDate: req.body.startDate || new Date(),
    days: [],
  });
  res.status(201).json({ trainee: trainee.toPublic(user) });
});

// PUT /api/trainees/:id/days — замінити дні стажера (адмін задає план)
router.put('/:id/days', authMiddleware, adminOnly, async (req, res) => {
  const trainee = await Trainee.findById(req.params.id).populate('user', '-password');
  if (!trainee) return res.status(404).json({ message: 'Стажера не знайдено' });

  trainee.days = req.body.days || [];
  await trainee.save();
  res.json({ trainee: trainee.toPublic(trainee.user) });
});

// PATCH /api/trainees/:id — оновити позицію/дату початку
router.patch('/:id', authMiddleware, adminOnly, async (req, res) => {
  const trainee = await Trainee.findById(req.params.id).populate('user', '-password');
  if (!trainee) return res.status(404).json({ message: 'Стажера не знайдено' });

  if (req.body.position !== undefined) trainee.position = req.body.position;
  if (req.body.startDate !== undefined) trainee.startDate = req.body.startDate;
  await trainee.save();
  res.json({ trainee: trainee.toPublic(trainee.user) });
});

module.exports = router;
