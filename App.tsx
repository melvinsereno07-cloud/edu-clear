
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppState, User, UserRole, AuditLog } from './types';
import { initialAppState } from './mockData';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import FacultyDashboard from './views/FacultyDashboard';
import StudentDashboard from './views/StudentDashboard';
import Layout from './components/Layout';
import AuditLogsView from './views/AuditLogs';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('see_oms_state');
    return saved ? JSON.parse(saved) : initialAppState;
  });

  useEffect(() => {
    localStorage.setItem('see_oms_state', JSON.stringify(state));
  }, [state]);

  const login = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
    addLog(user, 'LOGIN', `User ${user.email} logged in.`);
  };

  const logout = () => {
    if (state.currentUser) {
      addLog(state.currentUser, 'LOGOUT', `User ${state.currentUser.email} logged out.`);
    }
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const addLog = useCallback((user: Partial<User>, action: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      userId: user.id || 'ANONYMOUS',
      userName: user.name || 'Unknown',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, logs: [newLog, ...prev.logs] }));
  }, []);

  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const newState = updater(prev);
      return newState;
    });
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          state.currentUser ? 
            <Navigate to={`/dashboard/${state.currentUser.role.toLowerCase()}`} /> : 
            <Login users={state.users} onLogin={login} />
        } />
        
        <Route element={<Layout state={state} onLogout={logout} />}>
          <Route path="/dashboard/admin/*" element={
            state.currentUser?.role === UserRole.ADMIN ? 
              <AdminDashboard state={state} updateState={updateState} addLog={addLog} /> : 
              <Navigate to="/login" />
          } />
          <Route path="/dashboard/faculty" element={
            state.currentUser?.role === UserRole.FACULTY ? 
              <FacultyDashboard state={state} updateState={updateState} addLog={addLog} /> : 
              <Navigate to="/login" />
          } />
          <Route path="/dashboard/student" element={
            state.currentUser?.role === UserRole.STUDENT ? 
              <StudentDashboard state={state} updateState={updateState} addLog={addLog} /> : 
              <Navigate to="/login" />
          } />
          <Route path="/audit-logs" element={
            state.currentUser?.role === UserRole.ADMIN ? 
              <AuditLogsView state={state} /> : 
              <Navigate to="/login" />
          } />
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
