import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSubtasks, createTask } from '@/lib/services/taskService';
import { createTaskSchema } from '@/lib/validators/taskValidator';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const recursive = searchParams.get('recursive') === 'true';
    const role = request.headers.get('x-user-role');
    const assignedProjectId = request.headers.get('x-user-assigned-project-id');

    const subtasks = await getSubtasks(id, recursive);

    if (subtasks === null) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Access Control
    if (role === 'MEMBER' && assignedProjectId) {
      // Since subtasks always belong to the same project as the parent, 
      // we should verify the parent task belongs to the user's project.
      // The getSubtasks call already fetched the task, but let's check the first subtask or parent.
      // A better way is to fetch the parent task first.
      const parentTask = await prisma.task.findUnique({ where: { id }, select: { projectId: true } });
      if (parentTask?.projectId !== assignedProjectId) {
        return NextResponse.json({ success: false, error: 'Forbidden: You do not have access to this project' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: subtasks });
  } catch (error: any) {
    console.error('[GET /api/tasks/[id]/subtasks]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    const role = request.headers.get('x-user-role');
    const assignedProjectId = request.headers.get('x-user-assigned-project-id');
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Access Control
    const parentTask = await prisma.task.findUnique({ where: { id }, select: { projectId: true } });
    if (!parentTask) {
      return NextResponse.json({ success: false, error: 'Parent task not found' }, { status: 404 });
    }
    if (role === 'MEMBER' && assignedProjectId && parentTask.projectId !== assignedProjectId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not have access to this project' }, { status: 403 });
    }

    const body = await request.json();
    // Ensure parent_task_id is set to the current task
    body.parent_task_id = id;
    
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const task = await createTask(parsed.data, userId);

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/tasks/[id]/subtasks]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
