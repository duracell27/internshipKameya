const https = require('https');

/**
 * Відправляє SMS через SMSClub API
 * @param {string} phone - номер у форматі 380XXXXXXXXX
 * @param {string} message - текст повідомлення
 */
async function sendSms(phone, message) {
  const token = process.env.SMSCLUB_TOKEN;
  const srcAddr = process.env.SMSCLUB_ALPHA || 'KAMEYA';

  if (!token || token === 'ВАШ_ТОКЕН_ТУТ') {
    console.warn('[SMS] SMSCLUB_TOKEN не налаштовано, SMS не відправлено');
    return;
  }

  // SMSClub очікує 380XXXXXXXXX без +
  const normalizedPhone = phone.replace(/^\+/, '');

  const payload = {
    src_addr: srcAddr,
    phone: [normalizedPhone],
    message,
  };
  const body = JSON.stringify(payload);

  console.log('[SMS] Надсилаємо запит:', JSON.stringify(payload));

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'im.smsclub.mobi',
        path: '/sms/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          console.log(`[SMS] Статус: ${res.statusCode}, відповідь: ${data}`);
          resolve();
        });
      }
    );

    req.on('error', (err) => {
      console.error('[SMS] Помилка відправки:', err.message);
      resolve(); // не блокуємо реєстрацію при помилці SMS
    });

    req.write(body);
    req.end();
  });
}

/**
 * Вітальне SMS для нового стажера
 */
async function sendWelcomeSms(phone, name, rawPhone, password) {
  const appUrl = process.env.APP_URL || '';
  const firstName = name.trim().split(' ')[0];

  const message =
    `Привіт, ${firstName}! Раді бачити тебе на стажуванні в Камея. ` +
    `Твій доступ до платформи: ` +
    `Логін: ${rawPhone}, ` +
    `Пароль: ${password}` +
    (appUrl ? `, Сайт: ${appUrl}` : '');

  await sendSms(phone, message);
}

module.exports = { sendSms, sendWelcomeSms };
