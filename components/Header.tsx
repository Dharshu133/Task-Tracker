'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  email: string;
  role: string;
  orgName?: string;
}

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface HeaderProps {
  user: User | null;
  onMenuToggle: () => void;
}

export default function Header({ user, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const data = await api.get<Notification[]>('/api/notifications');
        setNotifications(data);
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  async function handleMarkAllRead() {
    try {
      await api.patch('/api/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed to mark notifications as read', e);
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

      {/* User info + Notifications + Logout */}
      {user && (
        <div className="flex items-center gap-3 relative">
          
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 relative text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-brand-500 hover:text-brand-600 bg-brand-500/10 px-1.5 py-0.5 rounded">Mark all read</button>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowDropdown(false)}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.map(n => (
                          <div key={n.id} className={`p-4 transition-colors ${n.isRead ? 'opacity-60' : 'bg-brand-50/50 dark:bg-brand-900/10'}`}>
                            <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug">{n.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="hidden sm:block text-right border-l border-slate-200 dark:border-slate-700 pl-4 ml-1">
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
