import { NextRequest, NextResponse } from 'next/server';
import { getNotifications } from '@/lib/services/notificationService';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await getNotifications(userId);
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
