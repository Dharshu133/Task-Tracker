import { NextRequest, NextResponse } from 'next/server';
import { createActivityLog } from '@/lib/services/activityLogService';
import { ActionType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    if (userId) {
      await createActivityLog({
        userId,
        actionType: ActionType.LOGOUT,
        detail: `User ${userEmail || userId} logged out`
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LOGOUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
