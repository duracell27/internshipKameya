const express = require('express');
const DayPlan = require('../models/DayPlan');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/dayplans — all day plans (admin + trainee)
router.get('/', authMiddleware, async (_req, res) => {
  const plans = await DayPlan.find().sort({ day: 1 });
  res.json({ dayPlans: plans });
});

// POST /api/dayplans — create a day plan
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const dayNum = Number(req.body.day);
  if (!dayNum) return res.status(400).json({ message: 'Вкажіть номер дня' });

  const exists = await DayPlan.findOne({ day: dayNum });
  if (exists) return res.status(409).json({ message: 'Цей день вже існує' });

  const plan = await DayPlan.create({
    day: dayNum,
    isHoliday: !!req.body.isHoliday,
    tasks: [],
  });
  res.status(201).json({ dayPlan: plan });
});

// DELETE /api/dayplans/:day — delete a day plan
router.delete('/:day', authMiddleware, adminOnly, async (req, res) => {
  const plan = await DayPlan.findOneAndDelete({ day: Number(req.params.day) });
  if (!plan) return res.status(404).json({ message: 'День не знайдено' });
  res.json({ message: 'Видалено' });
});

// POST /api/dayplans/:day/tasks — add task
router.post('/:day/tasks', authMiddleware, adminOnly, async (req, res) => {
  const plan = await DayPlan.findOne({ day: Number(req.params.day) });
  if (!plan) return res.status(404).json({ message: 'День не знайдено' });

  const { title, description, type } = req.body;
  if (!title) return res.status(400).json({ message: 'Вкажіть заголовок' });

  plan.tasks.push({ title, description: description || '', type: type || 'other' });
  await plan.save();
  res.status(201).json({ dayPlan: plan });
});

// PATCH /api/dayplans/:day/tasks/:taskId — update task
router.patch('/:day/tasks/:taskId', authMiddleware, adminOnly, async (req, res) => {
  const plan = await DayPlan.findOne({ day: Number(req.params.day) });
  if (!plan) return res.status(404).json({ message: 'День не знайдено' });

  const task = plan.tasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ message: 'Завдання не знайдено' });

  if (req.body.title !== undefined)       task.title       = req.body.title;
  if (req.body.description !== undefined) task.description = req.body.description;
  if (req.body.type !== undefined)        task.type        = req.body.type;

  await plan.save();
  res.json({ dayPlan: plan });
});

// DELETE /api/dayplans/:day/tasks/:taskId — delete task
router.delete('/:day/tasks/:taskId', authMiddleware, adminOnly, async (req, res) => {
  const plan = await DayPlan.findOne({ day: Number(req.params.day) });
  if (!plan) return res.status(404).json({ message: 'День не знайдено' });

  const task = plan.tasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ message: 'Завдання не знайдено' });

  task.deleteOne();
  await plan.save();
  res.json({ dayPlan: plan });
});

module.exports = router;
