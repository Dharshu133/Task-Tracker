import { NextRequest, NextResponse } from 'next/server';
import { reorderSubtasks } from '@/lib/services/taskService';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ordered_ids } = body;

    if (!ordered_ids || !Array.isArray(ordered_ids)) {
      return NextResponse.json({ success: false, error: 'ordered_ids is required and must be an array' }, { status: 400 });
    }

    await reorderSubtasks(id, ordered_ids, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PATCH /api/tasks/[id]/subtasks/reorder]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
