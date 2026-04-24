import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

const TASK_INCLUDE = {
  creator: { select: { id: true, email: true, role: true } },
  assignee: { select: { id: true, email: true, role: true } },
  project: { select: { id: true, name: true } },
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;
    const orgId = request.headers.get('x-user-org-id')!;
    const { id } = params;
    const assignedProjectId = request.headers.get('x-user-assigned-project-id');

    // Ensure task belongs to org and (if member) to assigned project
    const existing = await prisma.task.findFirst({
      where: { 
        id, 
        project: { 
          orgId,
          ...(role === 'MEMBER' ? { id: assignedProjectId || '' } : {}),
        } 
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, status, description, assignee_id } = body;

    // RBAC: Check if user is trying to update fields other than 'status'
    const isUpdatingRestrictedFields = title !== undefined || description !== undefined || assignee_id !== undefined;

    if (isUpdatingRestrictedFields) {
      // Only Admin can edit title, description, or assignee
      if (role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Only admins can edit task details' },
          { status: 403 }
        );
      }
    }

    const validStatuses: Status[] = ['OPEN', 'IN_PROGRESS', 'CLOSED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Validate new assignee belongs to org and check role restrictions
    if (assignee_id) {
      const assignee = await prisma.user.findFirst({
        where: { id: assignee_id, orgId },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: 'Invalid assignee_id or user not in your organization' },
          { status: 400 }
        );
      }

      // Requirement: Members cannot assign tasks to Admins
      if (role === 'MEMBER' && assignee.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'Members can only assign tasks to other members, not admins' },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(status ? { status } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(assignee_id !== undefined ? { assigneeId: assignee_id || null } : {}),
      },
      include: TASK_INCLUDE,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/tasks/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;
    const orgId = request.headers.get('x-user-org-id')!;
    const { id } = params;
    const assignedProjectId = request.headers.get('x-user-assigned-project-id');

    const task = await prisma.task.findFirst({
      where: { 
        id, 
        project: { 
          orgId,
          ...(role === 'MEMBER' ? { id: assignedProjectId || '' } : {}),
        } 
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // RBAC: Only Admin can delete
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can delete tasks' },
        { status: 403 }
      );
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/tasks/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
