'use client';

import TaskColumn from './TaskColumn';

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

interface KanbanBoardProps {
  tasks: Task[];
  currentUserId: string;
  currentUserRole: string;
  onUpdate: (updated: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const STATUSES: Task['status'][] = ['OPEN', 'IN_PROGRESS', 'CLOSED'];

export default function KanbanBoard({
  tasks,
  currentUserId,
  currentUserRole,
  onUpdate,
  onDelete,
  onEdit,
}: KanbanBoardProps) {
  const tasksByStatus = (status: Task['status']) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {STATUSES.map((status) => (
        <TaskColumn
          key={status}
          status={status}
          tasks={tasksByStatus(status)}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
