import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center">
        <img src="/Logo.png" alt="Kameya Academy" className="h-10 object-contain" />
      </div>

      <div className="flex items-center space-x-3">
        {user?.role === 'trainee' && (
          <a
            href="https://study.kameya.com.ua/login"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-kameya-burgundy text-kameya-burgundy rounded-full text-xs font-semibold hover:bg-kameya-burgundy hover:text-white transition-colors whitespace-nowrap"
          >
            Академія Камея
          </a>
        )}

        <span className={`hidden md:inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          user?.role === 'admin'
            ? 'bg-kameya-burgundy text-white'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {user?.role === 'admin' ? 'Адмін' : 'Стажер'}
        </span>

        <div className="flex items-center gap-2">
          <p className="hidden md:block text-xs font-semibold text-gray-700">{user?.name}</p>
          <div className="w-8 h-8 rounded-full bg-kameya-burgundy flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0] ?? '?'}
          </div>
        </div>

        <button
          onClick={logout}
          className="text-gray-400 hover:text-kameya-burgundy transition-colors"
          title="Вийти"
        >
          <i className="fas fa-right-from-bracket text-sm"></i>
        </button>
      </div>
    </nav>
  );
}
