'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface Project {
  id: string;
  name: string;
}

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onProjectSelect: (id: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  unreadCount?: number;
}

export default function Sidebar({
  projects,
  activeProjectId,
  onProjectSelect,
  isOpen,
  onClose,
  userRole,
  onCreateProject,
  onDeleteProject,
  unreadCount = 0,
}: SidebarProps) {
  const isAdmin = userRole === 'ADMIN';
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-40 bg-white dark:bg-[#020617] border-r border-slate-200 dark:border-white/5 flex flex-col
          transition-transform duration-500 ease-in-out shadow-xl shadow-black/5 dark:shadow-none
          lg:translate-x-0 lg:static lg:h-auto lg:flex
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-5 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Menu</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-500 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/10"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {/* Dashboard */}
          <button
            id="project-all"
            onClick={() => { onProjectSelect(null); onClose(); }}
            className={`sidebar-item ${activeProjectId === null ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${activeProjectId === null ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-brand-500'}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <span>Dashboard</span>
          </button>

          {/* Notifications */}
          <button
            id="nav-notifications"
            onClick={() => { onProjectSelect('NOTIFICATIONS' as any); onClose(); }}
            className={`sidebar-item group ${activeProjectId === ('NOTIFICATIONS' as any) ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${activeProjectId === ('NOTIFICATIONS' as any) ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-brand-500'}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <span className="flex-1">Inbox</span>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Users - Admin only */}
          {isAdmin && (
            <>
              <div className="pt-6 pb-2 px-4">
                <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Management</h3>
              </div>
              <button
                id="nav-users"
                onClick={() => { onProjectSelect('USERS_VIEW' as any); onClose(); }}
                className={`sidebar-item ${activeProjectId === ('USERS_VIEW' as any) ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${activeProjectId === ('USERS_VIEW' as any) ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-brand-500'}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span>Team Members</span>
              </button>
              <button
                id="nav-activity"
                onClick={() => { onProjectSelect('ACTIVITY_LOG' as any); onClose(); }}
                className={`sidebar-item ${activeProjectId === ('ACTIVITY_LOG' as any) ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${activeProjectId === ('ACTIVITY_LOG' as any) ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-brand-500'}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>Audit Logs</span>
              </button>
            </>
          )}

          <div className="pt-6 pb-2 px-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Projects</h3>
              {isAdmin && (
                <button
                  onClick={onCreateProject}
                  className="p-1.5 bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white transition-all rounded-lg"
                  title="Create Project"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Project list */}
          <div className="space-y-1">
            {projects.length === 0 && (
              <div className="px-4 py-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No Active Projects</p>
              </div>
            )}
            {projects.map((project) => (
              <div key={project.id} className="group flex items-center gap-1">
                <button
                  id={`project-${project.id}`}
                  onClick={() => { onProjectSelect(project.id); onClose(); }}
                  className={`flex-1 sidebar-item ${activeProjectId === project.id ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${activeProjectId === project.id ? 'bg-brand-500 scale-125' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span className="truncate font-bold tracking-tight">{project.name}</span>
                </button>
                
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-red-500/10"
                    title="Delete Project"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="p-4 bg-slate-50/50 dark:bg-black/20 border-t border-slate-200 dark:border-white/5">
          {mounted && (
            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center py-2 px-3 rounded-xl transition-all ${theme === 'light' ? 'bg-white shadow-md text-brand-600' : 'text-slate-500 hover:text-slate-900'}`}
                title="Light Mode"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.364 17.364l-.707.707M17.364 17.364l-.707-.707M6.364 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center py-2 px-3 rounded-xl transition-all ${theme === 'dark' ? 'bg-[#020617] shadow-md text-brand-400' : 'text-slate-500 dark:hover:text-slate-100'}`}
                title="Dark Mode"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>
          )}
          <div className="mt-4 px-2">
             <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                <span>© 2026</span>
                <span>v2.0.4 Premium</span>
             </div>
          </div>
        </div>
      </aside>

    </>
  );
}
