'use client';

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkAllRead: () => Promise<void>;
}

export default function NotificationsView({ notifications, onMarkAllRead }: NotificationsViewProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Recent Notifications</h3>
          <p className="text-xs text-slate-500">{unreadCount} unread messages</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={onMarkAllRead}
            className="text-xs font-bold text-brand-500 hover:text-brand-600 bg-brand-500/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-slate-500 italic">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-6 transition-all border-l-4 ${
                n.isRead 
                  ? 'border-transparent opacity-60' 
                  : 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(var(--brand-500-rgb),0.5)]" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
