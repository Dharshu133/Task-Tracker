'use client';

import { useState, useEffect, FormEvent } from 'react';
import { api } from '@/lib/api';

interface OrgUser {
  id: string;
  email: string;
  role: string;
  assignedProjectId?: string | null;
}

interface EditUserModalProps {
  user: OrgUser;
  onClose: () => void;
  onUpdated: (user: OrgUser) => void;
}

export default function EditUserModal({ user, onClose, onUpdated }: EditUserModalProps) {
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>(user.role as 'ADMIN' | 'MEMBER');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(user.assignedProjectId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ id: string; name: string }[]>('/api/projects')
      .then(setProjects)
      .catch(err => console.error('Failed to load projects', err));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required'); return; }
    if (role === 'MEMBER' && !selectedProjectId) {
      setError('Please assign a project to the member');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await api.patch<OrgUser>(`/api/users/${user.id}`, {
        email: email.trim(),
        ...(password ? { password } : {}),
        role,
        assignedProjectId: role === 'ADMIN' ? null : (selectedProjectId || null),
      });
      onUpdated(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass-card p-6 shadow-2xl border-brand-500/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit User</h2>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="label">New Password (leave blank to keep current)</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select
                className="input-field"
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MEMBER')}
                disabled={loading}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="label">Assign Project</label>
              <select
                className="input-field"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={loading || role === 'ADMIN'}
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
