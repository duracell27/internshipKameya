import { useState, useMemo, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Trainee } from '../types';
import UsersManager from './UsersManager';
import TasksManager from './TasksManager';
import EventsLog from './EventsLog';
import { api } from '../services/api';

type Section = 'overview' | 'users' | 'tasks' | 'events' | 'completed';

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: 'overview', label: 'Огляд',              icon: 'fa-chart-bar' },
  { id: 'users',    label: 'Користувачі',       icon: 'fa-users' },
  { id: 'tasks',    label: 'Завдання',          icon: 'fa-list-check' },
  { id: 'events',   label: 'Події',             icon: 'fa-clock-rotate-left' },
  { id: 'completed', label: 'Історія стажувань', icon: 'fa-archive' },
];

export default function AdminDashboard() {
  const [section, setSection] = useState<Section>('overview');
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [traineeCount, setTraineeCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  const [selectedCompletedTraineeId, setSelectedCompletedTraineeId] = useState<string>('');
  const [searchCompletedTrainee, setSearchCompletedTrainee] = useState<string>('');
  const [showCompletedDropdown, setShowCompletedDropdown] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [scrollToDay, setScrollToDay] = useState<number | null>(null);
  const scrollPending = useRef(false);
  const completedSearchRef = useRef<HTMLDivElement>(null);

  const loadTrainees = async () => {
    try {
      const { trainees } = await api.getTrainees();
      setTrainees(trainees);
      if (trainees.length > 0) {
        setSelectedTraineeId(prev => {
          if (prev) return prev;
          return trainees[0].id;
        });
      }
    } catch (err) {
      console.error('[AdminDashboard] помилка завантаження стажерів:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [{ trainees }, { users }] = await Promise.all([
          api.getTrainees(),
          api.getUsers(),
        ]);
        setTrainees(trainees);
        setTraineeCount(users.filter(u => u.role === 'trainee').length);
        if (trainees.length > 0) setSelectedTraineeId(trainees[0].id);
      } catch (err) {
        console.error('[AdminDashboard] Помилка завантаження стажерів:', err);
        try {
          const { users } = await api.getUsers();
          setTraineeCount(users.filter(u => u.role === 'trainee').length);
        } catch (err2) {
          console.error('[AdminDashboard] Помилка завантаження користувачів:', err2);
        }
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, []);

  // Перезавантажуємо стажерів при переході на огляд
  useEffect(() => {
    if (section === 'overview') {
      loadTrainees();
      // Скинути вибір, якщо вибраний стажер завершив стажування
      setSelectedTraineeId(prev => {
        const trainee = trainees.find(t => t.id === prev);
        if (trainee?.isCompleted) {
          // Вибрати першого активного стажера
          const firstActive = trainees.find(t => !t.isCompleted);
          return firstActive?.id || prev;
        }
        return prev;
      });
    }
  }, [section, trainees]);

  // Скрол до рефлексії після переходу на огляд
  useEffect(() => {
    if (section === 'overview' && scrollToDay !== null && scrollPending.current) {
      scrollPending.current = false;
      const el = document.getElementById(`reflection-day-${scrollToDay}`);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      }
      setScrollToDay(null);
    }
  }, [section, scrollToDay, trainees]);

  // Закривати dropdown при кліку зовні
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (completedSearchRef.current && !completedSearchRef.current.contains(event.target as Node)) {
        setShowCompletedDropdown(false);
      }
    };
    if (showCompletedDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCompletedDropdown]);

  const handleViewReflection = (traineeId: string, day: number) => {
    setSelectedTraineeId(traineeId);
    setScrollToDay(day);
    scrollPending.current = true;
    setSection('overview');
  };

  const activeTrainees = useMemo(
    () => trainees.filter(t => !t.isCompleted),
    [trainees]
  );

  const completedTrainees = useMemo(
    () => trainees.filter(t => t.isCompleted),
    [trainees]
  );

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
    try {
      const { analysis } = await api.analyzeReflections(selectedTrainee.id, selectedTrainee.days, selectedTrainee.name);
      setAnalysis(analysis);
      loadTrainees(); // оновлюємо щоб підтягнути збережений звіт
    } catch {
      setAnalysis('Помилка аналізу. Перевірте налаштування AI сервісу.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string): boolean => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch { return false; }
  };

  const handleShareReport = async (reportId: string, reportAnalysis: string, label: string) => {
    if (!selectedTrainee) return;
    const text = `${label}\nСтажер: ${selectedTrainee.name}\n\n${reportAnalysis}`;
    if (navigator.share) {
      try { await navigator.share({ title: label, text }); return; }
      catch { /* не підтримується або скасовано */ }
    }
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = copyToClipboard(text);
    }
    if (ok) {
      setCopyFeedback(reportId);
      setTimeout(() => setCopyFeedback(null), 2000);
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
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* ── Sidebar ── */}
      <aside className="w-full md:w-52 shrink-0">
        <nav className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex md:flex-col">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 text-sm font-semibold transition-colors
                  ${section === item.id
                    ? 'bg-kameya-burgundy text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <i className={`fas ${item.icon} w-4 text-center`}></i>
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* ОГЛЯД */}
        {section === 'overview' && (
          <>
            {/* Глобальний огляд */}
            <div className="bg-kameya-burgundy text-white p-6 rounded-2xl shadow-md">
              <h2 className="text-xl font-bold mb-4">Глобальний огляд</h2>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {[
                  { label: 'Стажерів',   value: traineeCount },
                  { label: 'Настрій',    value: globalStats.q1 },
                  { label: 'Зрозумілість', value: globalStats.q2 },
                  { label: 'Комфорт',    value: globalStats.q3 },
                  { label: 'Лояльність', value: globalStats.q5 },
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
                {activeTrainees.length > 0 ? (
                  <div className="flex items-center gap-3">
                    {selectedTrainee?.currentDay != null && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold shrink-0">
                        <i className="fas fa-calendar-day text-[10px]"></i>
                        День {selectedTrainee.currentDay}
                      </span>
                    )}
                    <select
                      value={selectedTraineeId}
                      onChange={e => { setSelectedTraineeId(e.target.value); setAnalysis(''); }}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium focus:ring-1 focus:ring-kameya-burgundy outline-none"
                    >
                      {activeTrainees.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>

              {activeTrainees.length === 0 ? (
                <p className="text-center text-gray-400 py-10">Активних стажерів немає.</p>
              ) : selectedTrainee && !selectedTrainee.isCompleted ? (
                <>
                  {/* Прогрес виконання завдань */}
                  {(() => {
                    const allTasks = selectedTrainee.days.flatMap(d => d.tasks);
                    const progress = allTasks.length
                      ? Math.round((allTasks.filter(t => t.completed).length / allTasks.length) * 100)
                      : 0;
                    return allTasks.length > 0 ? (
                      <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Прогрес завдань</span>
                          <span className="text-sm font-bold text-kameya-burgundy">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-kameya-burgundy h-full rounded-full transition-all duration-700"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          {allTasks.filter(t => t.completed).length} з {allTasks.length} завдань виконано
                        </p>
                      </div>
                    ) : null;
                  })()}

                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                    {([
                      { label: 'Днів рефлексії', value: stats.count, accent: true },
                      { label: 'Настрій',        value: stats.q1,   accent: false },
                      { label: 'Зрозумілість',   value: stats.q2,   accent: false },
                      { label: 'Комфорт',        value: stats.q3,   accent: false },
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
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="text-gray-700">{children}</li>,
                            h3: ({ children }) => <h3 className="font-bold text-gray-900 mt-3 mb-1">{children}</h3>,
                            a: ({ href, children }) => <a href={href?.toString()} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{children}</a>,
                          }}
                          disallowedElements={['script', 'iframe', 'img']}
                        >
                          {analysis}
                        </ReactMarkdown>
                      </div>
                    ) : stats.count > 0 ? (
                      <p className="text-gray-400 text-sm italic">Натисніть кнопку для генерації короткого висновку.</p>
                    ) : (
                      <p className="text-gray-400 text-sm">Немає рефлексій для аналізу.</p>
                    )}
                  </div>

                  {/* Архів AI звітів */}
                  {(selectedTrainee?.aiReports?.length ?? 0) > 0 && (
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-3">
                        Архів звітів
                      </h3>
                      <div className="space-y-2">
                        {selectedTrainee!.aiReports.map(report => {
                          const isOpen = openReportId === report.id;
                          const dt = new Date(report.createdAt);
                          const label = `Стислий звіт за ${report.daysCount} дн. · ${dt.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} ${dt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
                          const copied = copyFeedback === report.id;
                          return (
                            <div key={report.id} className="border border-gray-200 rounded-xl overflow-hidden">
                              <button
                                onClick={() => setOpenReportId(isOpen ? null : report.id)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <span className="flex items-center gap-2">
                                  <i className="fas fa-file-lines text-purple-400 text-xs"></i>
                                  {label}
                                </span>
                                <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-4 pt-2 bg-purple-50 text-sm text-gray-800 leading-relaxed">
                                  <ReactMarkdown
                                    components={{
                                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                                      li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                      h3: ({ children }) => <h3 className="font-bold text-gray-900 mt-3 mb-1">{children}</h3>,
                                      a: ({ href, children }) => <a href={href?.toString()} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{children}</a>,
                                    }}
                                    disallowedElements={['script', 'iframe', 'img']}
                                  >
                                    {report.analysis}
                                  </ReactMarkdown>
                                  <button
                                    onClick={() => handleShareReport(report.id, report.analysis, label)}
                                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                                  >
                                    <i className={`fas ${copied ? 'fa-check text-green-500' : 'fa-share-nodes'}`}></i>
                                    {copied ? 'Скопійовано!' : 'Поділитися'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Хронологія рефлексій */}
            {selectedTrainee && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Хронологія відгуків: {selectedTrainee.name}
                </h2>
                <div className="space-y-4">
                  {[...selectedTrainee.days].filter(d => d.reflection).reverse().map(day => (
                    <div key={day.day} id={`reflection-day-${day.day}`} className={`flex gap-4 p-4 rounded-xl border transition-colors ${scrollToDay === day.day ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="w-10 h-10 shrink-0 bg-kameya-burgundy text-white rounded-lg flex flex-col items-center justify-center font-bold text-xs">
                        <span>Д</span>
                        <span>{day.day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold">
                              Настрій: {day.reflection?.q1}
                            </span>
                            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold">
                              Зрозумілість: {day.reflection?.q2}
                            </span>
                            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold">
                              Комфорт: {day.reflection?.q3}
                            </span>
                            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold">
                              Лояльність: {day.reflection?.q5}
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
          </>
        )}

        {/* КОРИСТУВАЧІ */}
        {section === 'users' && (
          <UsersManager onUsersChange={users => {
            setTraineeCount(users.filter(u => u.role === 'trainee').length);
            loadTrainees();
          }} />
        )}

        {/* ЗАВДАННЯ */}
        {section === 'tasks' && (
          <TasksManager />
        )}

        {/* ПОДІЇ */}
        {section === 'events' && (
          <EventsLog onViewReflection={handleViewReflection} />
        )}

        {section === 'completed' && (
          <>
            {completedTrainees.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm text-center">
                <i className="fas fa-inbox text-4xl text-gray-300 mb-4 block"></i>
                <p className="text-gray-400">Немає завершених стажерів</p>
              </div>
            ) : (
              <>
                {/* Вибір завершеного стажера */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Деталі по завершеному стажуванню</h2>
                    <div className="relative w-full md:w-72" ref={completedSearchRef}>
                      <input
                        type="text"
                        placeholder={selectedCompletedTraineeId
                          ? completedTrainees.find(t => t.id === selectedCompletedTraineeId)?.name
                          : "Виберіть або пошукайте..."}
                        value={searchCompletedTrainee}
                        onChange={e => {
                          setSearchCompletedTrainee(e.target.value);
                          setShowCompletedDropdown(true);
                        }}
                        onFocus={() => setShowCompletedDropdown(true)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium focus:ring-1 focus:ring-kameya-burgundy outline-none"
                      />
                      {showCompletedDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                          {completedTrainees
                            .filter(t =>
                              searchCompletedTrainee === '' ||
                              t.name.toLowerCase().includes(searchCompletedTrainee.toLowerCase())
                            )
                            .slice(0, searchCompletedTrainee === '' ? 8 : undefined)
                            .map(t => (
                              <button
                                key={t.id}
                                onClick={() => {
                                  setSelectedCompletedTraineeId(t.id);
                                  setSearchCompletedTrainee('');
                                  setShowCompletedDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 last:border-0 ${
                                  selectedCompletedTraineeId === t.id
                                    ? 'bg-kameya-burgundy/5 text-kameya-burgundy font-semibold'
                                    : 'text-gray-700'
                                }`}
                              >
                                {t.name}
                              </button>
                            ))}
                          {completedTrainees.filter(t =>
                            searchCompletedTrainee === '' ||
                            t.name.toLowerCase().includes(searchCompletedTrainee.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">Не знайдено</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedCompletedTraineeId && (() => {
                    const selectedTrainee = completedTrainees.find(t => t.id === selectedCompletedTraineeId);
                    if (!selectedTrainee) return null;

                    const completedStats = getStats(selectedTrainee);
                    const allTasks = selectedTrainee.days.flatMap(d => d.tasks);
                    const tasksProgress = allTasks.length
                      ? Math.round((allTasks.filter(t => t.completed).length / allTasks.length) * 100)
                      : 0;

                    return (
                      <>
                        {/* Інформація про стажування */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                          <div>
                            <span className="font-semibold block text-gray-700 mb-1 text-sm">Дата початку</span>
                            <p className="text-gray-800">{new Date(selectedTrainee.startDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <span className="font-semibold block text-gray-700 mb-1 text-sm">Дата закінчення</span>
                            <p className="text-gray-800">{selectedTrainee.endDate ? new Date(selectedTrainee.endDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
                          </div>
                          <div>
                            <span className="font-semibold block text-gray-700 mb-1 text-sm">Днів стажування</span>
                            <p className="text-gray-800">{selectedTrainee.days.length}</p>
                          </div>
                        </div>

                        {/* Прогрес завдань */}
                        {allTasks.length > 0 && (
                          <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Прогрес завдань</span>
                              <span className="text-sm font-bold text-kameya-burgundy">{tasksProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-kameya-burgundy h-full rounded-full transition-all duration-700"
                                style={{ width: `${tasksProgress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              {allTasks.filter(t => t.completed).length} з {allTasks.length} завдань виконано
                            </p>
                          </div>
                        )}

                        {/* Статистика рефлексій */}
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                          {([
                            { label: 'Днів рефлексії', value: completedStats.count, accent: true },
                            { label: 'Настрій',        value: completedStats.q1,   accent: false },
                            { label: 'Зрозумілість',   value: completedStats.q2,   accent: false },
                            { label: 'Комфорт',        value: completedStats.q3,   accent: false },
                            { label: 'Лояльність',     value: completedStats.q5,   accent: false },
                          ] as const).map(({ label, value, accent }) => (
                            <div key={label} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center">
                              <span className="text-[10px] text-gray-400 block uppercase">{label}</span>
                              <span className={`text-xl font-bold ${accent ? 'text-kameya-burgundy' : 'text-gray-800'}`}>
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* AI звіти */}
                        <div className="border-t border-gray-100 pt-6">
                          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">AI Звіти</h3>
                          {(selectedTrainee?.aiReports?.length ?? 0) > 0 ? (
                            <div className="space-y-2">
                              {selectedTrainee!.aiReports.map((report, idx) => {
                                const isOpen = openReportId === report.id;
                                const dt = new Date(report.createdAt);
                                const label = `Звіт ${idx + 1} · ${dt.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} ${dt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
                                return (
                                  <div key={report.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                    <button
                                      onClick={() => setOpenReportId(isOpen ? null : report.id)}
                                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <span className="flex items-center gap-2">
                                        <i className="fas fa-file-lines text-purple-400 text-xs"></i>
                                        {label}
                                      </span>
                                      <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                                    </button>
                                    {isOpen && (
                                      <div className="px-4 pb-4 pt-2 bg-purple-50 text-sm text-gray-800 leading-relaxed">
                                        <ReactMarkdown
                                          components={{
                                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                                            li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                            h3: ({ children }) => <h3 className="font-bold text-gray-900 mt-3 mb-1">{children}</h3>,
                                            a: ({ href, children }) => <a href={href?.toString()} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{children}</a>,
                                          }}
                                          disallowedElements={['script', 'iframe', 'img']}
                                        >
                                          {report.analysis}
                                        </ReactMarkdown>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm italic">AI звітів немає</p>
                          )}
                        </div>

                        {/* Рефлексії по днях */}
                        <div className="border-t border-gray-100 pt-6 mt-6">
                          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">Рефлексії по днях</h3>
                          <div className="space-y-4">
                            {selectedTrainee.days.filter(d => d.reflection).map(day => (
                              <div key={day.day} id={`reflection-day-${day.day}`} className="border border-gray-200 rounded-xl p-4">
                                <h4 className="font-bold text-gray-800 mb-3">День {day.day}</h4>
                                <div className="space-y-2 text-sm text-gray-700">
                                  {day.reflection && (
                                    <>
                                      <div>
                                        <span className="font-semibold">Настрій:</span> {day.reflection.q1}/5 {['😞', '😕', '😐', '🙂', '😄'][day.reflection.q1 - 1]}
                                      </div>
                                      <div>
                                        <span className="font-semibold">Зрозумілість:</span> {day.reflection.q2}/5
                                      </div>
                                      <div>
                                        <span className="font-semibold">Комфорт:</span> {day.reflection.q3}/5
                                      </div>
                                      <div>
                                        <span className="font-semibold">Лояльність:</span> {day.reflection.q5}/5
                                      </div>
                                      {day.reflection.q4 && (
                                        <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded text-gray-700">
                                          <span className="font-semibold block mb-1">Що викликало стрес:</span>
                                          {day.reflection.q4}
                                        </div>
                                      )}
                                      {day.reflection.comments && (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-gray-700">
                                          <span className="font-semibold block mb-1">Коментарі:</span>
                                          {day.reflection.comments}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                            {selectedTrainee.days.filter(d => d.reflection).length === 0 && (
                              <p className="text-gray-400 text-sm italic">Рефлексій немає</p>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
