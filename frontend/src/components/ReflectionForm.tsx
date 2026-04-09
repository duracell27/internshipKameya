import { useState } from 'react';
import type { Reflection } from '../types';

interface ReflectionFormProps {
  onSubmit: (reflection: Reflection) => void;
  existingReflection?: Reflection;
}

const RATING_LABELS: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uk-UA', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ReflectionForm({ onSubmit, existingReflection }: ReflectionFormProps) {
  const [formData, setFormData] = useState<Reflection>(
    existingReflection || {
      q1: 3, q2: 3, q3: 3, q4: '', q5: 3,
      comments: '',
      submittedAt: new Date().toISOString(),
    }
  );

  const [submitted, setSubmitted] = useState(!!existingReflection);
  const [confirming, setConfirming] = useState(false);
  const [errors, setErrors] = useState<{ q4?: string; comments?: string }>({});

  const handleRating = (key: keyof Reflection, value: number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleText = (key: 'q4' | 'comments', value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const newErrors: { q4?: string; comments?: string } = {};
    if (formData.q4.trim().length < 10) {
      newErrors.q4 = 'Мінімум 10 символів';
    }
    if (formData.comments.trim().length < 10) {
      newErrors.comments = 'Мінімум 10 символів';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitClick = () => {
    if (!validate()) return;
    setConfirming(true);
  };

  const handleConfirm = () => {
    onSubmit({ ...formData, submittedAt: new Date().toISOString() });
    setConfirming(false);
    setSubmitted(true);
  };

  const ratingLabel = (val: number) => RATING_LABELS[val] ?? val;

  if (submitted) {
    const r = formData;
    const ratingRow = (label: string, val: number) => (
      <div className="flex items-center justify-between py-2 border-b border-green-100 last:border-0">
        <span className="text-sm text-green-800">{label}</span>
        <span className="font-bold text-green-700 whitespace-nowrap">{ratingLabel(val as number)}&nbsp;{val}/5</span>
      </div>
    );

    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center text-lg shrink-0">
            <i className="fas fa-check"></i>
          </div>
          <div>
            <h3 className="text-base font-bold text-green-800">Дякуємо за рефлексію!</h3>
            {r.submittedAt && (
              <p className="text-xs text-green-600">
                {formatDate(r.submittedAt)}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-green-100 p-4 mb-4 space-y-0">
          {ratingRow('Як ти загалом почуваєшся?', r.q1)}
          {ratingRow('Зрозумілість матеріалу?', r.q2)}
          {ratingRow('Комфорт у салоні?', r.q3)}
          {ratingRow('Наскільки подобається в Камеї?', r.q5)}
          {r.q4 && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-green-700 mb-1">Що викликало стрес?</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.q4}</p>
            </div>
          )}
          {r.comments && (
            <div className="pt-2 border-t border-green-100 mt-2">
              <p className="text-xs font-semibold text-green-700 mb-1">Коментарі</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.comments}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (confirming) {
    const r = formData;
    const ratingRow = (label: string, val: number) => (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="font-bold text-gray-800 whitespace-nowrap">{ratingLabel(val as number)}&nbsp;{val}/5</span>
      </div>
    );

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-circle-question text-amber-500 text-xl"></i>
          <h3 className="text-base font-bold text-gray-800">Підтвердити відправку?</h3>
        </div>
        <p className="text-xs text-amber-600 mb-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <i className="fas fa-triangle-exclamation mr-1"></i>
          Рефлексію не можна буде редагувати після збереження.
        </p>

        <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 mb-5 space-y-0">
          {ratingRow('Як ти загалом почуваєшся?', r.q1)}
          {ratingRow('Зрозумілість матеріалу?', r.q2)}
          {ratingRow('Комфорт у салоні?', r.q3)}
          {ratingRow('Наскільки подобається в Камеї?', r.q5)}
          {r.q4 && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">Що викликало стрес?</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.q4}</p>
            </div>
          )}
          {r.comments && (
            <div className="pt-2 border-t border-gray-100 mt-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">Коментарі</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.comments}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
          >
            Назад
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-kameya-burgundy text-white py-2.5 rounded-xl font-bold hover:bg-red-900 transition-colors shadow text-sm"
          >
            Так, зберегти
          </button>
        </div>
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
          placeholder="Опиши, що було складним або стресовим сьогодні..."
          className={`w-full border rounded-lg p-3 text-sm focus:ring-1 focus:ring-kameya-burgundy outline-none transition-all h-20 resize-none ${
            errors.q4 ? 'border-red-400 bg-red-50' : 'border-gray-200'
          }`}
        />
        {errors.q4 && <p className="text-xs text-red-500 mt-1">{errors.q4}</p>}
      </div>

      <RatingScale label="5. Наскільки подобається в Камеї?" field="q5" />

      <div className="mb-6">
        <label className="block text-sm text-gray-700 mb-2">
          <span className="font-semibold">Щоденна рефлексія</span>
          <span className="font-normal"> (що вийшло найкраще? над чим потрібно працювати?)</span>
        </label>
        <textarea
          value={formData.comments}
          onChange={e => handleText('comments', e.target.value)}
          placeholder="Поділись своїми думками про сьогоднішній день..."
          className={`w-full border rounded-lg p-3 text-sm focus:ring-1 focus:ring-kameya-burgundy outline-none transition-all h-24 resize-none ${
            errors.comments ? 'border-red-400 bg-red-50' : 'border-gray-200'
          }`}
        />
        {errors.comments && <p className="text-xs text-red-500 mt-1">{errors.comments}</p>}
      </div>

      <button
        onClick={handleSubmitClick}
        className="w-full bg-kameya-burgundy text-white py-3 rounded-xl font-bold hover:bg-red-900 transition-colors shadow-lg"
      >
        Зберегти
      </button>
    </div>
  );
}
