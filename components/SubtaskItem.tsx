'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import AddSubtaskForm from './AddSubtaskForm';

interface SubtaskItemProps {
  subtask: any;
  statuses: any[];
  onUpdate: (updated: any) => void;
  onDelete: (id: string) => void;
  onAddChild: (newChild: any) => void;
  depth: number;
  projectTasks: any[];
}

export default function SubtaskItem({ subtask, statuses, onUpdate, onDelete, onAddChild, depth, projectTasks }: SubtaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasChildren = subtask.subtasks && subtask.subtasks.length > 0;
  const isDone = subtask.status?.category === 'done';

  async function handleToggleDone() {
    const doneStatus = statuses.find(s => s.category === 'done');
    const todoStatus = statuses.find(s => s.category === 'todo') || statuses[0];
    const newStatusId = isDone ? todoStatus.id : doneStatus.id;
    
    setLoading(true);
    try {
      const updated = await api.patch<any>(`/api/tasks/${subtask.id}`, { statusId: newStatusId });
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!editTitle.trim() || editTitle === subtask.title) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const updated = await api.patch<any>(`/api/tasks/${subtask.id}`, { title: editTitle.trim() });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update title', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(newParentId: string) {
    setLoading(true);
    try {
      const updated = await api.patch<any>(`/api/tasks/${subtask.id}`, { parent_task_id: newParentId || null });
      onUpdate(updated);
      setIsMoving(false);
      // If it moved to a different parent, we should probably tell the parent to remove it
      if (newParentId !== subtask.parentTaskId) {
        onDelete(subtask.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to move subtask');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Deleting this subtask will also delete all its nested subtasks. Continue?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/tasks/${subtask.id}`);
      onDelete(subtask.id);
    } catch (err) {
      console.error('Failed to delete subtask', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div 
        className="group flex items-center gap-2 py-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-lg px-2 transition-colors"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {/* Expand/Collapse Toggle */}
        <div className="w-4 flex items-center justify-center">
          {hasChildren && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Checkbox */}
        <button
          onClick={handleToggleDone}
          disabled={loading}
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
            isDone 
              ? 'bg-emerald-500 border-emerald-500' 
              : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'
          }`}
        >
          {isDone && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Title / Edit Input */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              className="bg-transparent border-b border-brand-500 outline-none w-full text-sm py-0"
            />
          ) : (
            <span 
              onClick={() => setIsEditing(true)}
              className={`text-sm truncate cursor-text hover:text-brand-500 transition-colors ${isDone ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}
            >
              {subtask.title}
            </span>
          )}
        </div>

        {/* Status Badge */}
        {!isEditing && subtask.status && (
          <span 
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
            style={{ 
              backgroundColor: subtask.status.color ? `${subtask.status.color}20` : '#cbd5e120',
              color: subtask.status.color || 'inherit'
            }}
          >
            {subtask.status.name}
          </span>
        )}

        {/* Assignee Avatar */}
        {subtask.assignee && (
          <div className="w-5 h-5 rounded-full bg-brand-500/10 flex items-center justify-center text-[10px] font-bold text-brand-500 border border-brand-500/20 shrink-0" title={subtask.assignee.email}>
            {subtask.assignee.email[0].toUpperCase()}
          </div>
        )}

        {/* Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 16 16">
              <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
            </svg>
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-32 glass-card shadow-lg z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">Edit</button>
                <button onClick={() => { setIsAddingChild(true); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">Add Subtask</button>
                <button onClick={() => { setIsMoving(true); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">Move to...</button>
                <button onClick={() => { handleDelete(); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500">Delete</button>
              </div>
            </>
          )}
        </div>
      </div>

      {isMoving && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-sm p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <h4 className="text-sm font-bold mb-4">Move Subtask</h4>
            <p className="text-xs text-slate-500 mb-4">Select a new parent task in this project.</p>
            <select 
              className="select-field mb-4" 
              defaultValue={subtask.parentTaskId || ""}
              onChange={(e) => handleMove(e.target.value)}
            >
              <option value="">(No Parent - Root Task)</option>
              {projectTasks.filter(t => t.id !== subtask.id).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsMoving(false)} className="btn-ghost text-xs px-3 h-8">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isAddingChild && (
        <div style={{ marginLeft: `${(depth + 1) * 16}px` }}>
          <AddSubtaskForm 
            parentId={subtask.id}
            projectId={subtask.projectId}
            statuses={statuses}
            onSuccess={(newChild) => {
              onAddChild(newChild);
              setIsAddingChild(false);
              setIsExpanded(true);
            }}
            onCancel={() => setIsAddingChild(false)}
          />
        </div>
      )}

      {isExpanded && hasChildren && (
        <div className="flex flex-col">
          {subtask.subtasks.map((child: any) => (
            <SubtaskItem 
              key={child.id}
              subtask={child}
              statuses={statuses}
              depth={depth + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              projectTasks={projectTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
