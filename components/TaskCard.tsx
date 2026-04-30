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
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate: string | null;
  createdBy: string;
  assignee: User | null;
  creator: User;
  project: { id: string; name: string };
  _count?: { comments: number };
}

interface TaskCardProps {
  task: Task;
  currentUserId: string;
  currentUserRole: string;
  onUpdate: (updated: Task, toastMsg?: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const STATUS_OPTIONS: { value: Task['status']; label: string; color: string }[] = [
  { value: 'OPEN', label: 'Open', color: 'text-sky-400' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'text-amber-400' },
  { value: 'CLOSED', label: 'Closed', color: 'text-emerald-400' },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-primary/10 text-primary',
  HIGH: 'bg-amber-500/10 text-amber-500',
  CRITICAL: 'bg-destructive/10 text-destructive',
};

function isOverdue(dateString: string, status: Task['status']) {
  if (status === 'CLOSED') return false;
  const dueDate = new Date(dateString);
  dueDate.setHours(23, 59, 59, 999);
  return dueDate.getTime() < Date.now();
}

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
    onUpdate({ ...task, status: newStatus }, 'Status updated successfully');

    try {
      const updated = await api.patch<Task>(`/api/tasks/${task.id}`, { status: newStatus });
      onUpdate(updated, 'Status updated successfully');
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
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
      }}
      onClick={() => onEdit(task)}
      className={`relative glass-card p-4 group transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-black/20 cursor-pointer active:cursor-grabbing ${
        localStatus === 'CLOSED' ? 'opacity-60' : ''
      }`}
    >
      {/* Comment Box - Top Right (Members only) */}
      {currentUserRole === 'MEMBER' && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary rounded border border-primary/20 transition-all cursor-pointer z-10"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-[10px] font-bold">
            {task._count?.comments || 0}
          </span>
        </div>
      )}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCheckbox();
          }}
          disabled={!canUpdateStatus}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
            localStatus === 'CLOSED'
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-input ' + (canUpdateStatus ? 'hover:border-primary' : 'cursor-not-allowed opacity-50')
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
          <p className={`font-semibold text-sm leading-snug mb-1 ${localStatus === 'CLOSED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </p>

          {/* Description */}
          {task.description && (
            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          {/* Assignee & Project */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {task.assignee && (
              <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <span className="text-primary">@</span>{task.assignee.email.split('@')[0]}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              📁 {task.project.name}
            </span>
          </div>


          {/* Priority & Due Date */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || 'bg-muted'}`}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isOverdue(task.dueDate, localStatus) ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-muted text-muted-foreground'}`}>
                ⏳ {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto">
            <select
              value={localStatus}
              disabled={!canUpdateStatus}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
              className={`text-[10px] font-bold bg-card border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring transition-colors ${currentStatusMeta.color} ${!canUpdateStatus ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          {/* Edit button */}
          {canFullEdit && (
            <button
              onClick={(e) => {
                 e.stopPropagation();
                onEdit(task);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 shrink-0"
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
              onClick={(e) => {
                 e.stopPropagation();
                handleDelete();
              }}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 shrink-0"
              aria-label="Delete task"
            >
              {isDeleting ? (
                <svg className="animate-spin w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24">
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
