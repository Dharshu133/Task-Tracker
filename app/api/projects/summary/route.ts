import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const assignedProjectId = request.headers.get('x-user-assigned-project-id');
    const orgId = request.headers.get('x-user-org-id')!;

    const projects = await prisma.project.findMany({
      where: { 
        orgId,
        ...(role === 'MEMBER' ? { id: assignedProjectId || '' } : {}),
      },
      include: {

        _count: {
          select: { tasks: true },
        },
        tasks: {
          select: { status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const summary = projects.map((p) => {
      const counts = p.tasks.reduce(
        (acc, task) => {
          acc[task.status]++;
          return acc;
        },
        { OPEN: 0, IN_PROGRESS: 0, CLOSED: 0 }
      );

      return {
        id: p.id,
        name: p.name,
        totalTasks: p._count.tasks,
        openTasks: counts.OPEN,
        inProgressTasks: counts.IN_PROGRESS,
        closedTasks: counts.CLOSED,
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[GET /api/projects/summary]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
