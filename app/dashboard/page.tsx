'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import KanbanBoard from '@/components/KanbanBoard';
import AddTaskModal from '@/components/AddTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import AddProjectModal from '@/components/AddProjectModal';
import ProjectOverview from '@/components/ProjectOverview';
import AddUserModal from '@/components/AddUserModal';
import { api } from '@/lib/api';

interface UserInfo {
  id: string;
  email: string;
  role: string;
  orgId: string;
  orgName?: string;
  assignedProjectId?: string | null;
}


interface Project {
  id: string;
  name: string;
}

interface ProjectSummary {
  id: string;
  name: string;
  totalTasks: number;
  openTasks: number;
  inProgressTasks: number;
  closedTasks: number;
}

interface OrgUser {
  id: string;
  email: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdBy: string;
  assignee: { id: string; email: string; role: string } | null;
  creator: { id: string; email: string; role: string };
  project: { id: string; name: string };
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    try {
      setUser(JSON.parse(userData));
    } catch {
      router.push('/login');
    }
  }, [router]);

  // Fetch projects and users once
  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<Project[]>('/api/projects'),
      api.get<OrgUser[]>('/api/users'),
    ])
      .then(([projs, users]) => {
        setProjects(projs);
        setOrgUsers(users);
        // Auto-select project for members if they have an assigned project and no project is selected
        if (user.role === 'MEMBER' && projs.length === 1 && !activeProjectId) {
          setActiveProjectId(projs[0].id);
        }
      })

      .catch(() => setError('Failed to load projects. Please refresh.'));
  }, [user]);

  // Fetch summaries for dashboard
  const fetchSummaries = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get<ProjectSummary[]>('/api/projects/summary');
      setProjectSummaries(data);
    } catch (err) {
      console.error('Failed to fetch summaries', err);
    }
  }, [user]);

  useEffect(() => {
    if (activeProjectId === null) {
      fetchSummaries();
    }
  }, [activeProjectId, fetchSummaries]);

  // Fetch tasks whenever active project changes
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const qs = activeProjectId ? `?project_id=${activeProjectId}` : '';
      const data = await api.get<Task[]>(`/api/tasks${qs}`);
      setTasks(data);
    } catch {
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [user, activeProjectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function handleTaskUpdate(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    // If on dashboard, refresh summaries
    if (activeProjectId === null) fetchSummaries();
  }

  function handleTaskDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    // If on dashboard, refresh summaries
    if (activeProjectId === null) fetchSummaries();
  }

  function handleTaskCreated(task: Task) {
    setTasks((prev) => [task, ...prev]);
    // If on dashboard, refresh summaries
    if (activeProjectId === null) fetchSummaries();
  }

  function handleEditClick(task: Task) {
    setEditingTask(task);
    setShowEditModal(true);
  }

  function handleProjectCreated(project: Project) {
    setProjects((prev) => [...prev, project].sort((a, b) => a.name.localeCompare(b.name)));
    fetchSummaries();
  }

  async function handleProjectDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this project and all its tasks?')) return;

    try {
      await api.delete(`/api/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setProjectSummaries((prev) => prev.filter((s) => s.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
    } catch (err) {
      setError('Failed to delete project.');
      console.error(err);
    }
  }

  function handleProjectSelect(id: string | null) {
    setActiveProjectId(id);
    setSidebarOpen(false);
  }

  const activeProjectName =
    activeProjectId === ('USERS_VIEW' as any)
      ? 'User Management'
      : activeProjectId 
        ? projects.find((p) => p.id === activeProjectId)?.name ?? 'Project' 
        : 'Dashboard';

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header user={user} onMenuToggle={() => setSidebarOpen((o) => !o)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onProjectSelect={handleProjectSelect}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole={user.role}
          onCreateProject={() => setShowAddProjectModal(true)}
          onDeleteProject={handleProjectDelete}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Page header */}
          <div className="flex items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{activeProjectName}</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {activeProjectId === ('USERS_VIEW' as any)
                  ? `Manage the ${orgUsers.length} users in your organization`
                  : activeProjectId 
                    ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''} in this project`
                    : 'Overview of all your projects'
                }
              </p>
            </div>
            {activeProjectId === ('USERS_VIEW' as any) ? (
              <button
                id="add-user-btn"
                onClick={() => setShowAddUserModal(true)}
                className="btn-primary shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="hidden sm:inline">Add User</span>
                <span className="sm:hidden">Add</span>
              </button>
            ) : user.role === 'ADMIN' ? (
              <button
                id="add-task-btn"
                onClick={() => setShowAddModal(true)}
                className="btn-primary shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Task</span>
                <span className="sm:hidden">Add</span>
              </button>
            ) : null}

          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
                  <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-4" />
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-3 animate-pulse" />
                  ))}
                </div>
              ))}
            </div>
          ) : activeProjectId === ('USERS_VIEW' as any) ? (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orgUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white dark:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold text-xs">
                            {u.email[0].toUpperCase()}
                          </div>
                          <span className="text-slate-900 dark:text-white font-medium">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                          u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeProjectId ? (
            <KanbanBoard
              tasks={tasks}
              currentUserId={user.id}
              currentUserRole={user.role}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
              onEdit={handleEditClick}
            />
          ) : (
            <ProjectOverview 
              summaries={projectSummaries} 
              onProjectSelect={handleProjectSelect}
              onDeleteProject={handleProjectDelete}
              userRole={user.role}
            />
          )}
        </main>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          projects={projects}
          orgUsers={orgUsers}
          currentUserRole={user.role}
          onClose={() => setShowAddModal(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <EditTaskModal
          task={editingTask}
          orgUsers={orgUsers}
          currentUserRole={user.role}
          onClose={() => {
            setShowEditModal(false);
            setEditingTask(null);
          }}
          onUpdated={handleTaskUpdate}
        />
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <AddProjectModal
          orgId={user.orgId}
          onClose={() => setShowAddProjectModal(false)}
          onCreated={handleProjectCreated}
        />
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onCreated={(newUser) => {
            setOrgUsers((prev) => [...prev, newUser].sort((a, b) => a.email.localeCompare(b.email)));
          }}
        />
      )}

    </div>
  );
}
