'use client';

import TaskColumn from './TaskColumn';
import { api } from '@/lib/api';

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

interface KanbanBoardProps {
  tasks: Task[];
  currentUserId: string;
  currentUserRole: string;
  onUpdate: (updated: Task, toastMsg?: string) => void;
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

  const handleDropTask = async (taskId: string, newStatus: Task['status']) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    const task = tasks[taskIndex];
    if (task.status === newStatus) return;

    const prevStatus = task.status;
    const updatedTask = { ...task, status: newStatus };
    onUpdate(updatedTask, 'Status updated successfully');

    try {
      const serverUpdatedTask = await api.patch<Task>(`/api/tasks/${taskId}`, { status: newStatus });
      onUpdate(serverUpdatedTask, 'Status updated successfully');
    } catch {
      onUpdate({ ...task, status: prevStatus });
    }
  };

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
          onDropTask={handleDropTask}
        />
      ))}
    </div>
  );
}
