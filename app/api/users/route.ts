import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createActivityLog } from '@/lib/services/activityLogService';
import { ActionType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const assignedProjectId = request.headers.get('x-user-assigned-project-id');
    const orgId = request.headers.get('x-user-org-id')!;

    const users = await prisma.user.findMany({
      where: { 
        orgId,
        ...(role === 'MEMBER' ? { assignedProjectId } : {}),
      },
      select: { id: true, email: true, role: true, assignedProjectId: true },
      orderBy: { email: 'asc' },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('[GET /api/users]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminRole = request.headers.get('x-user-role');
    const orgId = request.headers.get('x-user-org-id')!;

    if (adminRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
    }

    const { email, password, role, assignedProjectId } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashedPassword,
        role,
        orgId,
        assignedProjectId: assignedProjectId || null,
      },
      select: { id: true, email: true, role: true, assignedProjectId: true },
    });

    const adminId = request.headers.get('x-user-id');
    if (adminId) {
      await createActivityLog({
        userId: adminId,
        actionType: ActionType.CREATED,
        detail: `Created user: ${user.email} (${user.role})`
      });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('[POST /api/users]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
