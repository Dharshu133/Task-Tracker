'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ActivityLog {
  id: string;
  actionType: string;
  detail: string;
  createdAt: string;
  user: { email: string };
  task?: { id: string; title: string };
}

export default function ActivityLogView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await api.get<ActivityLog[]>('/api/activity-logs');
        setLogs(data);
      } catch (err: any) {
        setError('Failed to fetch activity logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-900 dark:text-white">Organization Activity History</h3>
        <span className="text-xs text-slate-500">{logs?.length || 0} events logged</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">No activity recorded yet</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 text-[10px] font-bold">
                        {log.user.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        @{log.user.email.split('@')[0]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      log.actionType === 'CREATED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      log.actionType === 'DELETED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      log.actionType === 'STATUS_CHANGED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>
                      {log.actionType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.task ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                          {log.task.title}
                        </span>
                        <span className="text-[10px] text-slate-500">Task ID: {log.task.id.slice(0, 8)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">System Event</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
