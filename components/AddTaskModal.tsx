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

interface AddTaskModalProps {
  projects: Project[];
  orgUsers: OrgUser[];
  currentUserRole: string;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export default function AddTaskModal({ projects, orgUsers, currentUserRole, onClose, onCreated }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [assigneeId, setAssigneeId] = useState('');
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
    if (!projectId) return 'Please select a project';
    return '';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      const task = await api.post<Task>('/api/tasks', {
        title: title.trim(),
        description: description.trim() || undefined,
        project_id: projectId,
        assignee_id: assigneeId || undefined,
      });
      onCreated(task);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create task');
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add New Task</h2>
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
            <label htmlFor="task-title" className="label">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="task-title"
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
            <label htmlFor="task-description" className="label">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional task description…"
              rows={3}
              className="input-field resize-none"
              disabled={loading}
            />
          </div>

          {/* Project */}
          <div>
            <label htmlFor="task-project" className="label">
              Project <span className="text-red-400">*</span>
            </label>
            <select
              id="task-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="select-field"
              disabled={loading}
            >
              {projects.length === 0 && <option value="">No projects available</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">{p.name}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label htmlFor="task-assignee" className="label">Assignee</label>
            <select
              id="task-assignee"
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
              id="create-task-submit"
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
                  Creating…
                </>
              ) : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
