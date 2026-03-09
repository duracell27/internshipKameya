import { useState, useMemo, useEffect } from 'react';
import type { Trainee } from '../types';
import { analyzeReflections } from '../services/geminiService';
import UsersManager from './UsersManager';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [traineeCount, setTraineeCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    Promise.all([api.getTrainees(), api.getUsers()])
      .then(([{ trainees }, { users }]) => {
        setTrainees(trainees);
        setTraineeCount(users.filter(u => u.role === 'trainee').length);
        if (trainees.length > 0) setSelectedTraineeId(trainees[0].id);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []);

  const selectedTrainee = useMemo(
    () => trainees.find(t => t.id === selectedTraineeId),
    [trainees, selectedTraineeId]
  );

  const getStats = (trainee: Trainee | undefined) => {
    if (!trainee) return { q1: 0, q2: 0, q3: 0, q5: 0, count: 0 };
    const reflections = trainee.days.filter(d => d.reflection).map(d => d.reflection!);
    const count = reflections.length;
    if (count === 0) return { q1: 0, q2: 0, q3: 0, q5: 0, count: 0 };
    const avg = (key: 'q1' | 'q2' | 'q3' | 'q5') =>
      (reflections.reduce((acc, curr) => acc + curr[key], 0) / count).toFixed(1);
    return { q1: avg('q1'), q2: avg('q2'), q3: avg('q3'), q5: avg('q5'), count };
  };

  const stats = useMemo(() => getStats(selectedTrainee), [selectedTrainee]);

  const globalStats = useMemo(() => {
    const allReflections = trainees.flatMap(t => t.days).filter(d => d.reflection).map(d => d.reflection!);
    if (allReflections.length === 0) return { q1: '—', q2: '—', q3: '—', q5: '—' };
    const avg = (key: 'q1' | 'q2' | 'q3' | 'q5') =>
      (allReflections.reduce((acc, curr) => acc + curr[key], 0) / allReflections.length).toFixed(1);
    return { q1: avg('q1'), q2: avg('q2'), q3: avg('q3'), q5: avg('q5') };
  }, [trainees]);

  const handleAnalyze = async () => {
    if (!selectedTrainee) return;
    setLoading(true);
    const result = await analyzeReflections(selectedTrainee.days, selectedTrainee.name);
    setAnalysis(result || 'Помилка аналізу.');
    setLoading(false);
  };

  const handleShareReport = async () => {
    if (!selectedTrainee) return;
    const reportText = `
Звіт по стажеру: ${selectedTrainee.name}
Статистика:
- Настрій: ${stats.q1}/5
- Зрозумілість: ${stats.q2}/5
- Лояльність: ${stats.q5}/5
- К-сть рефлексій: ${stats.count}

AI Висновок:
${analysis || 'Аналіз не проведено'}
    `.trim();

    if (navigator.share) {
      try { await navigator.share({ title: `Звіт: ${selectedTrainee.name}`, text: reportText }); }
      catch { /* скасовано */ }
    } else {
      await navigator.clipboard.writeText(reportText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <i className="fas fa-spinner fa-spin text-3xl text-kameya-burgundy"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Глобальний огляд */}
      <div className="bg-kameya-burgundy text-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Глобальний огляд</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Стажерів',            value: traineeCount },
            { label: 'Середній настрій',    value: globalStats.q1 },
            { label: 'Середній комфорт',    value: globalStats.q3 },
            { label: 'Загальна лояльність', value: globalStats.q5 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 p-3 rounded-lg border border-white/20">
              <span className="text-[10px] uppercase opacity-70 block">{label}</span>
              <span className="text-xl font-bold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Деталі по стажеру */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">Деталі по стажеру</h2>
          {trainees.length > 0 ? (
            <select
              value={selectedTraineeId}
              onChange={e => { setSelectedTraineeId(e.target.value); setAnalysis(''); }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium focus:ring-1 focus:ring-kameya-burgundy outline-none"
            >
              {trainees.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : null}
        </div>

        {trainees.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Стажерів з активними профілями ще немає.</p>
        ) : selectedTrainee ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {([
                { label: 'Днів рефлексії', value: stats.count, accent: true },
                { label: 'Настрій',        value: stats.q1,   accent: false },
                { label: 'Зрозумілість',   value: stats.q2,   accent: false },
                { label: 'Лояльність',     value: stats.q5,   accent: false },
              ] as const).map(({ label, value, accent }) => (
                <div key={label} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center">
                  <span className="text-[10px] text-gray-400 block uppercase">{label}</span>
                  <span className={`text-xl font-bold ${accent ? 'text-kameya-burgundy' : 'text-gray-800'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Стислий AI Звіт</h3>
                <div className="flex gap-2">
                  {analysis && (
                    <button
                      onClick={handleShareReport}
                      className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                    >
                      <i className={`fas ${copyFeedback ? 'fa-check text-green-500' : 'fa-share-nodes'}`}></i>
                      {copyFeedback ? 'Скопійовано' : 'Поділитися'}
                    </button>
                  )}
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || stats.count === 0}
                    className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors disabled:opacity-30"
                  >
                    {loading ? 'Аналізую...' : 'Отримати суть'}
                  </button>
                </div>
              </div>
              {analysis ? (
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-sm text-gray-800 leading-relaxed">
                  {analysis}
                </div>
              ) : stats.count > 0 ? (
                <p className="text-gray-400 text-sm italic">Натисніть кнопку для генерації короткого висновку.</p>
              ) : (
                <p className="text-gray-400 text-sm">Немає рефлексій для аналізу.</p>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Хронологія рефлексій */}
      {selectedTrainee && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Хронологія відгуків: {selectedTrainee.name}
          </h2>
          <div className="space-y-4">
            {[...selectedTrainee.days].filter(d => d.reflection).reverse().map(day => (
              <div key={day.day} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 shrink-0 bg-kameya-burgundy text-white rounded-lg flex flex-col items-center justify-center font-bold text-xs">
                  <span>Д</span>
                  <span>{day.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold">
                        Настрій: {day.reflection?.q1}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold">
                        Зрозум.: {day.reflection?.q2}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(day.reflection!.submittedAt).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                  {day.reflection?.q4 && (
                    <div className="mb-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Стрес:</p>
                      <p className="text-xs text-red-600">{day.reflection.q4}</p>
                    </div>
                  )}
                  {day.reflection?.comments && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Коментар:</p>
                      <p className="text-xs text-gray-700 italic">"{day.reflection.comments}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {selectedTrainee.days.filter(d => d.reflection).length === 0 && (
              <p className="text-center text-gray-400 py-6">Рефлексій ще немає.</p>
            )}
          </div>
        </div>
      )}

      {/* Менеджмент користувачів */}
      <UsersManager onUsersChange={users => setTraineeCount(users.filter(u => u.role === 'trainee').length)} />
    </div>
  );
}
