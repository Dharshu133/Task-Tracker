'use client';

import { useRouter } from 'next/navigation';

interface User {
  email: string;
  role: string;
  orgName?: string;
}

interface HeaderProps {
  user: User | null;
  onMenuToggle: () => void;
}

export default function Header({ user, onMenuToggle }: HeaderProps) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  return (
    <header className="h-16 bg-white dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Hamburger (mobile) */}
      <button
        id="sidebar-toggle"
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:bg-slate-800 transition-colors"
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* App name */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <span className="font-bold text-slate-900 dark:text-white text-lg hidden sm:block">Task Tracker</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User info + logout */}
      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.email}</p>
            <p className="text-xs text-slate-500">
              {user.role === 'ADMIN' ? '👑 Admin' : '👤 Member'}
              {user.orgName ? ` · ${user.orgName}` : ''}
            </p>
          </div>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-semibold text-sm shrink-0">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="btn-ghost text-sm px-3 py-2 min-h-[36px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
