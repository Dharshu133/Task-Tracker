import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createActivityLog } from '@/lib/services/activityLogService';
import { ActionType } from '@prisma/client';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminRole = request.headers.get('x-user-role');
    if (adminRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can update users' }, { status: 403 });
    }

    const { email, password, role, assignedProjectId } = await request.json();
    const { id } = params;

    const data: any = {};
    if (email) data.email = email.trim();
    if (password) data.password = await hashPassword(password);
    if (role) data.role = role;
    if (assignedProjectId !== undefined) data.assignedProjectId = assignedProjectId || null;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, assignedProjectId: true },
    });

    const adminId = request.headers.get('x-user-id');
    if (adminId) {
      await createActivityLog({
        userId: adminId,
        actionType: ActionType.UPDATED,
        detail: `Updated user: ${user.email}`
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[PATCH /api/users/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminRole = request.headers.get('x-user-role');
    if (adminRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 });
    }

    const { id } = params;

    // Optional: prevent self-deletion
    const adminId = request.headers.get('x-user-id');
    if (id === adminId) {
      return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 });
    }

    const deletedUser = await prisma.user.delete({ where: { id } });

    if (adminId) {
      await createActivityLog({
        userId: adminId,
        actionType: ActionType.DELETED,
        detail: `Deleted user: ${deletedUser.email}`
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/users/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
