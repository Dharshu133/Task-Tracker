export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  statusId: string;
  priority: Priority;
  dueDate: string | null;
  createdBy: string;
  assignee: User | null;
  creator: User;
  project: { id: string; name: string };
  _count?: { comments: number; subtasks: number };
  subtaskCount?: number;
  completedSubtaskCount?: number;
  completionPercentage?: number;
}

export interface Status {
  id: string;
  name: string;
  color: string | null;
  category: 'todo' | 'in_progress' | 'done';
  orderIndex: number;
}

export interface Project {
  id: string;
  name: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  totalTasks: number;
  openTasks: number;
  inProgressTasks: number;
  closedTasks: number;
}

export interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
