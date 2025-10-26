import { Link, Outlet, useLocation } from 'react-router-dom';
import { Briefcase, Users, ClipboardList } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">TalentFlow</span>
              </Link>

              <div className="hidden md:flex space-x-1">
                <Link
                  to="/jobs"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/jobs')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Jobs</span>
                  </div>
                </Link>

                <Link
                  to="/candidates"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/candidates')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Candidates</span>
                  </div>
                </Link>

                <Link
                  to="/kanban"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/kanban')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-4 h-4" />
                    <span>Kanban</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
