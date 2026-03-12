import type { DayPlan } from '../types';

interface DayCardProps {
  dayPlan: DayPlan;
  isActive: boolean;
  isCompleted: boolean;
  isToday?: boolean;
  onClick: () => void;
}

export default function DayCard({ dayPlan, isActive, isCompleted, isToday, onClick }: DayCardProps) {
  const isPreview = dayPlan.isPreview;

  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center min-w-[80px] h-[100px]
        ${isActive
          ? 'border-kameya-burgundy bg-kameya-burgundy text-white scale-105 shadow-lg'
          : isPreview
            ? 'border-gray-200 bg-gray-50 text-gray-300 opacity-60'
            : isCompleted
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-kameya-burgundy/30'}`}
    >
      <span className="text-[10px] font-bold uppercase mb-1">День</span>
      <span className="text-2xl font-bold">{dayPlan.day}</span>
      {isToday && !isActive && (
        <div className="absolute bottom-1 text-[8px] font-bold text-kameya-burgundy uppercase tracking-wide">Сьогодні</div>
      )}
      {isToday && isActive && (
        <div className="absolute bottom-1 text-[8px] font-bold text-white/80 uppercase tracking-wide">Сьогодні</div>
      )}

      {!isPreview && isCompleted && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-white">
          <i className="fas fa-check"></i>
        </div>
      )}
      {!isPreview && dayPlan.isHoliday && (
        <div className="absolute bottom-1 text-[8px] font-bold text-gray-400">ВІДПОЧИНОК</div>
      )}
    </button>
  );
}
