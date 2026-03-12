import { useState, useEffect } from 'react';
import { api, type DayPlanRecord } from '../services/api';

const TASK_TYPES = [
  { value: 'theory',      label: 'Теорія' },
  { value: 'practice',    label: 'Практика' },
  { value: 'meeting',     label: 'Зустріч' },
  { value: 'observation', label: 'Спостереження' },
  { value: 'other',       label: 'Інше' },
];

const TYPE_COLORS: Record<string, string> = {
  theory:      'bg-blue-100 text-blue-700',
  practice:    'bg-emerald-100 text-emerald-700',
  meeting:     'bg-purple-100 text-purple-700',
  observation: 'bg-amber-100 text-amber-700',
  other:       'bg-gray-100 text-gray-600',
};

// ── Task inline form ──────────────────────────────────────────────────────────
interface TaskFormProps {
  initial?: { title: string; description: string; type: string };
  onSave: (data: { title: string; description: string; type: string }) => Promise<void>;
  onCancel: () => void;
}

function TaskForm({ initial, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState(initial?.type ?? 'other');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave({ title, description, type });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 pt-1">
      <input
        value={title} onChange={e => setTitle(e.target.value)} required
        placeholder="Заголовок завдання"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kameya-burgundy"
      />
      <textarea
        value={description} onChange={e => setDescription(e.target.value)}
        placeholder="Опис (необов'язково)"
        rows={2}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kameya-burgundy resize-none"
      />
      <select
        value={type} onChange={e => setType(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kameya-burgundy bg-white"
      >
        {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-600"><i className="fas fa-circle-exclamation mr-1"></i>{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
          Скасувати
        </button>
        <button type="submit" disabled={loading}
          className="px-3 py-1.5 bg-kameya-burgundy text-white text-xs font-semibold rounded-lg hover:bg-red-900 disabled:opacity-50">
          {loading ? <><i className="fas fa-spinner fa-spin mr-1"></i>Збереження...</> : initial ? 'Зберегти' : 'Додати'}
        </button>
      </div>
    </form>
  );
}

// ── Day block ─────────────────────────────────────────────────────────────────
interface DayBlockProps {
  plan: DayPlanRecord;
  onUpdate: (plan: DayPlanRecord) => void;
  onDelete: () => void;
}

function DayBlock({ plan, onUpdate, onDelete }: DayBlockProps) {
  const [expanded, setExpanded] = useState(true);
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(false);

  const handleAddTask = async (data: { title: string; description: string; type: string }) => {
    const { dayPlan } = await api.addDayPlanTask(plan.day, data);
    onUpdate(dayPlan);
    setAddingTask(false);
  };

  const handleUpdateTask = async (taskId: string, data: { title: string; description: string; type: string }) => {
    const { dayPlan } = await api.updateDayPlanTask(plan.day, taskId, data);
    onUpdate(dayPlan);
    setEditingTaskId(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    const { dayPlan } = await api.deleteDayPlanTask(plan.day, taskId);
    onUpdate(dayPlan);
    setDeletingTaskId(null);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="w-8 h-8 bg-kameya-burgundy text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
          {plan.day}
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold text-gray-800">День {plan.day}</span>
          {plan.isHoliday && (
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold">Вихідний</span>
          )}
          <span className="ml-2 text-xs text-gray-400">{plan.tasks.length} завд.</span>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {confirmDeleteDay ? (
            <>
              <span className="text-xs text-red-600 mr-1">Видалити день?</span>
              <button onClick={() => setConfirmDeleteDay(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Ні</button>
              <button onClick={onDelete} className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700">Так</button>
            </>
          ) : (
            <button onClick={() => setConfirmDeleteDay(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
              <i className="fas fa-trash text-xs"></i>
            </button>
          )}
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'} text-xs text-gray-400 ml-1`}></i>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-2">
          {plan.tasks.map(task => (
            <div key={task._id}>
              {editingTaskId === task._id ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <TaskForm
                    initial={task}
                    onSave={data => handleUpdateTask(task._id, data)}
                    onCancel={() => setEditingTaskId(null)}
                  />
                </div>
              ) : deletingTaskId === task._id ? (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs text-red-700">Видалити <span className="font-bold">«{task.title}»</span>?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeletingTaskId(null)} className="text-xs text-gray-500 hover:text-gray-700">Ні</button>
                    <button onClick={() => handleDeleteTask(task._id)}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700">Так</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 rounded-lg hover:bg-gray-50 group transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold ${TYPE_COLORS[task.type] ?? TYPE_COLORS.other}`}>
                        {TASK_TYPES.find(t => t.value === task.type)?.label ?? task.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{task.title}</p>
                    {task.description && <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>}
                  </div>
                  <div className="shrink-0 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingTaskId(task._id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-kameya-burgundy hover:bg-gray-100">
                      <i className="fas fa-pen text-[10px]"></i>
                    </button>
                    <button onClick={() => setDeletingTaskId(task._id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
                      <i className="fas fa-trash text-[10px]"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {addingTask ? (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <TaskForm onSave={handleAddTask} onCancel={() => setAddingTask(false)} />
            </div>
          ) : (
            <button onClick={() => setAddingTask(true)}
              className={`w-full mt-1 flex items-center justify-center gap-1.5 py-2 border border-dashed rounded-lg text-xs font-semibold transition-colors ${
                plan.tasks.length > 0
                  ? 'border-kameya-burgundy text-kameya-burgundy hover:bg-kameya-burgundy/5'
                  : 'border-gray-200 text-gray-400 hover:text-kameya-burgundy hover:border-kameya-burgundy'
              }`}>
              <i className="fas fa-plus"></i> Додати завдання
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TasksManager() {
  const [dayPlans, setDayPlans] = useState<DayPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDay, setAddingDay] = useState(false);
  const [addDayNum, setAddDayNum] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);
  const [addDayError, setAddDayError] = useState('');
  const [addDayLoading, setAddDayLoading] = useState(false);

  useEffect(() => {
    api.getDayPlans()
      .then(({ dayPlans }) => setDayPlans(dayPlans))
      .finally(() => setLoading(false));
  }, []);

  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDayError('');
    setAddDayLoading(true);
    try {
      const { dayPlan } = await api.createDayPlan(Number(addDayNum), isHoliday);
      setDayPlans(prev => [...prev, dayPlan].sort((a, b) => a.day - b.day));
      setAddDayNum('');
      setIsHoliday(false);
      setAddingDay(false);
    } catch (err) {
      setAddDayError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setAddDayLoading(false);
    }
  };

  const handleDeleteDay = async (day: number) => {
    await api.deleteDayPlan(day);
    setDayPlans(prev => prev.filter(p => p.day !== day));
  };

  const handleUpdate = (updated: DayPlanRecord) => {
    setDayPlans(prev => prev.map(p => p.day === updated.day ? updated : p));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <i className="fas fa-spinner fa-spin text-2xl text-kameya-burgundy"></i>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-800">План навчання</h2>
        <span className="text-xs text-gray-400">Спільний для всіх стажерів</span>
      </div>

      {addingDay ? (
        <form onSubmit={handleAddDay} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">Новий день</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Номер дня</label>
              <input
                type="number" min="1" max="365"
                value={addDayNum} onChange={e => setAddDayNum(e.target.value)} required
                className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kameya-burgundy"
                placeholder="1"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mb-2">
              <input type="checkbox" checked={isHoliday} onChange={e => setIsHoliday(e.target.checked)}
                className="w-4 h-4 accent-kameya-burgundy" />
              Вихідний день
            </label>
          </div>
          {addDayError && <p className="text-xs text-red-600"><i className="fas fa-circle-exclamation mr-1"></i>{addDayError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setAddingDay(false); setAddDayError(''); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Скасувати</button>
            <button type="submit" disabled={addDayLoading}
              className="px-4 py-2 bg-kameya-burgundy text-white text-sm font-semibold rounded-lg hover:bg-red-900 disabled:opacity-50">
              {addDayLoading ? <><i className="fas fa-spinner fa-spin mr-1"></i>Створення...</> : 'Створити день'}
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAddingDay(true)}
          className="flex items-center gap-2 text-sm text-kameya-burgundy font-semibold hover:underline">
          <i className="fas fa-plus-circle"></i> Додати день
        </button>
      )}

      {dayPlans.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">
          План навчання порожній. Додайте перший день.
        </p>
      ) : (
        <div className="space-y-3">
          {dayPlans.map(plan => (
            <DayBlock
              key={plan.day}
              plan={plan}
              onUpdate={handleUpdate}
              onDelete={() => handleDeleteDay(plan.day)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
