
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppState, UserRole } from '../types';
import { INSTITUTION_NAME } from '../constants';

interface LayoutProps {
  state: AppState;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ state, onLogout }) => {
  const { currentUser } = state;
  const location = useLocation();

  if (!currentUser) return <Outlet />;

  const navItems = [
    { label: 'Dashboard', path: `/dashboard/${currentUser.role.toLowerCase()}`, roles: [UserRole.ADMIN, UserRole.FACULTY, UserRole.STUDENT] },
    { label: 'Audit Logs', path: '/audit-logs', roles: [UserRole.ADMIN] },
    { label: 'Users', path: '/dashboard/admin/users', roles: [UserRole.ADMIN] },
  ].filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="no-print w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-indigo-400">SEE-OMS</h1>
          <p className="text-xs text-slate-400 font-medium">Organization Management System</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                location.pathname === item.path ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-200">{currentUser.name}</p>
            <p className="text-xs text-slate-500">{currentUser.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 bg-slate-50 overflow-y-auto">
        <header className="no-print mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-700">{INSTITUTION_NAME}</h2>
            <p className="text-sm text-slate-500">Official SEE Organization Portal</p>
          </div>
          {state.settings.lockdownMode && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              SYSTEM LOCKDOWN ACTIVE
            </span>
          )}
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
