const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizePhone } = require('../models/User');
const Trainee = require('../models/Trainee');
const DayPlan = require('../models/DayPlan');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { sendWelcomeSms } = require('../services/smsService');
const { logEvent } = require('../services/eventService');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Вкажіть номер телефону та пароль' });
  }

  const normalized = normalizePhone(phone);
  const user = await User.findOne({ phone: normalized });

  if (!user || !(await user.comparePassword(password))) {
    logEvent('login_failed', { meta: { phone: normalized } });
    return res.status(401).json({ message: 'Невірний номер або пароль' });
  }

  logEvent('login_success', { actorId: user._id, actorName: user.name });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.json({ token, user: user.toPublic() });
});

// GET /api/auth/me  — перевірка токена
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

// POST /api/auth/users  — адмін створює акаунт
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  const { name, phone, password, role, currentDay, startDate } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: 'Заповніть всі поля' });
  }

  const normalized = normalizePhone(phone);
  const exists = await User.findOne({ phone: normalized });
  if (exists) {
    return res.status(409).json({ message: 'Користувач з таким номером вже існує' });
  }

  const user = await User.create({
    name,
    phone: normalized,
    password,
    role: role || 'trainee',
    currentDay: currentDay ?? null,
  });

  // Автоматично створити профіль стажера + вітальне SMS
  if ((role || 'trainee') === 'trainee') {
    await Trainee.create({ user: user._id, days: [], ...(startDate ? { startDate: new Date(startDate) } : {}) });
    // Відправляємо SMS асинхронно, не блокуємо відповідь
    sendWelcomeSms(user.phone, user.name, normalizePhone(phone), password).catch(() => {});
  }

  logEvent('user_created', {
    actorId: req.user._id,
    actorName: req.user.name,
    targetId: user._id,
    targetName: user.name,
    meta: { role: user.role, phone: normalized },
  });

  res.status(201).json({ user: user.toPublic() });
});

// PATCH /api/auth/users/:id — оновити роль, день стажування, ім'я
router.patch('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, role, currentDay, password, startDate } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

  const changes = [];
  if (name !== undefined && name !== user.name) { user.name = name; changes.push('name'); }
  if (role !== undefined && role !== user.role) { user.role = role; changes.push('role'); }
  if (currentDay !== undefined) { user.currentDay = currentDay ?? null; changes.push('currentDay'); }
  if (password) { user.password = password; changes.push('password'); } // буде захешовано через pre-save

  await user.save();

  if (startDate !== undefined) {
    await Trainee.findOneAndUpdate({ user: user._id }, { startDate: new Date(startDate) });
    changes.push('startDate');
  }

  if (changes.length > 0) {
    logEvent('user_updated', {
      actorId: req.user._id,
      actorName: req.user.name,
      targetId: user._id,
      targetName: user.name,
      meta: { changes },
    });
  }

  res.json({ user: user.toPublic() });
});

// GET /api/auth/users  — список користувачів (тільки адмін)
router.get('/users', authMiddleware, adminOnly, async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  const trainees = await Trainee.find({ user: { $in: users.map(u => u._id) } });

  // Фіксована тривалість стажування — 14 днів
  const INTERNSHIP_DURATION = 14;
  // Загальна кількість днів плану (останній день) — не менше фіксованої тривалості
  const lastPlan = await DayPlan.findOne().sort({ day: -1 }).select('day');
  const totalDays = Math.max(lastPlan ? lastPlan.day : INTERNSHIP_DURATION, INTERNSHIP_DURATION);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = users.map(u => {
    const pub = u.toPublic();
    if (u.role === 'trainee') {
      const t = trainees.find(t => t.user.toString() === u._id.toString());
      if (t) {
        const start = new Date(t.startDate);
        start.setHours(0, 0, 0, 0);
        const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        pub.currentDay = diff >= 0 ? diff + 1 : null;
        pub.daysUntilStart = diff < 0 ? Math.abs(diff) : null;
        pub.startDate = t.startDate;

        if (totalDays) {
          // Дата завершення = startDate + totalDays - 1
          const end = new Date(start);
          end.setDate(end.getDate() + totalDays - 1);
          pub.endDate = end.toISOString();
          pub.isCompleted = diff >= totalDays;
        }
      }
    }
    return pub;
  });

  res.json({ users: result });
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    logEvent('user_deleted', {
      actorId: req.user._id,
      actorName: req.user.name,
      targetId: user._id,
      targetName: user.name,
      meta: { role: user.role },
    });
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Видалено' });
});

module.exports = router;
