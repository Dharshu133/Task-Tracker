'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import SubtaskItem from './SubtaskItem';
import AddSubtaskForm from './AddSubtaskForm';

interface SubtasksViewProps {
  taskId: string;
  projectId: string;
  statuses: any[];
}

export default function SubtasksView({ taskId, projectId, statuses }: SubtasksViewProps) {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingRoot, setIsAddingRoot] = useState(false);

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  async function fetchSubtasks() {
    setLoading(true);
    try {
      const [subRes, tasksRes] = await Promise.all([
        api.get<any[]>(`/api/tasks/${taskId}/subtasks?recursive=true`),
        api.get<any[]>(`/api/tasks?project_id=${projectId}`)
      ]);
      setSubtasks(subRes);
      setProjectTasks(tasksRes);
    } catch (err) {
      setError('Failed to load subtasks');
    } finally {
      setLoading(false);
    }
  }

  function handleUpdateSubtask(updated: any) {
    setSubtasks(prev => {
      const updateRecursive = (list: any[]): any[] => {
        return list.map(item => {
          if (item.id === updated.id) {
            return { ...item, ...updated, subtasks: item.subtasks }; // Keep existing subtasks
          }
          if (item.subtasks) {
            return { ...item, subtasks: updateRecursive(item.subtasks) };
          }
          return item;
        });
      };
      return updateRecursive(prev);
    });
  }

  function handleDeleteSubtask(id: string) {
    setSubtasks(prev => {
      const deleteRecursive = (list: any[]): any[] => {
        return list.filter(item => {
          if (item.id === id) return false;
          if (item.subtasks) {
            item.subtasks = deleteRecursive(item.subtasks);
          }
          return true;
        });
      };
      return deleteRecursive(prev);
    });
  }

  function handleAddChildSubtask(newChild: any) {
    setSubtasks(prev => {
      const addChildRecursive = (list: any[]): any[] => {
        return list.map(item => {
          if (item.id === newChild.parentTaskId) {
            return { 
              ...item, 
              subtasks: [...(item.subtasks || []), { ...newChild, subtasks: [] }] 
            };
          }
          if (item.subtasks) {
            return { ...item, subtasks: addChildRecursive(item.subtasks) };
          }
          return item;
        });
      };
      return addChildRecursive(prev);
    });
  }

  function handleAddRootSubtask(newSubtask: any) {
    setSubtasks(prev => [...prev, { ...newSubtask, subtasks: [] }]);
    setIsAddingRoot(false);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Subtasks</h3>
        <button 
          onClick={() => setIsAddingRoot(true)}
          className="text-xs font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Subtask
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[200px]">
        {subtasks.length === 0 && !isAddingRoot ? (
          <div className="flex flex-col items-center justify-center h-40 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm text-slate-500 mb-3">No subtasks yet. Break this task into smaller steps.</p>
            <button 
              onClick={() => setIsAddingRoot(true)}
              className="btn-primary text-xs h-8"
            >
              + Add Subtask
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {subtasks.map(sub => (
              <SubtaskItem 
                key={sub.id}
                subtask={sub}
                statuses={statuses}
                depth={0}
                onUpdate={handleUpdateSubtask}
                onDelete={handleDeleteSubtask}
                onAddChild={handleAddChildSubtask}
                projectTasks={projectTasks}
              />
            ))}
            {isAddingRoot && (
              <AddSubtaskForm 
                parentId={taskId}
                projectId={projectId}
                statuses={statuses}
                onSuccess={handleAddRootSubtask}
                onCancel={() => setIsAddingRoot(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
