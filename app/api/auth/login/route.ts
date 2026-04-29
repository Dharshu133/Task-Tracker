import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { createActivityLog } from '@/lib/services/activityLogService';
import { ActionType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { org: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      assignedProjectId: user.assignedProjectId,
    });

    // Log login asynchronously
    createActivityLog({
      userId: user.id,
      actionType: ActionType.LOGIN,
      detail: `User ${user.email} logged in`
    }).catch(console.error);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        orgName: user.org.name,
        assignedProjectId: user.assignedProjectId,
      },
    });

  } catch (error) {
    console.error('[LOGIN]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
