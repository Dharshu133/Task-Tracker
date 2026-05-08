import { NextRequest, NextResponse } from 'next/server';
import { POST as createStatus } from '../app/api/projects/[id]/statuses/route';
import { PATCH as reorderStatuses } from '../app/api/projects/[id]/statuses/reorder/route';
import { DELETE as deleteStatus } from '../app/api/projects/[id]/statuses/[statusId]/route';
import { prisma } from '../lib/prisma';

// Mock prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    projectTaskStatus: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe('Project Status Management API', () => {
  const projectId = 'proj-123';
  const adminId = 'admin-456';
  const memberId = 'member-789';

  describe('Auth Guard (403)', () => {
    it('should return 403 if user is not an admin on create', async () => {
      const req = new NextRequest(`http://localhost/api/projects/${projectId}/statuses`, {
        method: 'POST',
        headers: { 'x-user-role': 'MEMBER', 'x-user-id': memberId },
        body: JSON.stringify({ name: 'Testing', category: 'todo' }),
      });

      const res = await createStatus(req, { params: { id: projectId } });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('FORBIDDEN');
    });

    it('should return 403 if user is not an admin on reorder', async () => {
      const req = new NextRequest(`http://localhost/api/projects/${projectId}/statuses/reorder`, {
        method: 'PATCH',
        headers: { 'x-user-role': 'MEMBER', 'x-user-id': memberId },
        body: JSON.stringify({ ordered_ids: ['1', '2'] }),
      });

      const res = await reorderStatuses(req, { params: { id: projectId } });
      expect(res.status).toBe(403);
    });
  });

  describe('Delete Conflict (409)', () => {
    it('should return 409 if status has tasks assigned', async () => {
      (prisma.projectTaskStatus.findUnique as jest.Mock).mockResolvedValue({
        id: 'status-1',
        projectId,
        _count: { tasks: 5 },
      });

      const req = new NextRequest(`http://localhost/api/projects/${projectId}/statuses/status-1`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'ADMIN', 'x-user-id': adminId },
      });

      const res = await deleteStatus(req, { params: { id: projectId, statusId: 'status-1' } });
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe('STATUS_IN_USE');
    });
  });

  describe('Reorder Logic', () => {
    it('should update orderIndex for all provided IDs in a transaction', async () => {
      const orderedIds = ['id-3', 'id-1', 'id-2'];
      const req = new NextRequest(`http://localhost/api/projects/${projectId}/statuses/reorder`, {
        method: 'PATCH',
        headers: { 'x-user-role': 'ADMIN', 'x-user-id': adminId },
        body: JSON.stringify({ ordered_ids: orderedIds }),
      });

      const res = await reorderStatuses(req, { params: { id: projectId } });
      expect(res.status).toBe(200);
      
      // Check if prisma.update was called for each ID with correct index
      expect(prisma.projectTaskStatus.update).toHaveBeenCalledTimes(3);
      expect(prisma.projectTaskStatus.update).toHaveBeenCalledWith({
        where: { id: 'id-3', projectId },
        data: { orderIndex: 0 },
      });
      expect(prisma.projectTaskStatus.update).toHaveBeenCalledWith({
        where: { id: 'id-1', projectId },
        data: { orderIndex: 1 },
      });
    });
  });
});
