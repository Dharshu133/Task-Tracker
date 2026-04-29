import { prisma } from '@/lib/prisma';
import { ActionType, Status, Priority } from '@prisma/client';

const TASK_INCLUDE = {
  creator: { select: { id: true, email: true, role: true } },
  assignee: { select: { id: true, email: true, role: true } },
  project: { select: { id: true, name: true } },
};

export const getTasks = async (filters: {
  keyword?: string;
  status?: Status;
  assignee_id?: string;
  project_id?: string;
  priority?: Priority;
  due_date?: string;
  is_overdue?: string;
  org_id?: string;
}) => {
  const where: any = {};

  if (filters.org_id) {
    where.project = { orgId: filters.org_id };
  }

  if (filters.keyword) {
    where.OR = [
      { title: { contains: filters.keyword, mode: 'insensitive' } },
      { description: { contains: filters.keyword, mode: 'insensitive' } }
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.assignee_id) where.assigneeId = filters.assignee_id;
  if (filters.project_id) {
    where.projectId = filters.project_id;
    if (where.project) delete where.project; // Simplify if projectId is present
  }
  if (filters.priority) where.priority = filters.priority;
  if (filters.due_date) {
    const startOfDay = new Date(filters.due_date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(filters.due_date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    where.dueDate = {
      gte: startOfDay,
      lte: endOfDay
    };
  }
  if (filters.is_overdue === 'true') {
    where.dueDate = { lt: new Date() };
    where.isCompleted = false;
  }

  return await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: TASK_INCLUDE
  });
};

export const getTasksDueSoon = async (days: number) => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);

  return await prisma.task.findMany({
    where: {
      dueDate: {
        gte: new Date(),
        lte: targetDate
      },
      isCompleted: false
    },
    orderBy: { dueDate: 'asc' }
  });
};

export const getOverdueTasks = async (filters: { project_id?: string; assignee_id?: string }) => {
  const where: any = {
    dueDate: { lt: new Date() },
    isCompleted: false
  };
  
  if (filters.project_id) where.projectId = filters.project_id;
  if (filters.assignee_id) where.assigneeId = filters.assignee_id;

  return await prisma.task.findMany({
    where,
    orderBy: { dueDate: 'asc' }
  });
};

export const createTask = async (data: any, userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || Status.OPEN,
        priority: data.priority || Priority.LOW,
        dueDate: data.due_date ? new Date(data.due_date) : null,
        assigneeId: data.assignee_id,
        projectId: data.project_id,
        createdBy: userId
      },
      include: TASK_INCLUDE
    });

    await tx.activityLog.create({
      data: {
        taskId: task.id,
        userId,
        actionType: ActionType.CREATED,
        detail: JSON.stringify(task)
      }
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      await tx.notification.create({
        data: {
          userId: task.assigneeId,
          taskId: task.id,
          message: `You have been assigned a new task: ${task.title}`
        }
      });
    }

    return task;
  });
};

export const updateTask = async (id: string, data: any, userId: string) => {
  const oldTask = await prisma.task.findUnique({ where: { id } });
  if (!oldTask) return null;

  return await prisma.$transaction(async (tx) => {
    const updatedData: any = {};
    if (data.title !== undefined) updatedData.title = data.title;
    if (data.description !== undefined) updatedData.description = data.description;
    if (data.status !== undefined) updatedData.status = data.status;
    if (data.priority !== undefined) updatedData.priority = data.priority;
    if (data.due_date !== undefined) updatedData.dueDate = data.due_date ? new Date(data.due_date) : null;
    if (data.assignee_id !== undefined) updatedData.assigneeId = data.assignee_id;
    if (data.project_id !== undefined) updatedData.projectId = data.project_id;

    if (data.status === Status.CLOSED && oldTask.status !== Status.CLOSED) {
      updatedData.isCompleted = true;
    } else if (data.status && data.status !== Status.CLOSED) {
      updatedData.isCompleted = false;
    }

    const task = await tx.task.update({
      where: { id },
      data: updatedData,
      include: TASK_INCLUDE
    });

    // Determine Action Type
    let actionType: ActionType = ActionType.UPDATED;
    if (data.status && data.status !== oldTask.status) actionType = ActionType.STATUS_CHANGED;
    if (data.assignee_id && data.assignee_id !== oldTask.assigneeId) actionType = ActionType.ASSIGNED;

    await tx.activityLog.create({
      data: {
        taskId: task.id,
        userId,
        actionType,
        detail: JSON.stringify({ old: oldTask, new: task })
      }
    });

    // Notifications
    if (data.assignee_id && data.assignee_id !== oldTask.assigneeId && data.assignee_id !== userId) {
      await tx.notification.create({
        data: {
          userId: data.assignee_id,
          taskId: task.id,
          message: `You have been assigned to task: ${task.title}`
        }
      });
    }

    if (data.status && data.status !== oldTask.status && task.assigneeId && task.assigneeId !== userId) {
      await tx.notification.create({
        data: {
          userId: task.assigneeId,
          taskId: task.id,
          message: `Task status changed to ${task.status}: ${task.title}`
        }
      });
    }

    return task;
  });
};

export const updateDueDate = async (id: string, dueDate: string | null, userId: string) => {
  const oldTask = await prisma.task.findUnique({ where: { id } });
  if (!oldTask) return null;

  return await prisma.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id },
      data: { dueDate: dueDate ? new Date(dueDate) : null },
      include: TASK_INCLUDE
    });

    await tx.activityLog.create({
      data: {
        taskId: task.id,
        userId,
        actionType: ActionType.UPDATED,
        detail: JSON.stringify({ old: { dueDate: oldTask.dueDate }, new: { dueDate: task.dueDate } })
      }
    });

    return task;
  });
};
