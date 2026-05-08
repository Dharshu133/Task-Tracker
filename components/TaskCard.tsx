'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

import { Task, User, Status } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  statuses: Status[];
  currentUserId: string;
  currentUserRole: string;
  onUpdate: (updated: Task, toastMsg?: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}



const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-500/10 text-slate-500 border border-slate-500/20',
  MEDIUM: 'bg-primary/10 text-primary border border-primary/20',
  HIGH: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  CRITICAL: 'bg-destructive/10 text-destructive border border-destructive/20',
};

function isOverdue(dateString: string, category: string) {
  if (category === 'done') return false;
  const dueDate = new Date(dateString);
  dueDate.setHours(23, 59, 59, 999);
  return dueDate.getTime() < Date.now();
}

export default function TaskCard({ task, statuses, currentUserId, currentUserRole, onUpdate, onDelete, onEdit }: TaskCardProps) {
  const [localStatusId, setLocalStatusId] = useState(task.statusId);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLocalStatusId(task.statusId);
  }, [task.statusId]);

  const canFullEdit = currentUserRole === 'ADMIN';
  const canUpdateStatus = true; 

  const currentStatus = statuses.find((s) => s.id === localStatusId);

  // Optimistic status update
  async function handleStatusChange(newStatusId: string) {
    if (!canUpdateStatus) return;
    const prevStatusId = localStatusId;
    setLocalStatusId(newStatusId);
    onUpdate({ ...task, statusId: newStatusId }, 'Status updated successfully');

    try {
      const updated = await api.patch<Task>(`/api/tasks/${task.id}`, { statusId: newStatusId });
      onUpdate(updated, 'Status updated successfully');
    } catch {
      setLocalStatusId(prevStatusId);
      onUpdate({ ...task, statusId: prevStatusId });
    }
  }

  // Checkbox: toggle between current and 'done' status
  async function handleCheckbox() {
    if (!canUpdateStatus) return;
    const isDone = currentStatus?.category === 'done';
    
    if (isDone) {
      // Find 'todo' or first status
      const todoStatus = statuses.find(s => s.category === 'todo') || statuses[0];
      if (todoStatus) await handleStatusChange(todoStatus.id);
    } else {
      // Find 'done' status
      const doneStatus = statuses.find(s => s.category === 'done');
      if (doneStatus) await handleStatusChange(doneStatus.id);
    }
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
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onEdit(task)}
      className={`relative glass-card !rounded-3xl p-5 group transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer active:cursor-grabbing ${
        currentStatus?.category === 'done' ? 'opacity-60 bg-muted/20' : ''
      }`}
    >
      {/* Comment Box - Top Right */}
      {(task._count?.comments || 0) > 0 && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-background/80 backdrop-blur-md text-primary rounded-xl border border-border shadow-sm transition-all hover:scale-110 cursor-pointer z-10"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-[10px] font-black">
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
          className={`mt-1 w-6 h-6 rounded-[0.5rem] border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
            currentStatus?.category === 'done'
              ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20'
              : 'border-border bg-background/50 ' + (canUpdateStatus ? 'hover:border-primary hover:shadow-lg hover:shadow-primary/10' : 'cursor-not-allowed opacity-50')
          }`}
          aria-label={currentStatus?.category === 'done' ? 'Mark as open' : 'Mark as closed'}
        >
          {currentStatus?.category === 'done' && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className={`font-semibold text-sm leading-snug mb-1 ${currentStatus?.category === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </p>

          {/* Description */}
          {task.description && (
            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          {/* Assignee & Project */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {task.assignee && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                <span className="w-1 h-1 rounded-full bg-primary" />
                {task.assignee.email.split('@')[0]}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-accent/40 px-2.5 py-1 rounded-lg border border-border/50">
              📁 {task.project.name}
            </span>
            {(task.subtaskCount ?? task._count?.subtasks ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {task.completedSubtaskCount ?? 0}/{(task.subtaskCount ?? task._count?.subtasks ?? 0)}
              </span>
            )}
          </div>

          {/* Subtask Progress Bar */}
          {(task.subtaskCount ?? task._count?.subtasks ?? 0) > 0 && (
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${task.completionPercentage ?? 0}%` }}
              />
            </div>
          )}


          {/* Priority & Due Date */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || 'bg-muted'}`}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isOverdue(task.dueDate, currentStatus?.category || '') ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-muted text-muted-foreground'}`}>
                ⏳ {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto">
            <select
              value={task.statusId}
              disabled={!canUpdateStatus}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`text-[10px] font-black uppercase tracking-widest bg-accent/30 border border-border/50 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${!canUpdateStatus ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent/50'}`}
              style={{ color: currentStatus?.color || 'inherit' }}
            >
              {statuses.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-foreground bg-background">
                  {opt.name}
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
