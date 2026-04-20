import { Heart, Home, LogOut, LogIn, Map as MapIcon, PawPrint, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: '探索', icon: Home },
  { path: '/map', label: '地图', icon: MapIcon },
  { path: '/favorites', label: '收藏', icon: Heart },
  { path: '/profile', label: '我的', icon: User },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-surface-container-high hidden md:flex">
      <div className="flex justify-between items-center w-full px-6 py-4 mx-auto max-w-7xl">
        <Link to="/" className="flex items-center gap-3">
          <PawPrint className="text-primary w-8 h-8" />
          <span className="font-bold tracking-tight text-2xl text-primary">领养之家</span>
        </Link>

        <nav className="flex items-center gap-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-4 py-2 rounded-full font-semibold transition-colors',
                  isActive ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-primary'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-on-surface-variant max-w-[220px] truncate">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full signature-gradient text-white font-semibold"
            >
              <LogIn className="w-4 h-4" />
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md rounded-xl z-50 glass shadow-2xl flex justify-around items-center px-4 py-2 border border-outline-variant/20">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center p-3 transition-all rounded-full min-w-[72px]',
              isActive ? 'signature-gradient text-white shadow-lg scale-95' : 'text-outline hover:text-primary'
            )}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold tracking-wide uppercase">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
