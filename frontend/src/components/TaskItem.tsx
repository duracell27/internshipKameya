import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

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

export default function TaskItem({ task, onToggle, disabled }: TaskItemProps) {
  const getIcon = () => {
    switch (task.type) {
      case 'theory':      return 'fa-book';
      case 'practice':    return 'fa-handshake';
      case 'meeting':     return 'fa-comments';
      case 'observation': return 'fa-eye';
      default:            return 'fa-circle-check';
    }
  };

  const getTypeLabel = () => {
    return TASK_TYPES.find(t => t.value === task.type)?.label ?? '';
  };

  return (
    <div
      className={`transition-all mb-3 ${disabled ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1 px-1">
        {getTypeLabel() && (
          <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold ${TYPE_COLORS[task.type] ?? TYPE_COLORS.other}`}>
            {getTypeLabel()}
          </span>
        )}
      </div>
      <div
        className={`flex items-center p-4 rounded-xl border transition-all ${disabled ? 'cursor-default opacity-60' : 'cursor-pointer'} ${task.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:shadow-md'}`}
        onClick={() => !disabled && onToggle(task.id)}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${task.completed ? 'bg-green-100 text-green-600' : 'bg-red-50 text-kameya-burgundy'}`}>
          <i className={`fas ${getIcon()} text-lg`}></i>
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
          )}
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
          {task.completed && <i className="fas fa-check text-[10px]"></i>}
        </div>
      </div>
    </div>
  );
}
