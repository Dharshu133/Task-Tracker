import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StatusCategory } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const statuses = await prisma.projectTaskStatus.findMany({
      where: { projectId },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error('[GET /api/projects/[id]/statuses]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const projectId = params.id;
    const body = await request.json();
    const { name, color, category } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }

    // Get max order index
    const lastStatus = await prisma.projectTaskStatus.findFirst({
      where: { projectId },
      orderBy: { orderIndex: 'desc' },
    });

    const orderIndex = (lastStatus?.orderIndex ?? -1) + 1;

    const status = await prisma.projectTaskStatus.create({
      data: {
        name,
        color,
        category: category as StatusCategory,
        orderIndex,
        projectId,
        createdBy: userId!,
      },
    });

    return NextResponse.json(status, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/projects/[id]/statuses]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Status name already exists in this project' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
