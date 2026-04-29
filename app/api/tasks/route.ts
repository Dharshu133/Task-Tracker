import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask } from '@/lib/services/taskService';
import { createTaskSchema } from '@/lib/validators/taskValidator';
import { Status, Priority } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-user-org-id');
    const role = request.headers.get('x-user-role');
    const assignedProjectId = request.headers.get('x-user-assigned-project-id');

    const { searchParams } = new URL(request.url);

    // If member, restrict project_id to assigned project
    let project_id = searchParams.get('project_id') || undefined;
    if (role === 'MEMBER' && assignedProjectId) {
      project_id = assignedProjectId;
    }

    const filters = {
      keyword: searchParams.get('keyword') || undefined,
      status: (searchParams.get('status') as Status) || undefined,
      assignee_id: searchParams.get('assignee_id') || undefined,
      project_id,
      priority: (searchParams.get('priority') as Priority) || undefined,
      due_date: searchParams.get('due_date') || undefined,
      is_overdue: searchParams.get('is_overdue') || undefined,
      org_id: orgId || undefined,
    };

    const tasks = await getTasks(filters);

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('[GET /api/tasks]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const role = request.headers.get('x-user-role');

    if (role === 'MEMBER') {
      return NextResponse.json({ success: false, error: 'Members cannot create tasks' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const task = await createTask(parsed.data, userId);

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/tasks]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
