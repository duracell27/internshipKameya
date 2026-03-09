import { useState } from 'react';
import type { Reflection } from '../types';

interface ReflectionFormProps {
  onSubmit: (reflection: Reflection) => void;
  existingReflection?: Reflection;
}

export default function ReflectionForm({ onSubmit, existingReflection }: ReflectionFormProps) {
  const [formData, setFormData] = useState<Reflection>(
    existingReflection || {
      q1: 3,
      q2: 3,
      q3: 3,
      q4: '',
      q5: 3,
      comments: '',
      submittedAt: new Date().toISOString(),
    }
  );

  const [submitted, setSubmitted] = useState(!!existingReflection);

  const handleRating = (key: keyof Reflection, value: number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleText = (key: 'q4' | 'comments', value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit({ ...formData, submittedAt: new Date().toISOString() });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          <i className="fas fa-check"></i>
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Дякуємо за рефлексію!</h3>
        <p className="text-green-700">Твій відгук збережено.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm text-green-600 font-semibold underline"
        >
          Редагувати відповіді
        </button>
      </div>
    );
  }

  const RatingScale = ({ label, field }: { label: string; field: keyof Reflection }) => (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">{label}</label>
      <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
        {[1, 2, 3, 4, 5].map(val => (
          <button
            key={val}
            onClick={() => handleRating(field, val)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition-all ${
              formData[field] === val
                ? 'bg-kameya-burgundy text-white scale-110 shadow-md'
                : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
        <i className="fas fa-comment-dots text-kameya-burgundy mr-2"></i>
        Щоденна рефлексія
      </h2>

      <RatingScale label="1. Як ти загалом почуваєшся?" field="q1" />
      <RatingScale label="2. Зрозумілість матеріалу?" field="q2" />
      <RatingScale label="3. Комфорт у салоні?" field="q3" />

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          4. Що викликало стрес?
        </label>
        <textarea
          value={formData.q4}
          onChange={e => handleText('q4', e.target.value)}
          placeholder="..."
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-1 focus:ring-kameya-burgundy outline-none transition-all h-20"
        />
      </div>

      <RatingScale label="5. Наскільки подобається в Камеї?" field="q5" />

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Коментарі (що було найкращим або що змінити?)
        </label>
        <textarea
          value={formData.comments}
          onChange={e => handleText('comments', e.target.value)}
          placeholder="Твої думки..."
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-1 focus:ring-kameya-burgundy outline-none transition-all h-24"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-kameya-burgundy text-white py-3 rounded-xl font-bold hover:bg-red-900 transition-colors shadow-lg"
      >
        Зберегти
      </button>
    </div>
  );
}
