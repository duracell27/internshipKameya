const Event = require('../models/Event');

/**
 * Логує подію в базу даних.
 * Помилки логування не блокують основний запит.
 */
async function logEvent(type, { actorId, actorName, targetId, targetName, meta } = {}) {
  try {
    await Event.create({ type, actorId, actorName, targetId, targetName, meta });
  } catch (err) {
    console.error('[Events] Помилка запису події:', err.message);
  }
}

module.exports = { logEvent };
