'use client';

import { useState, useEffect, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';

interface Project {
  id: string;
  name: string;
}
interface OrgUser {
  id: string;
  email: string;
  role: string;
}
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdBy: string;
  assignee: { id: string; email: string; role: string } | null;
  creator: { id: string; email: string; role: string };
  project: { id: string; name: string };
}

interface EditTaskModalProps {
  task: Task;
  orgUsers: OrgUser[];
  currentUserRole: string;
  onClose: () => void;
  onUpdated: (task: Task) => void;
}

export default function EditTaskModal({ task, orgUsers, currentUserRole, onClose, onUpdated }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter assignees: Members can only assign to other Members
  const filteredUsers = currentUserRole === 'MEMBER' 
    ? orgUsers.filter(u => u.role === 'MEMBER')
    : orgUsers;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function validate(): string {
    if (!title.trim()) return 'Title is required';
    return '';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      const updated = await api.patch<Task>(`/api/tasks/${task.id}`, {
        title: title.trim(),
        description: description.trim() || null,
        assignee_id: assigneeId || null,
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card w-full max-w-lg shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="edit-task-title" className="label">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="edit-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="input-field"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-task-description" className="label">Description</label>
            <textarea
              id="edit-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional task description…"
              rows={3}
              className="input-field resize-none"
              disabled={loading}
            />
          </div>

          {/* Project (Read-only for now as per requirement focus) */}
          <div>
            <label className="label">Project</label>
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 text-sm">
              {task.project.name}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label htmlFor="edit-task-assignee" className="label">Assignee</label>
            <select
              id="edit-task-assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="select-field"
              disabled={loading}
            >
              <option value="" className="bg-white dark:bg-slate-900">Unassigned</option>
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900">@{u.email.split('@')[0]} ({u.email})</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              id="update-task-submit"
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Updating…
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
