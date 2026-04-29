import { NextRequest, NextResponse } from 'next/server';
import { markAllNotificationsAsRead } from '@/lib/services/notificationService';

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await markAllNotificationsAsRead(userId);
    return NextResponse.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (error: any) {
    console.error('[PATCH /api/notifications/read-all]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
