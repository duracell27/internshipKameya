const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizePhone } = require('../models/User');
const Trainee = require('../models/Trainee');
const { authMiddleware, adminOnly } = require('../middleware/auth');

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
    return res.status(401).json({ message: 'Невірний номер або пароль' });
  }

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
  const { name, phone, password, role, currentDay } = req.body;

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

  // Автоматично створити профіль стажера
  if ((role || 'trainee') === 'trainee') {
    await Trainee.create({ user: user._id, days: [] });
  }

  res.status(201).json({ user: user.toPublic() });
});

// PATCH /api/auth/users/:id — оновити роль, день стажування, ім'я
router.patch('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, role, currentDay, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (currentDay !== undefined) user.currentDay = currentDay ?? null;
  if (password) user.password = password; // буде захешовано через pre-save

  await user.save();
  res.json({ user: user.toPublic() });
});

// GET /api/auth/users  — список користувачів (тільки адмін)
router.get('/users', authMiddleware, adminOnly, async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map(u => u.toPublic()) });
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Видалено' });
});

module.exports = router;
