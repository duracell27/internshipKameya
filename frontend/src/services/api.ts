const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      ...options,
    });
  } catch {
    throw new Error('Не вдалося підключитися до сервера. Перевірте з\'єднання.');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Помилка запиту');
  return data as T;
}

export interface UserRecord {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'trainee';
  currentDay: number | null;
}

export const api = {
  login: (phone: string, password: string) =>
    request<{ token: string; user: UserRecord }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ phone, password }) }
    ),

  me: () =>
    request<{ user: UserRecord }>('/api/auth/me'),

  getUsers: () =>
    request<{ users: UserRecord[] }>('/api/auth/users'),

  createUser: (data: { name: string; phone: string; password: string; role: 'admin' | 'trainee'; currentDay?: number | null }) =>
    request<{ user: UserRecord }>('/api/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: Partial<{ name: string; role: 'admin' | 'trainee'; currentDay: number | null; password: string }>) =>
    request<{ user: UserRecord }>(`/api/auth/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/api/auth/users/${id}`, { method: 'DELETE' }),

  // ── Trainee ──────────────────────────────────────────────────────────────
  getMyTrainee: () =>
    request<{ trainee: import('../types').Trainee }>('/api/trainees/me'),

  getTrainees: () =>
    request<{ trainees: import('../types').Trainee[] }>('/api/trainees'),

  toggleTask: (taskId: string) =>
    request<{ trainee: import('../types').Trainee }>(`/api/trainees/me/tasks/${taskId}`, {
      method: 'PATCH',
    }),

  submitReflection: (day: number, reflection: import('../types').Reflection) =>
    request<{ trainee: import('../types').Trainee }>(`/api/trainees/me/days/${day}/reflection`, {
      method: 'PUT',
      body: JSON.stringify(reflection),
    }),
};
