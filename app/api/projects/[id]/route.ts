import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    const orgId = request.headers.get('x-user-org-id')!;
    const { id } = params;

    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const project = await prisma.project.findFirst({
      where: { id, orgId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/projects/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    const orgId = request.headers.get('x-user-org-id')!;
    const { id } = params;

    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const project = await prisma.project.findFirst({
      where: { id, orgId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Note: This will delete all tasks associated with the project due to cascade or manual check
    // In Prisma, if not specified, it might fail if there are tasks. 
    // Let's check schema. Tasks don't have onDelete: Cascade explicitly but default is Restrict usually.
    // Actually, let's delete tasks first or ensure they are deleted.
    
    await prisma.$transaction([
      prisma.task.deleteMany({ where: { projectId: id } }),
      prisma.project.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/projects/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
