import { NextRequest, NextResponse } from 'next/server';
import { getTasksDueSoon } from '@/lib/services/taskService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const tasks = await getTasksDueSoon(days);

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('[GET /api/tasks/due-soon]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
