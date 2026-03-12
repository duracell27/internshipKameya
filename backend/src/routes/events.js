const express = require('express');
const Event = require('../models/Event');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/events — останні 300 подій (тільки адмін)
router.get('/', authMiddleware, adminOnly, async (_req, res) => {
  const events = await Event.find().sort({ createdAt: -1 }).limit(300);
  res.json({ events });
});

module.exports = router;
