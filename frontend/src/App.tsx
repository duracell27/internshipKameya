import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import DayCard from './components/DayCard';
import TaskItem from './components/TaskItem';
import ReflectionForm from './components/ReflectionForm';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './pages/LoginPage';
import type { Reflection, Trainee } from './types';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';

export default function App() {
  const { user, loading: authLoading } = useAuth();

  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [traineeLoading, setTraineeLoading] = useState(false);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('welcomeDismissed'));

  useEffect(() => {
    if (user?.role !== 'trainee') return;
    setTraineeLoading(true);
    api.getMyTrainee()
      .then(({ trainee }) => {
        setTrainee(trainee);
        if (trainee.isCompleted && trainee.days.length > 0) setActiveDay(trainee.days[trainee.days.length - 1].day);
        else if (trainee.currentDay != null) setActiveDay(trainee.currentDay);
        else if (trainee.days.length > 0) setActiveDay(trainee.days[0].day);
      })
      .catch(() => setTrainee(null))
      .finally(() => setTraineeLoading(false));
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'trainee') return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        api.getMyTrainee()
          .then(({ trainee }) => setTrainee(trainee))
          .catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  const activeDayPlan = trainee?.days.find(d => d.day === activeDay);
  const allTasks = trainee?.days.flatMap(d => d.tasks) ?? [];
  const overallProgress = allTasks.length
    ? Math.round((allTasks.filter(t => t.completed).length / allTasks.length) * 100)
    : 0;

  const toggleTask = async (taskId: string) => {
    try {
      const { trainee: updated } = await api.toggleTask(taskId);
      setTrainee(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const submitReflection = async (reflection: Reflection) => {
    try {
      const { trainee: updated } = await api.submitReflection(activeDay, reflection);
      setTrainee(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-kameya-burgundy"></i>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen pb-4">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {user.role === 'admin' ? (
          <AdminDashboard />
        ) : traineeLoading ? (
          <div className="flex items-center justify-center py-24">
            <i className="fas fa-spinner fa-spin text-3xl text-kameya-burgundy"></i>
          </div>
        ) : !trainee ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-calendar-xmark text-3xl text-gray-400"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">План ще не призначено</h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Ваш куратор скоро додасть план навчання. Зверніться до адміністратора.
            </p>
          </div>
        ) : trainee.currentDay === null && trainee.startDate ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-kameya-burgundy/10 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-hourglass-half text-3xl text-kameya-burgundy"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ваше стажування починається</h2>
            <p className="text-2xl font-bold text-kameya-burgundy mt-1">
              {new Date(trainee.startDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-gray-400 text-sm mt-3">
              Залишилось {Math.ceil((new Date(trainee.startDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)} {(() => { const d = Math.ceil((new Date(trainee.startDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000); return d === 1 ? 'день' : d < 5 ? 'дні' : 'днів'; })()} до початку
            </p>
          </div>
        ) : trainee.days.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-calendar-xmark text-3xl text-gray-400"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">План ще не призначено</h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Ваш куратор скоро додасть план навчання. Зверніться до адміністратора.
            </p>
          </div>
        ) : (
          <>
            {/* Банер завершення стажування */}
            {trainee.isCompleted && (
              <div className="mb-8 flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
                  <i className="fas fa-flag-checkered"></i>
                </div>
                <div>
                  <p className="font-bold text-emerald-800">Стажування завершено!</p>
                  <p className="text-sm text-emerald-600">
                    {trainee.endDate
                      ? new Date(trainee.endDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
                      : ''}
                  </p>
                </div>
              </div>
            )}

            {showWelcome && trainee.currentDay === 1 && trainee.days[0]?.tasks.filter(t => t.completed).length === 0 && (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-blue-900 mb-1">Вітаємо на стажуванні!</h3>
                  <p className="text-sm text-blue-800 mb-2">Це твій особистий кабінет новачка.</p>
                  <p className="text-sm text-blue-700">Відмічай успіхи та ділись враженнями)</p>
                </div>
                <button
                  onClick={() => {
                    setShowWelcome(false);
                    localStorage.setItem('welcomeDismissed', 'true');
                  }}
                  className="shrink-0 text-blue-400 hover:text-blue-600 ml-4 transition-colors"
                  title="Закрити"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            )}

            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">Твоє навчання</h2>
                <p className="text-gray-500 mt-2 max-w-lg">
                  Особистий кабінет стажера «Камея». Відмічай успіхи та ділись враженнями.
                </p>
              </div>

              <div className="w-full md:w-64 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Прогрес</span>
                  </div>
                  <span className="text-lg font-bold text-kameya-burgundy">{overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-kameya-burgundy h-full rounded-full transition-all duration-700"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            </header>

            <div className="mb-10 w-full max-w-full overflow-x-auto pb-4 pt-2">
              <div className="flex space-x-4 min-w-max px-1">
                {trainee.days.map(day => (
                  <DayCard
                    key={day.day}
                    dayPlan={day}
                    isActive={activeDay === day.day}
                    isCompleted={day.tasks.length > 0 && day.tasks.every(t => t.completed)}
                    isToday={!trainee.isCompleted && day.day === trainee.currentDay}
                    onClick={() => setActiveDay(day.day)}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm h-full">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-8">
                    <span className="w-12 h-12 bg-kameya-burgundy text-white rounded-xl flex items-center justify-center mr-4 shadow-md">
                      {activeDay}
                    </span>
                    План дня
                  </h2>

                  <div className="space-y-4">
                    {activeDayPlan?.isHoliday ? (
                      <div className="py-12 text-center text-gray-500">
                        Вихідний день. Гарного відпочинку!
                      </div>
                    ) : (
                      activeDayPlan?.tasks.map(task => (
                        <TaskItem key={task.id} task={task} onToggle={toggleTask} />
                      ))
                    )}
                  </div>
                </div>
              </section>

              <aside className="lg:col-span-1">
                {activeDayPlan?.isHoliday ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-400">
                    <i className="fas fa-umbrella-beach text-3xl mb-3 block"></i>
                    <p className="text-sm font-semibold">Вихідний день</p>
                    <p className="text-xs mt-1">Рефлексія не потрібна</p>
                  </div>
                ) : activeDayPlan?.isPreview ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-400">
                    <i className="fas fa-clock text-3xl mb-3 block"></i>
                    <p className="text-sm font-semibold">Цей день ще не настав</p>
                    <p className="text-xs mt-1">Рефлексія буде доступна завтра</p>
                  </div>
                ) : trainee.isCompleted ? (
                  activeDayPlan?.reflection ? (
                    <ReflectionForm
                      onSubmit={submitReflection}
                      existingReflection={activeDayPlan.reflection}
                      key={`${trainee.id}-${activeDay}`}
                    />
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-400">
                      <i className="fas fa-flag-checkered text-3xl mb-3 block text-emerald-400"></i>
                      <p className="text-sm font-semibold text-gray-500">Стажування завершено</p>
                      <p className="text-xs mt-1">Рефлексія не була заповнена</p>
                    </div>
                  )
                ) : (
                  <ReflectionForm
                    onSubmit={submitReflection}
                    existingReflection={activeDayPlan?.reflection}
                    key={`${trainee.id}-${activeDay}`}
                  />
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
