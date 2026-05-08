'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface AddSubtaskFormProps {
  parentId: string;
  projectId: string;
  statuses: any[];
  onSuccess: (newSubtask: any) => void;
  onCancel: () => void;
}

export default function AddSubtaskForm({ parentId, projectId, statuses, onSuccess, onCancel }: AddSubtaskFormProps) {
  const [title, setTitle] = useState('');
  const [statusId, setStatusId] = useState(statuses[0]?.id || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await api.post<any>(`/api/tasks/${parentId}/subtasks`, {
        title: title.trim(),
        statusId,
        project_id: projectId
      });
      onSuccess(res);
      setTitle('');
    } catch (err) {
      console.error('Failed to add subtask', err);
      alert('Failed to add subtask');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col gap-3">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Subtask title..."
          className="input-field text-sm"
          disabled={loading}
        />
        <div className="flex items-center justify-between gap-3">
          <select
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            className="select-field text-xs h-8 py-0"
            disabled={loading}
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="btn-ghost text-xs h-8 px-3" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs h-8 px-3" disabled={loading || !title.trim()}>
              {loading ? 'Adding...' : 'Add Subtask'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
