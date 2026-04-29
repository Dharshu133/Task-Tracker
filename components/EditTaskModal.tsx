'use client';

import { useState, useEffect, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';

interface Project { id: string; name: string; }
interface OrgUser { id: string; email: string; role: string; }
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate: string | null;
  createdBy: string;
  assignee: { id: string; email: string; role: string } | null;
  creator: { id: string; email: string; role: string };
  project: { id: string; name: string };
  _count?: { comments: number };
}

interface EditTaskModalProps {
  task: Task;
  orgUsers: OrgUser[];
  currentUserRole: string;
  onClose: () => void;
  onUpdated: (task: Task, toastMsg?: string) => void;
}

export default function EditTaskModal({ task, orgUsers, currentUserRole, onClose, onUpdated }: EditTaskModalProps) {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'COMMENTS'>(
    currentUserRole === 'MEMBER' ? 'COMMENTS' : 'DETAILS'
  );

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id || '');
  const [priority, setPriority] = useState(task.priority || 'LOW');
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const filteredUsers = currentUserRole === 'MEMBER' 
    ? orgUsers.filter(u => u.role === 'MEMBER')
    : orgUsers;

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (activeTab === 'COMMENTS') {
      setLoadingData(true);
      api.get<any[]>(`/api/tasks/${task.id}/comments`)
        .then(setComments)
        .finally(() => setLoadingData(false));
    }
  }, [activeTab, task.id]);

  async function handleUpdateDetails(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }

    setLoading(true);
    setError('');
    try {
      const updated = await api.patch<Task>(`/api/tasks/${task.id}`, {
        title: title.trim(),
        description: description.trim() || null,
        assignee_id: assigneeId || null,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update task');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const c = await api.post<any>(`/api/tasks/${task.id}/comments`, { 
        content: newComment.trim(),
        parentId: replyTo
      });
      setComments(prev => [...prev, c]);
      setNewComment('');
      setReplyTo(null);
      onUpdated({ ...task, _count: { comments: (task._count?.comments || 0) + 1 } }, 'Comment added successfully');
    } catch {
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveComment(commentId: string) {
    if (!window.confirm('Mark this thread as resolved? This will remove the comment and all its replies.')) return;
    setLoading(true);
    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
      // Optionally update task comment count, though it's complex to count all sub-comments
      onUpdated({ ...task }, 'Thread resolved successfully'); 
    } catch {
      setError('Failed to resolve comment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {currentUserRole === 'ADMIN' ? 'Task Details' : 'Task Discussion'}
            </h2>
            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">{task.id.slice(0,8)}</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex border-b border-slate-300 dark:border-slate-700 px-6 shrink-0">
          {(['DETAILS', 'COMMENTS'] as const)
            .filter(tab => currentUserRole === 'ADMIN' || tab === 'COMMENTS')
            .map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
              {tab === 'COMMENTS' && task._count?.comments ? ` (${task._count.comments})` : ''}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/20">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          {activeTab === 'DETAILS' && (
            <form id="edit-form" onSubmit={handleUpdateDetails} className="space-y-3">
              <div>
                <label className="label">Title <span className="text-red-400">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field" disabled={loading} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input-field resize-none" disabled={loading} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as any)} className="select-field" disabled={loading}>
                    <option value="LOW" className="bg-white dark:bg-slate-900">Low</option>
                    <option value="MEDIUM" className="bg-white dark:bg-slate-900">Medium</option>
                    <option value="HIGH" className="bg-white dark:bg-slate-900">High</option>
                    <option value="CRITICAL" className="bg-white dark:bg-slate-900">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" value={dueDate} min={new Date().toISOString().split('T')[0]} onChange={e => setDueDate(e.target.value)} className="input-field" disabled={loading} />
                </div>
              </div>

              <div>
                <label className="label">Assignee</label>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="select-field" disabled={loading}>
                  <option value="" className="bg-white dark:bg-slate-900">Unassigned</option>
                  {filteredUsers.map(u => (
                    <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900">@{u.email.split('@')[0]}</option>
                  ))}
                </select>
              </div>
            </form>
          )}

          {activeTab === 'COMMENTS' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto">
                {loadingData ? <p className="text-sm text-slate-500">Loading comments...</p> : 
                 comments.length === 0 ? <p className="text-sm text-slate-500">No comments yet. Start the conversation!</p> :
                 comments.filter(c => !c.parentId).map(parent => (
                  <div key={parent.id} className="space-y-2">
                    <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${parent.user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500' : 'bg-brand-500/10 text-brand-500'}`}>
                            {parent.user.role}
                          </span>
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">@{parent.user.email.split('@')[0]}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{new Date(parent.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200">{parent.content}</p>
                      
                      <div className="mt-2 flex justify-end gap-2">
                        {currentUserRole === 'MEMBER' && parent.user.role === 'ADMIN' && (
                          <button 
                            onClick={() => setReplyTo(replyTo === parent.id ? null : parent.id)}
                            className="text-[10px] font-semibold text-brand-500 hover:underline"
                          >
                            {replyTo === parent.id ? 'Cancel Reply' : 'Reply to Admin'}
                          </button>
                        )}
                        {currentUserRole === 'ADMIN' && (
                          <button 
                            onClick={() => handleResolveComment(parent.id)}
                            className="text-[10px] font-semibold text-emerald-500 hover:underline"
                          >
                            Resolve Thread
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Replies */}
                    <div className="ml-6 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                      {comments.filter(c => c.parentId === parent.id).map(reply => (
                        <div key={reply.id} className="p-2 bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-[11px] text-slate-700 dark:text-slate-300">@{reply.user.email.split('@')[0]}</span>
                            <span className="text-[9px] text-slate-500">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                 ))
                }
              </div>
              
              <form onSubmit={handleAddComment} className="mt-4 flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                {replyTo && (
                  <div className="flex items-center justify-between px-2 py-1 bg-brand-500/10 rounded text-[10px] text-brand-500 font-semibold">
                    <span>Replying to @{comments.find(c => c.id === replyTo)?.user.email.split('@')[0]}</span>
                    <button onClick={() => setReplyTo(null)} className="hover:text-brand-700">✕</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newComment} 
                    onChange={e => setNewComment(e.target.value)} 
                    placeholder={replyTo ? "Type your reply..." : "Type a comment..."} 
                    className="input-field flex-1" 
                    disabled={loading} 
                    autoFocus={!!replyTo}
                  />
                  <button type="submit" className="btn-primary shrink-0" disabled={loading || !newComment.trim()}>
                    {replyTo ? 'Reply' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          )}


        </div>

        {/* Footer */}
        {activeTab === 'DETAILS' && (
          <div className="p-5 border-t border-slate-300 dark:border-slate-700 flex gap-3 shrink-0 bg-white dark:bg-slate-900">
            <button type="button" onClick={onClose} className="btn-ghost flex-1" disabled={loading}>Cancel</button>
            <button type="submit" form="edit-form" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
