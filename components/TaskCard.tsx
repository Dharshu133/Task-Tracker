'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';

interface User {
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
  assignee: User | null;
  creator: User;
  project: { id: string; name: string };
}

interface TaskCardProps {
  task: Task;
  currentUserId: string;
  currentUserRole: string;
  onUpdate: (updated: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const STATUS_OPTIONS: { value: Task['status']; label: string; color: string }[] = [
  { value: 'OPEN', label: 'Open', color: 'text-sky-400' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'text-amber-400' },
  { value: 'CLOSED', label: 'Closed', color: 'text-emerald-400' },
];

export default function TaskCard({ task, currentUserId, currentUserRole, onUpdate, onDelete, onEdit }: TaskCardProps) {
  const [localStatus, setLocalStatus] = useState(task.status);
  const [isDeleting, setIsDeleting] = useState(false);

  const canFullEdit = currentUserRole === 'ADMIN';
  const canUpdateStatus = true; // All members/admins in org can update status


  const currentStatusMeta = STATUS_OPTIONS.find((s) => s.value === localStatus)!;

  // Optimistic status update
  async function handleStatusChange(newStatus: Task['status']) {
    if (!canUpdateStatus) return;
    const prevStatus = localStatus;
    setLocalStatus(newStatus); // instant UI update (<100ms)
    onUpdate({ ...task, status: newStatus });

    try {
      const updated = await api.patch<Task>(`/api/tasks/${task.id}`, { status: newStatus });
      onUpdate(updated);
    } catch {
      // Rollback on failure
      setLocalStatus(prevStatus);
      onUpdate({ ...task, status: prevStatus });
    }
  }

  // Checkbox: toggle between OPEN / CLOSED
  async function handleCheckbox() {
    if (!canUpdateStatus) return;
    const newStatus = localStatus === 'CLOSED' ? 'OPEN' : 'CLOSED';
    await handleStatusChange(newStatus);
  }

  async function handleDelete() {
    if (!canFullEdit) return;
    if (!window.confirm('Delete this task?')) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/tasks/${task.id}`);
      onDelete(task.id);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Delete failed';
      alert(msg);
      setIsDeleting(false);
    }
  }

  return (
    <div
      className={`glass-card p-4 group transition-all duration-200 hover:border-slate-600/80 hover:shadow-lg hover:shadow-black/20 ${
        localStatus === 'CLOSED' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleCheckbox}
          disabled={!canUpdateStatus}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
            localStatus === 'CLOSED'
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-slate-600 ' + (canUpdateStatus ? 'hover:border-brand-500' : 'cursor-not-allowed opacity-50')
          }`}
          aria-label={localStatus === 'CLOSED' ? 'Mark as open' : 'Mark as closed'}
        >
          {localStatus === 'CLOSED' && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className={`font-semibold text-sm leading-snug mb-1 ${localStatus === 'CLOSED' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
            {task.title}
          </p>

          {/* Description */}
          {task.description && (
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          {/* Assignee & Project */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {task.assignee && (
              <span className="inline-flex items-center gap-1 text-xs text-brand-400 bg-brand-600/10 px-2 py-0.5 rounded-full">
                <span className="text-brand-500">@</span>{task.assignee.email.split('@')[0]}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              📁 {task.project.name}
            </span>
          </div>

          {/* Status dropdown */}
          <select
            value={localStatus}
            disabled={!canUpdateStatus}
            onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
            className={`text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors ${currentStatusMeta.color} ${!canUpdateStatus ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          {/* Edit button */}
          {canFullEdit && (
            <button
              onClick={() => onEdit(task)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-all duration-200 shrink-0"
              aria-label="Edit task"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}

          {/* Delete button */}
          {canFullEdit && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 shrink-0"
              aria-label="Delete task"
            >
              {isDeleting ? (
                <svg className="animate-spin w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
