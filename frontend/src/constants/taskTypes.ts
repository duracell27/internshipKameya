export const TASK_TYPES = [
  { value: 'theory',      label: 'Теорія' },
  { value: 'practice',    label: 'Практика' },
  { value: 'meeting',     label: 'Зустріч' },
  { value: 'observation', label: 'Спостереження' },
  { value: 'other',       label: 'Інше' },
];

export const TYPE_COLORS: Record<string, string> = {
  theory:      'bg-blue-100 text-blue-700',
  practice:    'bg-emerald-100 text-emerald-700',
  meeting:     'bg-purple-100 text-purple-700',
  observation: 'bg-amber-100 text-amber-700',
  other:       'bg-gray-100 text-gray-600',
};
