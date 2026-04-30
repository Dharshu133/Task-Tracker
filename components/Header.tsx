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
  async function handleLogout() {
    try {
      await api.post('/api/auth/logout', {});
    } catch (e) {
      console.error('Logout log failed', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  return (
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center px-4 md:px-6 gap-4 sticky top-0 z-30">
      {/* Hamburger (mobile) */}
      <button
        id="sidebar-toggle"
        onClick={onMenuToggle}
        className="lg:hidden p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* App name */}
      <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/dashboard')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <span className="font-extrabold text-foreground text-xl tracking-tight hidden sm:block">
          Task<span className="text-primary">Tracker</span>
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User info + Notifications + Logout */}
      {user && (
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex flex-col items-end border-r border-border pr-4 mr-1">
            <p className="text-sm font-bold text-foreground truncate max-w-[180px]">{user.email}</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'ADMIN' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {user.role} {user.orgName ? `· ${user.orgName}` : ''}
              </p>
            </div>
          </div>
          
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0 shadow-sm">
            {user.email.charAt(0).toUpperCase()}
          </div>

          <button
            id="logout-btn"
            onClick={handleLogout}
            className="btn-ghost text-sm px-3 md:px-4 py-2 min-h-[40px] hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      )}
    </header>

  );
}
