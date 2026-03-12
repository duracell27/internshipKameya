import { useEffect, useState } from 'react';
import { api, type EventRecord } from '../services/api';

const FIELD_LABELS: Record<string, string> = {
  name: "ім'я",
  role: 'роль',
  password: 'пароль',
  currentDay: 'поточний день',
  startDate: 'дату початку',
};

const TYPE_CONFIG: Record<
  EventRecord['type'],
  { icon: string; color: string; bg: string }
> = {
  login_success:       { icon: 'fa-right-to-bracket', color: 'text-green-600',      bg: 'bg-green-50' },
  login_failed:        { icon: 'fa-triangle-exclamation', color: 'text-red-500',    bg: 'bg-red-50' },
  user_created:        { icon: 'fa-user-plus',          color: 'text-blue-600',     bg: 'bg-blue-50' },
  user_updated:        { icon: 'fa-user-pen',           color: 'text-amber-600',    bg: 'bg-amber-50' },
  user_deleted:        { icon: 'fa-user-minus',         color: 'text-red-600',      bg: 'bg-red-50' },
  reflection_submitted:{ icon: 'fa-comment-dots',       color: 'text-purple-600',   bg: 'bg-purple-50' },
};

function eventDescription(event: EventRecord): string {
  const actor = event.actorName ?? '—';
  const target = event.targetName ?? '—';
  switch (event.type) {
    case 'login_success':
      return `${actor} увійшов(-ла) в систему`;
    case 'login_failed':
      return `Невдала спроба входу з номера ${event.meta?.phone ?? '—'}`;
    case 'user_created': {
      const roleLabel = event.meta?.role === 'admin' ? 'Адмін' : 'Стажер';
      return `${actor} створив(-ла) користувача ${target} (${roleLabel})`;
    }
    case 'user_updated': {
      const changes = (event.meta?.changes ?? [])
        .map(f => FIELD_LABELS[f] ?? f)
        .join(', ');
      return `${actor} змінив(-ла) дані ${target}: ${changes}`;
    }
    case 'user_deleted':
      return `${actor} видалив(-ла) користувача ${target}`;
    case 'reflection_submitted':
      return `${actor} надіслав(-ла) рефлексію за День ${event.meta?.day ?? '—'}`;
    default:
      return 'Невідома подія';
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

interface EventsLogProps {
  onViewReflection: (traineeId: string, day: number) => void;
}

export default function EventsLog({ onViewReflection }: EventsLogProps) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventRecord['type'] | 'all'>('all');

  useEffect(() => {
    api.getEvents()
      .then(({ events }) => setEvents(events))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  const FILTER_OPTIONS: { value: EventRecord['type'] | 'all'; label: string }[] = [
    { value: 'all',                  label: 'Всі' },
    { value: 'login_success',        label: 'Входи' },
    { value: 'login_failed',         label: 'Помилки входу' },
    { value: 'user_created',         label: 'Створення' },
    { value: 'user_updated',         label: 'Зміни' },
    { value: 'user_deleted',         label: 'Видалення' },
    { value: 'reflection_submitted', label: 'Рефлексії' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Журнал подій</h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filter === opt.value
                  ? 'bg-kameya-burgundy text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">
          <i className="fas fa-spinner fa-spin text-2xl"></i>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-10">Подій ще немає.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(event => {
            const cfg = TYPE_CONFIG[event.type];
            const isReflection = event.type === 'reflection_submitted';
            return (
              <div
                key={event._id}
                className="flex items-start gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {/* Іконка */}
                <div className={`w-8 h-8 shrink-0 rounded-full ${cfg.bg} flex items-center justify-center`}>
                  <i className={`fas ${cfg.icon} ${cfg.color} text-xs`}></i>
                </div>

                {/* Текст */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{eventDescription(event)}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatTime(event.createdAt)}</p>
                </div>

                {/* Посилання на рефлексію */}
                {isReflection && event.meta?.traineeId && event.meta?.day != null && (
                  <button
                    onClick={() => onViewReflection(event.meta!.traineeId!, event.meta!.day!)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Переглянути рефлексію"
                  >
                    <i className="fas fa-arrow-up-right-from-square text-xs"></i>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
