import { z } from 'zod';
import { Status, Priority } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
  priority: z.nativeEnum(Priority).optional(),
  due_date: z.string().datetime().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(Status).optional(),
  priority: z.nativeEnum(Priority).optional(),
  due_date: z.string().datetime().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional()
});

export const dueDateUpdateSchema = z.object({
  due_date: z.string().datetime().nullable()
});
