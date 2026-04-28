'use client';

interface ProjectSummary {
  id: string;
  name: string;
  totalTasks: number;
  openTasks: number;
  inProgressTasks: number;
  closedTasks: number;
}

interface ProjectOverviewProps {
  summaries: ProjectSummary[];
  onProjectSelect: (id: string) => void;
  onDeleteProject: (id: string) => void;
  userRole: string;
}

export default function ProjectOverview({ summaries, onProjectSelect, onDeleteProject, userRole }: ProjectOverviewProps) {
  const isAdmin = userRole === 'ADMIN';
  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
          <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-slate-900 dark:text-white font-semibold text-lg">No projects found</h3>
        <p className="text-slate-500 max-w-xs mt-1">Get started by creating your first project from the sidebar.</p>
      </div>
    );
  }

  const totalProjects = summaries.length;
  const totalTasks = summaries.reduce((acc, s) => acc + s.totalTasks, 0);
  const totalOpen = summaries.reduce((acc, s) => acc + s.openTasks, 0);
  const totalInProgress = summaries.reduce((acc, s) => acc + s.inProgressTasks, 0);
  const totalClosed = summaries.reduce((acc, s) => acc + s.closedTasks, 0);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: totalProjects, color: 'text-slate-900 dark:text-white' },
          { label: 'Total Tasks', value: totalTasks, color: 'text-brand-400' },
          { label: 'In Progress', value: totalInProgress, color: 'text-amber-400' },
          { label: 'Completed', value: totalClosed, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50 p-5 rounded-2xl">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">Project Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaries.map((project) => (
            <button
              key={project.id}
              onClick={() => onProjectSelect(project.id)}
              className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:border-slate-300 dark:border-slate-700 hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg group-hover:text-brand-400 transition-colors">{project.name}</h3>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete Project"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50">
                  <p className="text-xs text-slate-500 mb-1">Open</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{project.openTasks}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50">
                  <p className="text-xs text-slate-500 mb-1">Active</p>
                  <p className="text-sm font-bold text-amber-400">{project.inProgressTasks}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50">
                  <p className="text-xs text-slate-500 mb-1">Closed</p>
                  <p className="text-sm font-bold text-emerald-400">{project.closedTasks}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-500">Total Tasks</p>
                <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {project.totalTasks}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
