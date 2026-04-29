import { prisma } from '@/lib/prisma';
import { ActionType } from '@prisma/client';

export const getComments = async (taskId: string) => {
  return await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, email: true } }
    }
  });
};

export const createComment = async (taskId: string, userId: string, content: string) => {
  return await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        taskId,
        userId,
        content
      }
    });

    const task = await tx.task.findUnique({ where: { id: taskId } });

    await tx.activityLog.create({
      data: {
        taskId,
        userId,
        actionType: ActionType.COMMENTED,
        detail: JSON.stringify({ content })
      }
    });

    if (task?.assigneeId && task.assigneeId !== userId) {
      await tx.notification.create({
        data: {
          userId: task.assigneeId,
          taskId,
          message: `New comment on task: ${task.title}`
        }
      });
    }

    return comment;
  });
};

export const updateComment = async (id: string, userId: string, content: string) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return null;
  if (comment.userId !== userId) throw new Error('Forbidden');

  return await prisma.comment.update({
    where: { id },
    data: { content }
  });
};

export const deleteComment = async (id: string, userId: string, userRole: string) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return null;
  
  if (comment.userId !== userId && userRole !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return await prisma.comment.delete({ where: { id } });
};
