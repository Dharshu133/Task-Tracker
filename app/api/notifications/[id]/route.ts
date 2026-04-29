import { NextRequest, NextResponse } from 'next/server';
import { markNotificationAsRead } from '@/lib/services/notificationService';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await markNotificationAsRead(id, userId);

    return NextResponse.json({ success: true, data: { message: 'Notification marked as read' } });
  } catch (error: any) {
    console.error('[PATCH /api/notifications/[id]]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
