'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Status {
  id: string;
  name: string;
  color: string | null;
  category: 'todo' | 'in_progress' | 'done';
  orderIndex: number;
}

interface StatusManagementProps {
  projectId: string;
  userRole: string;
  onUpdate?: () => void;
}

export default function StatusManagement({ projectId, userRole }: StatusManagementProps) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#6B7280', category: 'todo' as const });
  const [error, setError] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const isAdmin = userRole === 'ADMIN';

  useEffect(() => {
    fetchStatuses();
  }, [projectId]);

  async function fetchStatuses() {
    setLoading(true);
    try {
      const data = await api.get<Status[]>(`/api/projects/${projectId}/statuses`);
      setStatuses(data);
    } catch (err) {
      console.error('Failed to fetch statuses', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const newStatus = await api.post<Status>(`/api/projects/${projectId}/statuses`, formData);
      setStatuses([...statuses, newStatus]);
      setIsAdding(false);
      setFormData({ name: '', color: '#6B7280', category: 'todo' });
    } catch (err: any) {
      setError(err.message || 'Failed to add status');
    }
  }

  async function handleUpdate(id: string, data: Partial<Status>) {
    try {
      const updated = await api.patch<Status>(`/api/projects/${projectId}/statuses/${id}`, data);
      setStatuses(statuses.map(s => s.id === id ? updated : s));
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this status?')) return;
    try {
      await api.delete(`/api/projects/${projectId}/statuses/${id}`);
      setStatuses(statuses.filter(s => s.id !== id));
    } catch (err: any) {
      if (err.status === 409) {
        alert('This status is in use by tasks and cannot be deleted.');
      } else {
        alert(err.message || 'Failed to delete status');
      }
    }
  }

  async function handleReorder(orderedIds: string[]) {
    // Optimistic update
    const originalStatuses = [...statuses];
    const newStatuses = orderedIds.map(id => statuses.find(s => s.id === id)!);
    setStatuses(newStatuses);

    try {
      await api.patch(`/api/projects/${projectId}/statuses/reorder`, { ordered_ids: orderedIds });
    } catch (err) {
      setStatuses(originalStatuses);
      alert('Failed to reorder statuses');
    }
  }

  // Drag and Drop Logic
  function onDragStart(id: string) {
    if (!isAdmin) return;
    setDraggedId(id);
  }

  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (!draggedId || draggedId === id) return;
    
    const newOrderedIds = statuses.map(s => s.id);
    const draggedIndex = newOrderedIds.indexOf(draggedId);
    const targetIndex = newOrderedIds.indexOf(id);
    
    newOrderedIds.splice(draggedIndex, 1);
    newOrderedIds.splice(targetIndex, 0, draggedId);
    
    // We don't call API on every drag over, just update local state for smoothness
    const reordered = newOrderedIds.map(sid => statuses.find(s => s.id === sid)!);
    setStatuses(reordered);
  }

  function onDragEnd() {
    if (!draggedId) return;
    handleReorder(statuses.map(s => s.id));
    setDraggedId(null);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Status Management</h2>
        {isAdmin && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-primary py-1.5 px-3 text-sm"
          >
            Add Status
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card p-4 space-y-4 border-brand-500/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Name</label>
              <input 
                type="text" 
                required
                className="input-field" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Status name..."
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select 
                className="select-field"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  className="w-10 h-10 rounded border-none bg-transparent cursor-pointer"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                />
                <input 
                  type="text"
                  className="input-field flex-1"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-semibold text-muted-foreground">Cancel</button>
            <button type="submit" className="btn-primary py-2 px-4 text-sm">Create Status</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {statuses.length === 0 ? (
          <div className="text-center py-10 bg-card/40 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground text-sm">No custom statuses yet.</p>
          </div>
        ) : (
          statuses.map((status) => (
            <div 
              key={status.id}
              draggable={isAdmin && editingId !== status.id}
              onDragStart={() => onDragStart(status.id)}
              onDragOver={(e) => onDragOver(e, status.id)}
              onDragEnd={onDragEnd}
              className={`group flex items-center gap-4 p-4 glass-card transition-all ${
                draggedId === status.id ? 'opacity-40 scale-95' : 'hover:border-brand-500/30'
              } ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {isAdmin && (
                <div className="text-muted-foreground opacity-40 group-hover:opacity-100">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
              )}

              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: status.color || '#6B7280' }}
              />

              {editingId === status.id ? (
                <div className="flex-1 flex gap-4 items-center">
                  <input 
                    type="text" 
                    className="input-field py-1"
                    defaultValue={status.name}
                    autoFocus
                    onBlur={(e) => handleUpdate(status.id, { name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(status.id, { name: e.currentTarget.value });
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <select 
                    className="select-field py-1 w-32"
                    defaultValue={status.category}
                    onChange={(e) => handleUpdate(status.id, { category: e.target.value as any })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{status.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      status.category === 'done' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      status.category === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {status.category.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingId(status.id)}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(status.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
