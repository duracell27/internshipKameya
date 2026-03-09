import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-kameya-burgundy rounded-full flex items-center justify-center text-white font-bold text-xl italic shadow-md">
          K
        </div>
        <div>
          <h1 className="text-xl font-bold text-kameya-burgundy tracking-tight">KAMEYA</h1>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">ACADEMY</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
