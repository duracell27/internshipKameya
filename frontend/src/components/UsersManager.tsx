import { useEffect, useState } from 'react';
import { api, type UserRecord } from '../services/api';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Адмін',
  trainee: 'Стажер',
};

const AVATAR_COLORS = [
  'bg-kameya-burgundy',
  'bg-purple-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
];

function avatarColor(name: string) {
  const code = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[code];
}

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ---------- Форма створення / редагування ----------
interface UserFormProps {
  initial?: UserRecord;
  onSave: (data: { name: string; phone: string; password: string; role: 'admin' | 'trainee'; currentDay: number | null }) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

function UserForm({ initial, onSave, onCancel, isEdit }: UserFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'trainee'>(initial?.role ?? 'trainee');
  const [currentDay, setCurrentDay] = useState<string>(
    initial?.currentDay != null ? String(initial.currentDay) : ''
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isEdit && !password) { setError('Введіть пароль'); return; }
    setLoading(true);
    try {
      await onSave({
        name,
        phone,
        password,
        role,
        currentDay: currentDay !== '' ? Number(currentDay) : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Ім'я</label>
          <input
            value={name} onChange={e => setName(e.target.value)} required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kameya-burgundy"
            placeholder="Ім'я Прізвище"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Телефон</label>
          <input
            value={phone} onChange={e => setPhone(e.target.value)} required
            disabled={isEdit}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kameya-burgundy disabled:bg-gray-50 disabled:text-gray-400"
            placeholder="0501234567"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
            {isEdit ? 'Новий пароль (якщо змінити)' : 'Пароль'}
          </label>
          <input
            type="password"
            value={password} onChange={e => setPassword(e.target.value)}
            required={!isEdit}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kameya-burgundy"
            placeholder={isEdit ? 'Залиште порожнім — без змін' : '••••••••'}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Роль</label>
          <select
            value={role} onChange={e => setRole(e.target.value as 'admin' | 'trainee')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kameya-burgundy bg-white"
          >
            <option value="trainee">Стажер</option>
            <option value="admin">Адмін</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">День стажування</label>
          <input
            type="number" min="1" max="365"
            value={currentDay} onChange={e => setCurrentDay(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kameya-burgundy"
            placeholder="Непризначено"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <i className="fas fa-circle-exclamation"></i> {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Скасувати
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 bg-kameya-burgundy text-white text-sm font-semibold rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50">
          {loading ? <><i className="fas fa-spinner fa-spin mr-1"></i>Збереження...</> : isEdit ? 'Зберегти' : 'Створити'}
        </button>
      </div>
    </form>
  );
}

function sortUsers(users: UserRecord[]): UserRecord[] {
  return [...users].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'trainee' ? -1 : 1;
    if (a.role === 'trainee') {
      if (a.currentDay == null && b.currentDay == null) return 0;
      if (a.currentDay == null) return 1;
      if (b.currentDay == null) return -1;
      return b.currentDay - a.currentDay;
    }
    return 0;
  });
}

// ---------- Головний компонент ----------
interface UsersManagerProps {
  onUsersChange?: (users: UserRecord[]) => void;
}

export default function UsersManager({ onUsersChange }: UsersManagerProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const { users } = await api.getUsers();
      const sorted = sortUsers(users);
      setUsers(sorted);
      onUsersChange?.(sorted);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (data: Parameters<typeof api.createUser>[0]) => {
    await api.createUser(data);
    setShowCreate(false);
    loadUsers();
  };

  const handleUpdate = async (id: string, data: Parameters<typeof api.updateUser>[1]) => {
    await api.updateUser(id, data);
    setEditingId(null);
    loadUsers();
  };

  const handleDelete = async (id: string) => {
    await api.deleteUser(id);
    setDeletingId(null);
    loadUsers();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Користувачі</h2>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-kameya-burgundy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-900 transition-colors"
          >
            <i className="fas fa-plus"></i> Додати
          </button>
        )}
      </div>

      {/* Форма створення */}
      {showCreate && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Новий користувач</h3>
          <UserForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {/* Список */}
      {loadingList ? (
        <div className="py-10 text-center text-gray-400">
          <i className="fas fa-spinner fa-spin text-2xl"></i>
        </div>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Користувачів ще немає.</p>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id}>
              {editingId === u.id ? (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Редагування: {u.name}</h3>
                  <UserForm
                    initial={u}
                    isEdit
                    onSave={data => handleUpdate(u.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : deletingId === u.id ? (
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm text-red-700">
                    Видалити <span className="font-bold">{u.name}</span>?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeletingId(null)}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
                      Скасувати
                    </button>
                    <button onClick={() => handleDelete(u.id)}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">
                      Видалити
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  {/* Аватар */}
                  <div className={`w-10 h-10 rounded-full ${avatarColor(u.name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {avatarInitials(u.name)}
                  </div>

                  {/* Інфо */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.phone}</p>
                  </div>

                  {/* Роль */}
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    u.role === 'admin'
                      ? 'bg-kameya-burgundy/10 text-kameya-burgundy'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ROLE_LABEL[u.role]}
                  </span>

                  {/* День стажування */}
                  <div className="shrink-0 text-center hidden sm:block">
                    {u.currentDay != null ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-semibold">
                        <i className="fas fa-calendar-day text-[10px]"></i> День {u.currentDay}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Непризначено</span>
                    )}
                  </div>

                  {/* Дії */}
                  <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingId(u.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-kameya-burgundy hover:bg-gray-100 transition-colors"
                      title="Редагувати">
                      <i className="fas fa-pen text-xs"></i>
                    </button>
                    <button onClick={() => setDeletingId(u.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Видалити">
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
