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
  statusId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate: string | null;
  createdBy: string;
  assignee: User | null;
  creator: User;
  project: { id: string; name: string };
  _count?: { comments: number };
}

interface Status {
  id: string;
  name: string;
  color: string | null;
  category: 'todo' | 'in_progress' | 'done';
  orderIndex: number;
}

interface KanbanBoardProps {
  tasks: Task[];
  statuses: Status[];
  currentUserId: string;
  currentUserRole: string;
  onUpdate: (updated: Task, toastMsg?: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export default function KanbanBoard({
  tasks,
  statuses,
  currentUserId,
  currentUserRole,
  onUpdate,
  onDelete,
  onEdit,
}: KanbanBoardProps) {
  const tasksByStatus = (statusId: string) =>
    tasks.filter((t) => t.statusId === statusId);

  const handleDropTask = async (taskId: string, newStatusId: string) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    const task = tasks[taskIndex];
    if (task.statusId === newStatusId) return;

    const prevStatusId = task.statusId;
    const updatedTask = { ...task, statusId: newStatusId };
    onUpdate(updatedTask, 'Status updated successfully');

    try {
      const serverUpdatedTask = await api.patch<Task>(`/api/tasks/${taskId}`, { statusId: newStatusId });
      onUpdate(serverUpdatedTask, 'Status updated successfully');
    } catch {
      onUpdate({ ...task, statusId: prevStatusId });
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
      {statuses.map((status) => (
        <div key={status.id} className="min-w-[300px] w-full max-w-[400px]">
          <TaskColumn
            status={status}
            tasks={tasksByStatus(status.id)}
            statuses={statuses}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onEdit={onEdit}
            onDropTask={handleDropTask}
          />
        </div>
      ))}
    </div>
  );
}
