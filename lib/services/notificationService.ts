import { prisma } from '@/lib/prisma';

export const getNotifications = async (userId: string) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      task: { select: { id: true, title: true } }
    }
  });
};

export const markNotificationAsRead = async (id: string, userId: string) => {
  return await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true }
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
};
