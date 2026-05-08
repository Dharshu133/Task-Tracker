import { z } from 'zod';
import { Priority } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  statusId: z.string().min(1).optional(),
  priority: z.nativeEnum(Priority).optional(),
  due_date: z.string().datetime().optional().nullable(),
  assignee_id: z.string().min(1).optional().nullable(),
  project_id: z.string().min(1),
  parent_task_id: z.string().uuid().optional().nullable()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  statusId: z.string().min(1).optional(),
  priority: z.nativeEnum(Priority).optional(),
  due_date: z.string().datetime().optional().nullable(),
  assignee_id: z.string().min(1).optional().nullable(),
  project_id: z.string().min(1).optional(),
  parent_task_id: z.string().uuid().optional().nullable()
});

export const dueDateUpdateSchema = z.object({
  due_date: z.string().datetime().nullable()
});
