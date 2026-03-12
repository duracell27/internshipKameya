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
  isPreview?: boolean;
  tasks: Task[];
  reflection?: Reflection;
}

export interface AiReport {
  id: string;
  analysis: string;
  daysCount: number;
  createdAt: string;
}

export interface Trainee {
  id: string;
  name: string;
  position: string;
  startDate: string;
  endDate?: string;
  currentDay: number | null;
  isCompleted?: boolean;
  days: DayPlan[];
  aiReports: AiReport[];
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'trainee';
  currentDay: number | null;
}
