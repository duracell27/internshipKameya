import type { DayPlan } from '../types';

/**
 * Аналізує рефлексії стажера через Gemini AI.
 * Потребує VITE_GEMINI_API_KEY в .env
 */
export async function analyzeReflections(days: DayPlan[], traineeName: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  const reflections = days.filter(d => d.reflection);

  if (reflections.length === 0) {
    return 'Немає рефлексій для аналізу.';
  }

  const summary = reflections.map(d => {
    const r = d.reflection!;
    return `День ${d.day}: настрій=${r.q1}, матеріал=${r.q2}, комфорт=${r.q3}, лояльність=${r.q5}` +
      (r.q4 ? `, стрес: "${r.q4}"` : '') +
      (r.comments ? `, коментар: "${r.comments}"` : '');
  }).join('\n');

  const prompt = `Ти — HR-менеджер салону краси Камея. Проаналізуй рефлексії стажера "${traineeName}" і дай короткий висновок (3-5 речень) про стан, прогрес та рекомендації.\n\nДані:\n${summary}`;

  if (!apiKey) {
    // Заглушка якщо API ключ не налаштований
    return `[Демо] Стажер ${traineeName} має ${reflections.length} рефлексій. ` +
      `Середній настрій: ${(reflections.reduce((a, d) => a + d.reflection!.q1, 0) / reflections.length).toFixed(1)}/5. ` +
      `Додайте VITE_GEMINI_API_KEY у frontend/.env для повноцінного AI-аналізу.`;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Не вдалося отримати відповідь.';
  } catch {
    return 'Помилка підключення до AI сервісу.';
  }
}
