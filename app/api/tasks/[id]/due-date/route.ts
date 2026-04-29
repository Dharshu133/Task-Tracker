import { NextRequest, NextResponse } from 'next/server';
import { updateDueDate } from '@/lib/services/taskService';
import { dueDateUpdateSchema } from '@/lib/validators/taskValidator';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = dueDateUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const task = await updateDueDate(id, parsed.data.due_date, userId);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error('[PATCH /api/tasks/[id]/due-date]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
