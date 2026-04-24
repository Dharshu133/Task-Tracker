'use client';

import TaskCard from './TaskCard';

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

const COLUMN_META = {
  OPEN: {
    label: 'Open',
    icon: '○',
    color: 'text-sky-400',
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/5',
    dot: 'bg-sky-400',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: '◑',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    dot: 'bg-amber-400',
  },
  CLOSED: {
    label: 'Closed',
    icon: '●',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    dot: 'bg-emerald-400',
  },
};

interface TaskColumnProps {
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  tasks: Task[];
  currentUserId: string;
  currentUserRole: string;
  onUpdate: (updated: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export default function TaskColumn({
  status,
  tasks,
  currentUserId,
  currentUserRole,
  onUpdate,
  onDelete,
  onEdit,
}: TaskColumnProps) {
  const meta = COLUMN_META[status];

  return (
    <div className={`flex flex-col rounded-xl border ${meta.border} ${meta.bg} p-4 min-h-[300px]`}>
      {/* Column header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
        <h3 className={`font-semibold text-sm ${meta.color}`}>{meta.label}</h3>
        <span className="ml-auto text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="kanban-column flex-1">
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
