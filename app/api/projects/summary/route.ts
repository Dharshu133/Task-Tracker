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
          select: { 
            status: {
              select: { category: true }
            }
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const summary = projects.map((p) => {
      const counts = p.tasks.reduce(
        (acc, task) => {
          const category = task.status?.category || 'todo';
          acc[category]++;
          return acc;
        },
        { todo: 0, in_progress: 0, done: 0 }
      );

      return {
        id: p.id,
        name: p.name,
        totalTasks: p._count.tasks,
        openTasks: counts.todo,
        inProgressTasks: counts.in_progress,
        closedTasks: counts.done,
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[GET /api/projects/summary]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
