'use client';

import { useState } from 'react';
import TaskCard from './TaskCard';

import { Task, User, Status } from '@/lib/types';

interface TaskColumnProps {
  status: Status;
  tasks: Task[];
  statuses: Status[];
  currentUserId: string;
  currentUserRole: string;
  onUpdate: (updated: Task, toastMsg?: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDropTask?: (taskId: string, newStatusId: string) => void;
}

export default function TaskColumn({
  status,
  tasks,
  statuses,
  currentUserId,
  currentUserRole,
  onUpdate,
  onDelete,
  onEdit,
  onDropTask,
}: TaskColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div 
      className={`flex flex-col rounded-[2rem] border border-border bg-card/40 ${isDragOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''} p-6 min-h-[500px] transition-all duration-300`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId && onDropTask) {
          onDropTask(taskId, status.id);
        }
      }}
    >
      {/* Column header */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <div 
          className="w-3 h-3 rounded-full shadow-sm" 
          style={{ backgroundColor: status.color || '#6B7280' }} 
        />
        <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">{status.name}</h3>
        <span className="ml-auto text-[10px] font-black text-muted-foreground bg-accent/50 px-2.5 py-1 rounded-full border border-border/50">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="kanban-column flex-1 flex flex-col gap-4">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-700">
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xs">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              statuses={statuses}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}
