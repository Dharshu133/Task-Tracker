'use client';

interface Project {
  id: string;
  name: string;
}

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onProjectSelect: (id: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

export default function Sidebar({
  projects,
  activeProjectId,
  onProjectSelect,
  isOpen,
  onClose,
  userRole,
  onCreateProject,
  onDeleteProject,
}: SidebarProps) {
  const isAdmin = userRole === 'ADMIN';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-40 bg-slate-900 border-r border-slate-800 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:h-auto lg:flex
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Navigation</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Dashboard */}
          <button
            id="project-all"
            onClick={() => { onProjectSelect(null); onClose(); }}
            className={`sidebar-item ${activeProjectId === null ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </button>

          {/* Users - Admin only */}
          {isAdmin && (
            <button
              id="nav-users"
              onClick={() => { onProjectSelect('USERS_VIEW' as any); onClose(); }}
              className={`sidebar-item ${activeProjectId === ('USERS_VIEW' as any) ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Manage Users
            </button>
          )}




          <div className="pt-4 pb-2 px-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Projects</h3>
              {isAdmin && (
                <button
                  onClick={onCreateProject}
                  className="p-1 text-slate-500 hover:text-brand-400 transition-colors"
                  title="Create Project"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Project list */}
          {projects.length === 0 && (
            <p className="text-slate-600 text-xs px-3 py-4 text-center italic">No projects yet</p>
          )}
          {projects.map((project) => (
            <div key={project.id} className="group flex items-center gap-1 pr-2">
              <button
                id={`project-${project.id}`}
                onClick={() => { onProjectSelect(project.id); onClose(); }}
                className={`flex-1 sidebar-item ${activeProjectId === project.id ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${activeProjectId === project.id ? 'bg-brand-400' : 'bg-slate-600'}`} />
                <span className="truncate">{project.name}</span>
              </button>
              
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-500/10"
                  title="Delete Project"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <p className="text-[10px] font-medium text-slate-600 text-center uppercase tracking-wider">
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </aside>
    </>
  );
}
