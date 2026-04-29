import { NextRequest, NextResponse } from 'next/server';
import { updateComment, deleteComment } from '@/lib/services/commentService';
import { updateCommentSchema } from '@/lib/validators/commentValidator';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const parsed = updateCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const comment = await updateComment(id, userId, parsed.data.content);
    if (!comment) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: comment });
  } catch (error: any) {
    console.error('[PATCH /api/comments/[id]]', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || !userRole) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const deletedComment = await deleteComment(id, userId, userRole);
    
    if (!deletedComment) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { message: 'Comment deleted successfully' } });
  } catch (error: any) {
    console.error('[DELETE /api/comments/[id]]', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
