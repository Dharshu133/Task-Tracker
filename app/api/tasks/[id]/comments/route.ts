import { NextRequest, NextResponse } from 'next/server';
import { getComments, createComment } from '@/lib/services/commentService';
import { createCommentSchema } from '@/lib/validators/commentValidator';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const comments = await getComments(id);
    return NextResponse.json({ success: true, data: comments });
  } catch (error: any) {
    console.error('[GET /api/tasks/[id]/comments]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const comment = await createComment(id, userId, parsed.data.content);
    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/tasks/[id]/comments]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
