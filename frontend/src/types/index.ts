export interface Reflection {
  q1: number;
  q2: number;
  q3: number;
  q4: string;
  q5: number;
  comments: string;
  submittedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  type: 'theory' | 'practice' | 'meeting' | 'observation' | 'other';
}

export interface DayPlan {
  day: number;
  isHoliday?: boolean;
  tasks: Task[];
  reflection?: Reflection;
}

export interface Trainee {
  id: string;
  name: string;
  position: string;
  startDate: string;
  days: DayPlan[];
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'trainee';
  currentDay: number | null;
}
