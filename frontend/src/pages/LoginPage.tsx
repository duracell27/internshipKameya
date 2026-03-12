import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-kameya-burgundy rounded-full flex items-center justify-center text-white font-bold text-3xl italic shadow-lg mb-4">
            K
          </div>
          <h1 className="text-2xl font-extrabold text-kameya-burgundy tracking-tight">KAMEYA</h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mt-1">ACADEMY</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Вхід</h2>
          <p className="text-sm text-gray-500 mb-6">Введіть свій номер телефону та пароль</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Номер телефону
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <i className="fas fa-phone text-sm"></i>
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0508098182"
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kameya-burgundy/30 focus:border-kameya-burgundy transition"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Пароль
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <i className="fas fa-lock text-sm"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kameya-burgundy/30 focus:border-kameya-burgundy transition"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-3 py-2">
                <i className="fas fa-circle-exclamation text-red-400"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-kameya-burgundy text-white py-3 rounded-xl font-bold text-sm hover:bg-red-900 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? <><i className="fas fa-spinner fa-spin mr-2"></i>Вхід...</>
                : 'Увійти'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Не маєш акаунту? Зверніться до адміністратора:{' '}
          <a href="https://t.me/+380972615389" target="_blank" rel="noopener noreferrer" className="text-kameya-burgundy font-semibold hover:underline inline-flex items-center gap-1">
            <i className="fab fa-telegram text-[11px]"></i> 097 261 53 89
          </a>
        </p>
      </div>
    </div>
  );
}
