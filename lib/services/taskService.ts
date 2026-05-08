import { prisma } from '@/lib/prisma';
import { ActionType, Priority } from '@prisma/client';

const TASK_INCLUDE = {
  creator: { select: { id: true, email: true, role: true } },
  assignee: { select: { id: true, email: true, role: true } },
  project: { select: { id: true, name: true } },
  status: { select: { id: true, name: true, category: true, color: true } },
  _count: { select: { subtasks: true, comments: true } },
  subtasks: {
    select: {
      id: true,
      isCompleted: true,
      status: { select: { category: true } }
    }
  }
};

const formatTaskWithStats = (task: any) => {
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s: any) => s.status?.category === 'done').length || 0;
  const completionPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  
  return {
    ...task,
    subtaskCount: totalSubtasks,
    completedSubtaskCount: completedSubtasks,
    completionPercentage,
    subtasks: task.subtasks?.some((s: any) => s.title) ? task.subtasks : undefined 
    // Keep subtasks if they have titles (means they were fetched fully), otherwise remove
  };
};

export const getTasks = async (filters: {
  keyword?: string;
  statusId?: string;
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
  if (filters.statusId) where.statusId = filters.statusId;
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

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: TASK_INCLUDE
  });

  return tasks.map(formatTaskWithStats);
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
        statusId: data.statusId || (await tx.projectTaskStatus.findFirst({
          where: { projectId: data.project_id, orderIndex: 0 },
          select: { id: true }
        }))?.id,
        priority: data.priority || Priority.LOW,
        dueDate: data.due_date ? new Date(data.due_date) : null,
        assigneeId: data.assignee_id,
        projectId: data.project_id,
        parentTaskId: data.parent_task_id,
        depth: data.parent_task_id ? (await tx.task.findUnique({ where: { id: data.parent_task_id }, select: { depth: true } }))?.depth! + 1 : 0,
        orderIndex: (await tx.task.count({ where: { parentTaskId: data.parent_task_id || null } })),
        createdBy: userId
      },
      include: TASK_INCLUDE
    });

    // ... activity log and notification ...
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

    return formatTaskWithStats(task);
  });
};

export const updateTask = async (id: string, data: any, userId: string) => {
  const oldTask = await prisma.task.findUnique({ where: { id } });
  if (!oldTask) return null;

  return await prisma.$transaction(async (tx) => {
    const updatedData: any = {};
    if (data.title !== undefined) updatedData.title = data.title;
    if (data.description !== undefined) updatedData.description = data.description;
    if (data.statusId !== undefined) updatedData.statusId = data.statusId;
    if (data.priority !== undefined) updatedData.priority = data.priority;
    if (data.due_date !== undefined) updatedData.dueDate = data.due_date ? new Date(data.due_date) : null;
    if (data.assignee_id !== undefined) updatedData.assigneeId = data.assignee_id;
    if (data.project_id !== undefined) updatedData.projectId = data.project_id;

    if (data.parent_task_id !== undefined && data.parent_task_id !== oldTask.parentTaskId) {
      if (data.parent_task_id) {
        // Circular reference check
        if (data.parent_task_id === id) throw new Error('CIRCULAR_REFERENCE');
        let curr = data.parent_task_id;
        while (curr) {
          const p = await tx.task.findUnique({ where: { id: curr }, select: { parentTaskId: true } });
          if (p?.parentTaskId === id) throw new Error('CIRCULAR_REFERENCE');
          curr = p?.parentTaskId || null;
        }

        const newParent = await tx.task.findUnique({ where: { id: data.parent_task_id }, select: { depth: true, projectId: true } });
        if (!newParent) throw new Error('Parent task not found');
        if (newParent.projectId !== (data.project_id || oldTask.projectId)) throw new Error('Parent task must be in the same project');
        
        updatedData.parentTaskId = data.parent_task_id;
        updatedData.depth = newParent.depth + 1;
      } else {
        updatedData.parentTaskId = null;
        updatedData.depth = 0;
      }
      
      // Update descendants depth if depth changed
      if (updatedData.depth !== oldTask.depth) {
        const depthDiff = updatedData.depth - oldTask.depth;
        await updateDescendantsDepth(tx, id, depthDiff);
      }
    }

    // Check if new status category is 'done'
    if (data.statusId && data.statusId !== oldTask.statusId) {
      const newStatus = await tx.projectTaskStatus.findUnique({
        where: { id: data.statusId },
        select: { category: true }
      });
      if (newStatus?.category === 'done') {
        updatedData.isCompleted = true;
      } else {
        updatedData.isCompleted = false;
      }
    }

    const task = await tx.task.update({
      where: { id },
      data: updatedData,
      include: TASK_INCLUDE
    });

    // Determine Action Type
    let actionType: ActionType = ActionType.UPDATED;
    if (data.statusId && data.statusId !== oldTask.statusId) actionType = ActionType.STATUS_CHANGED;
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

    if (data.statusId && data.statusId !== oldTask.statusId && task.assigneeId && task.assigneeId !== userId) {
      await tx.notification.create({
        data: {
          userId: task.assigneeId,
          taskId: task.id,
          message: `Task status changed: ${task.title}`
        }
      });
    }

    return formatTaskWithStats(task);
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

export const deleteTask = async (id: string, userId: string) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return null;

  return await prisma.$transaction(async (tx) => {
    await tx.activityLog.create({
      data: {
        taskId: id,
        userId,
        actionType: ActionType.DELETED,
        detail: `Deleted task: ${task.title}`
      }
    });

    return await tx.task.delete({ where: { id } });
  });
};

async function updateDescendantsDepth(tx: any, parentId: string, diff: number) {
  const children = await tx.task.findMany({ where: { parentTaskId: parentId }, select: { id: true } });
  for (const child of children) {
    await tx.task.update({
      where: { id: child.id },
      data: { depth: { increment: diff } }
    });
    await updateDescendantsDepth(tx, child.id, diff);
  }
}

export const getSubtasks = async (taskId: string, recursive: boolean = false) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      subtasks: {
        orderBy: { orderIndex: 'asc' },
        include: {
          status: { select: { id: true, name: true, category: true, color: true } },
          assignee: { select: { id: true, email: true } },
          _count: { select: { subtasks: true } }
        }
      }
    }
  });

  if (!task) return null;

  if (!recursive) return task.subtasks;

  // For recursive, we need to build the tree. 
  // This is a simple implementation that might be slow for very deep trees.
  // But for typical task hierarchies, it should be fine.
  const buildTree = async (tasks: any[]): Promise<any[]> => {
    const tree = [];
    for (const t of tasks) {
      const children = await prisma.task.findMany({
        where: { parentTaskId: t.id },
        orderBy: { orderIndex: 'asc' },
        include: {
          status: { select: { id: true, name: true, category: true, color: true } },
          assignee: { select: { id: true, email: true } },
          _count: { select: { subtasks: true } }
        }
      });
      tree.push({
        ...t,
        subtasks: children.length > 0 ? await buildTree(children) : []
      });
    }
    return tree;
  };

  return await buildTree(task.subtasks);
};

export const reorderSubtasks = async (parentTaskId: string, orderedIds: string[], userId: string) => {
  return await prisma.$transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.task.update({
        where: { id: orderedIds[i], parentTaskId },
        data: { orderIndex: i }
      });
    }
    
    await tx.activityLog.create({
      data: {
        taskId: parentTaskId,
        userId,
        actionType: ActionType.UPDATED,
        detail: `Reordered subtasks: ${orderedIds.join(', ')}`
      }
    });

    return true;
  });
};

export const getTaskWithStats = async (id: string) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      ...TASK_INCLUDE,
      status: { select: { id: true, name: true, category: true, color: true } },
    }
  });

  if (!task) return null;

  return formatTaskWithStats(task);
};
