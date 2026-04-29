import { NextRequest, NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/services/activityLogService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      task_id: searchParams.get('task_id') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      project_id: searchParams.get('project_id') || undefined,
    };

    const logs = await getActivityLogs({
      taskId: filters.task_id,
      userId: filters.user_id,
      projectId: filters.project_id
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('[GET /api/activity-logs]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
