import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
}

export default function TaskItem({ task, onToggle }: TaskItemProps) {
  const getIcon = () => {
    switch (task.type) {
      case 'theory':      return 'fa-book';
      case 'practice':    return 'fa-scissors';
      case 'meeting':     return 'fa-comments';
      case 'observation': return 'fa-eye';
      default:            return 'fa-circle-check';
    }
  };

  return (
    <div
      className={`flex items-center p-4 rounded-xl border mb-3 transition-all cursor-pointer ${task.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:shadow-md'}`}
      onClick={() => onToggle(task.id)}
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
  );
}
