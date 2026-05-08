import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const projectId = params.id;
    const body = await request.json();
    const { ordered_ids } = body;

    if (!Array.isArray(ordered_ids)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }

    // Update all statuses in a transaction
    await prisma.$transaction(
      ordered_ids.map((id, index) =>
        prisma.projectTaskStatus.update({
          where: { id, projectId }, // Ensure it belongs to the project
          data: { orderIndex: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/projects/[id]/statuses/reorder]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
