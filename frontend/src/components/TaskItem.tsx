import type { Task } from '../types';
import { TASK_TYPES, TYPE_COLORS } from '../constants/taskTypes';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

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
      className={`flex items-center p-4 rounded-xl border mb-3 transition-all ${disabled ? 'cursor-default opacity-60' : 'cursor-pointer'} ${task.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:shadow-md'}`}
      onClick={() => !disabled && onToggle(task.id)}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${task.completed ? 'bg-green-100 text-green-600' : 'bg-red-50 text-kameya-burgundy'}`}>
        <i className={`fas ${getIcon()} text-lg`}></i>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className={`font-semibold text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
          </h3>
          {getTypeLabel() && (
            <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold ${TYPE_COLORS[task.type] ?? TYPE_COLORS.other}`}>
              {getTypeLabel()}
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-gray-500">{task.description}</p>
        )}
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
        {task.completed && <i className="fas fa-check text-[10px]"></i>}
      </div>
    </div>
  );
}
