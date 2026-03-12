const express = require('express');
const { Anthropic } = require('@anthropic-ai/sdk');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const Trainee = require('../models/Trainee');

const router = express.Router();

// POST /api/ai/analyze  — AI-аналіз рефлексій стажера (тільки адмін)
router.post('/analyze', authMiddleware, adminOnly, async (req, res) => {
  const { days, traineeName, traineeId } = req.body;

  if (!days || !traineeName || !traineeId) {
    return res.status(400).json({ error: 'Відсутні дані для аналізу' });
  }

  const reflections = days.filter(d => d.reflection);

  if (reflections.length === 0) {
    return res.status(400).json({ error: 'Немає рефлексій для аналізу' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY не налаштований' });
  }

  const summary = reflections.map(d => {
    const r = d.reflection;
    return `День ${d.day}: настрій=${r.q1}/5, зрозумілість матеріалу=${r.q2}/5, комфорт у салоні=${r.q3}/5, лояльність до Камеї=${r.q5}/5` +
      (r.q4 ? `, стресори: "${r.q4}"` : '') +
      (r.comments ? `, коментар: "${r.comments}"` : '');
  }).join('\n');

  const prompt = `Ти — HR-менеджер салону краси Камея. Проаналізуй рефлексії стажера "${traineeName}" і дай короткий структурований звіт (4-6 речень) про:
- загальний емоційний стан та настрій
- атмосферу та комфорт у салоні
- питання або труднощі, що виникали
- загальне враження та рекомендації

Дані рефлексій (шкала 1-5):
${summary}

Відповідай українською мовою. Звіт має бути теплим, підтримуючим і конкретним.`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text ?? 'Не вдалося отримати відповідь.';

    // Зберігаємо звіт у БД
    await Trainee.findByIdAndUpdate(traineeId, {
      $push: { aiReports: { analysis: text, daysCount: reflections.length } },
    });

    res.json({ analysis: text });
  } catch (err) {
    console.error('Claude API error:', err);
    res.status(500).json({ error: 'Помилка AI сервісу' });
  }
});

module.exports = router;
