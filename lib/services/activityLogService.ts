import { prisma } from '@/lib/prisma';
import { ActionType } from '@prisma/client';

export const getActivityLogs = async ({ taskId, userId, projectId }: { taskId?: string; userId?: string; projectId?: string }) => {
  const where: any = {};
  if (taskId) where.taskId = taskId;
  if (userId) where.userId = userId;
  if (projectId) where.task = { projectId };

  return await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true } },
      task: { select: { id: true, title: true } }
    }
  });
};

export const createActivityLog = async (data: {
  userId: string;
  taskId?: string;
  actionType: ActionType;
  detail?: string;
}) => {
  return await prisma.activityLog.create({
    data
  });
};
