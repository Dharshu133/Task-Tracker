'use client';

import { useState, useEffect, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';

import { Task, Project, User as OrgUser, Status } from '@/lib/types';

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
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [dueDate, setDueDate] = useState('');
  const [statusId, setStatusId] = useState('');
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingStatuses, setFetchingStatuses] = useState(false);

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

  // Fetch statuses for selected project
  useEffect(() => {
    if (!projectId) return;
    setFetchingStatuses(true);
    api.get<Status[]>(`/api/projects/${projectId}/statuses`)
      .then(data => {
        setStatuses(data);
        if (data.length > 0) setStatusId(data[0].id);
      })
      .catch(err => console.error('Failed to fetch statuses', err))
      .finally(() => setFetchingStatuses(false));
  }, [projectId]);

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
        statusId: statusId || undefined,
        assignee_id: assigneeId || undefined,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
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
      <div className="glass-card w-full max-w-lg flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">Create New Task</h2>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">Fill in the details to track a new item</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl transition-all duration-300"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 flex-1" noValidate>
          {error && (
            <div role="alert" className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold px-4 py-3 rounded-xl animate-shake">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="task-title" className="label">Title</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
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
              placeholder="Provide more context (optional)..."
              rows={2}
              className="input-field resize-none py-2"
              disabled={loading}
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-priority" className="label">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="select-field py-2"
                disabled={loading}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label htmlFor="task-due-date" className="label">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field py-2"
                disabled={loading}
              />
            </div>
          </div>

          {/* Project & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-project" className="label">Project</label>
              <select
                id="task-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="select-field py-2"
              >
                {projects.length === 0 && <option value="">No projects</option>}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-status" className="label">Status</label>
              <select
                id="task-status"
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="select-field py-2"
                disabled={loading || fetchingStatuses}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label htmlFor="task-assignee" className="label">Assignee</label>
            <select
              id="task-assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="select-field py-2"
              disabled={loading}
            >
              <option value="">Unassigned</option>
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>@{u.email.split('@')[0]}</option>
              ))}
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-border/40 flex gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1 h-11"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            id="create-task-submit"
            type="submit"
            onClick={(e) => {
              const form = e.currentTarget.closest('.glass-card')?.querySelector('form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            className="btn-primary flex-1 h-11"
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
