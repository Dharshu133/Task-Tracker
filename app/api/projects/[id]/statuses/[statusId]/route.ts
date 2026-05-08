import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StatusCategory } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; statusId: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { statusId, id: projectId } = params;
    const body = await request.json();
    const { name, color, category } = body;

    // Check if status exists and belongs to project
    const existingStatus = await prisma.projectTaskStatus.findUnique({
      where: { id: statusId },
    });

    if (!existingStatus) {
      return NextResponse.json({ error: 'STATUS_NOT_FOUND' }, { status: 404 });
    }

    const updatedStatus = await prisma.projectTaskStatus.update({
      where: { id: statusId },
      data: {
        ...(name && { name }),
        ...(color !== undefined && { color }),
        ...(category && { category: category as StatusCategory }),
      },
    });

    return NextResponse.json(updatedStatus);
  } catch (error) {
    console.error('[PATCH /api/projects/[id]/statuses/[statusId]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; statusId: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { statusId, id: projectId } = params;

    // Check if status exists and belongs to project
    const existingStatus = await prisma.projectTaskStatus.findUnique({
      where: { id: statusId },
      include: { _count: { select: { tasks: true } } },
    });

    if (!existingStatus) {
      return NextResponse.json({ error: 'STATUS_NOT_FOUND' }, { status: 404 });
    }

    // Check if tasks are assigned
    if (existingStatus._count.tasks > 0) {
      return NextResponse.json({ error: 'STATUS_IN_USE' }, { status: 409 });
    }

    await prisma.projectTaskStatus.delete({
      where: { id: statusId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/projects/[id]/statuses/[statusId]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
