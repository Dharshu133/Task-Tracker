import { NextRequest, NextResponse } from 'next/server';
import { getOverdueTasks } from '@/lib/services/taskService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      project_id: searchParams.get('project_id') || undefined,
      assignee_id: searchParams.get('assignee_id') || undefined,
    };

    const tasks = await getOverdueTasks(filters);

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('[GET /api/tasks/overdue]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
