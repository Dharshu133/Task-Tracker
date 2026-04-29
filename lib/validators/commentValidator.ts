import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  parentId: z.string().uuid().optional().nullable()
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required')
});
