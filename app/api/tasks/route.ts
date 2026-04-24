import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

const TASK_INCLUDE = {
  creator: { select: { id: true, email: true, role: true } },
  assignee: { select: { id: true, email: true, role: true } },
  project: { select: { id: true, name: true } },
};

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-user-org-id')!;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') as Status | null;
    const assigneeId = searchParams.get('assignee_id');
    const projectId = searchParams.get('project_id');

    // Validate status filter
    const validStatuses: Status[] = ['OPEN', 'IN_PROGRESS', 'CLOSED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    const role = request.headers.get('x-user-role');
    const assignedProjectId = request.headers.get('x-user-assigned-project-id');

    const tasks = await prisma.task.findMany({
      where: {
        project: { 
          orgId,
          ...(role === 'MEMBER' ? { id: assignedProjectId || '' } : {}),
        },
        ...(status ? { status } : {}),
        ...(assigneeId ? { assigneeId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      include: TASK_INCLUDE,
      orderBy: { id: 'desc' },
    });


    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[GET /api/tasks]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const orgId = request.headers.get('x-user-org-id')!;
    const role = request.headers.get('x-user-role');

    if (role === 'MEMBER') {
      return NextResponse.json({ error: 'Members cannot create tasks' }, { status: 403 });
    }

    const body = await request.json();

    const { title, project_id, description, assignee_id } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    // Validate project belongs to org
    const project = await prisma.project.findFirst({
      where: { id: project_id, orgId },
    });
    if (!project) {
      return NextResponse.json(
        { error: 'Invalid project_id or project not in your organization' },
        { status: 400 }
      );
    }

    // Validate assignee belongs to org and role if creator is a member
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
      const creatorRole = request.headers.get('x-user-role');
      if (creatorRole === 'MEMBER' && assignee.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'Members can only assign tasks to other members, not admins' },
          { status: 403 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        projectId: project_id,
        createdBy: userId,
        assigneeId: assignee_id || null,
        status: 'OPEN',
      },
      include: TASK_INCLUDE,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[POST /api/tasks]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
