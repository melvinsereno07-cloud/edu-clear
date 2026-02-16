
import React, { useState, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AppState, User, UserRole, ClearanceStatus, ClearanceType, ClearanceRequest } from '../types';
import { Icons, OFFICES } from '../constants.tsx';

interface AdminProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  addLog: (user: Partial<User>, action: string, details: string) => void;
}

const AdminDashboard: React.FC<AdminProps> = ({ state, updateState, addLog }) => {
  return (
    <Routes>
      <Route path="users" element={<UserManagement state={state} updateState={updateState} addLog={addLog} />} />
      <Route path="rules" element={<ClearanceRules state={state} updateState={updateState} addLog={addLog} />} />
      <Route path="*" element={<Overview state={state} updateState={updateState} addLog={addLog} />} />
    </Routes>
  );
};

const Overview: React.FC<AdminProps> = ({ state, updateState, addLog }) => {
  const [selectedReq, setSelectedReq] = useState<ClearanceRequest | null>(null);
  const [justification, setJustification] = useState('');
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);

  // Calculate Bottlenecks: Which office has most PENDING clearances?
  const bottleneckData = useMemo(() => {
    const counts: Record<string, number> = {};
    OFFICES.forEach(o => counts[o] = 0);
    state.requests.forEach(req => {
      req.approvals.forEach(app => {
        if (app.status === ClearanceStatus.PENDING) {
          counts[app.officeName] = (counts[app.officeName] || 0) + 1;
        }
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [state.requests]);

  const stats = [
    { label: 'Active Students', value: state.users.filter(u => u.role === UserRole.STUDENT && u.isActive).length, color: 'text-blue-600' },
    { label: 'Unresolved Requests', value: state.requests.filter(r => r.status === ClearanceStatus.PENDING).length, color: 'text-amber-600' },
    { label: 'Completion Rate', value: `${Math.round((state.requests.filter(r => r.status === ClearanceStatus.APPROVED).length / (state.requests.length || 1)) * 100)}%`, color: 'text-emerald-600' },
    { label: 'Critical Bottlenecks', value: bottleneckData.filter(b => b[1] > 0).length, color: 'text-red-600' },
  ];

  const handleOverride = (newStatus: ClearanceStatus) => {
    if (!selectedReq || !justification) return;
    updateState(prev => ({
      ...prev,
      requests: prev.requests.map(req => 
        req.id === selectedReq.id 
          ? { ...req, status: newStatus, adminJustification: justification, updatedAt: new Date().toISOString() } 
          : req
      )
    }));
    addLog(state.currentUser!, 'ADMIN_OVERRIDE', `Status of request ${selectedReq.id} changed to ${newStatus}. Justification: ${justification}`);
    setSelectedReq(null);
    setJustification('');
  };

  const handleBatchPrint = () => {
    if (selectedForBatch.length === 0) return;
    addLog(state.currentUser!, 'BATCH_PRINT', `Initiated batch print for ${selectedForBatch.length} requests.`);
    alert(`Batch printing ${selectedForBatch.length} certificates. System generating PDF queue...`);
    setSelectedForBatch([]);
  };

  const toggleSelectAll = () => {
    if (selectedForBatch.length === state.requests.length) {
      setSelectedForBatch([]);
    } else {
      setSelectedForBatch(state.requests.map(r => r.id));
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-transform hover:translate-y-[-4px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/30 gap-4">
              <div>
                <h3 className="font-black text-slate-800 text-xl tracking-tight">Active Clearance Workflow</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Live tracking of all student requests</p>
              </div>
              <div className="flex gap-2">
                {selectedForBatch.length > 0 && (
                  <button 
                    onClick={handleBatchPrint}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 animate-bounce"
                  >
                    Batch Print ({selectedForBatch.length})
                  </button>
                )}
                <button className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Generate Report</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        checked={selectedForBatch.length === state.requests.length && state.requests.length > 0} 
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                    </th>
                    <th className="px-6 py-5">Student / ID</th>
                    <th className="px-6 py-5">Request Type</th>
                    <th className="px-6 py-5 text-center">Progress</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.requests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <input 
                          type="checkbox" 
                          checked={selectedForBatch.includes(req.id)}
                          onChange={() => setSelectedForBatch(prev => prev.includes(req.id) ? prev.filter(id => id !== req.id) : [...prev, req.id])}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800">{req.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{req.studentId}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{req.type}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                           <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-700" 
                              style={{ width: `${(req.approvals.filter(a => a.status === ClearanceStatus.APPROVED).length / req.approvals.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-400">
                            {req.approvals.filter(a => a.status === ClearanceStatus.APPROVED).length}/{req.approvals.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                          req.status === ClearanceStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                          req.status === ClearanceStatus.REVOKED ? 'bg-slate-900 text-white' :
                          req.status === ClearanceStatus.REJECTED ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => setSelectedReq(req)}
                          className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                        >
                          Manual Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Bottleneck Analysis */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="p-2 bg-red-50 text-red-600 rounded-xl"><Icons.Alert /></span>
              Approval Bottlenecks
            </h3>
            <div className="space-y-6">
              {bottleneckData.filter(b => b[1] > 0).length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm font-bold text-slate-400">No bottlenecks detected. Flow is optimal.</p>
                </div>
              ) : (
                bottleneckData.map(([office, count]) => (
                  <div key={office} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-700">{office}</span>
                      <span className="text-red-600">{count} PENDING</span>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full" 
                        style={{ width: `${(count / state.requests.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="w-full mt-8 py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">
              Nudge Department Heads
            </button>
          </div>

          {/* Quick System Controls */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Icons.Clock /></span>
              System Pulse
            </h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-black text-slate-700">Clearance Period</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Allows student submissions</p>
                </div>
                <button 
                  onClick={() => updateState(prev => ({ ...prev, settings: { ...prev.settings, clearancePeriodActive: !prev.settings.clearancePeriodActive }}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${state.settings.clearancePeriodActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.settings.clearancePeriodActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <Link to="/dashboard/admin/rules" className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-center flex items-center justify-center gap-2">
                Configure Office Sequences
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {selectedReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-10 bg-slate-900 text-white">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-black tracking-tight">Administrative Overrule</h3>
                <button onClick={() => setSelectedReq(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><Icons.X /></button>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Student: <span className="text-white">{selectedReq.studentName}</span></p>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-4">
                <div className="text-amber-500 mt-1"><Icons.Alert /></div>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">System-wide overrides bypass all departmental checks. Ensure this action aligns with University policy before finalizing.</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Policy Justification (Required)</label>
                <textarea 
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="e.g., Honorable Dismissal approved by University Dean..."
                  className="w-full p-5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none shadow-inner bg-slate-50 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => handleOverride(ClearanceStatus.APPROVED)}
                  disabled={!justification}
                  className="bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-30 disabled:grayscale transition-all"
                >
                  Force Approve
                </button>
                <button 
                  onClick={() => handleOverride(ClearanceStatus.REVOKED)}
                  disabled={!justification}
                  className="bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black shadow-xl shadow-slate-200 disabled:opacity-30 transition-all"
                >
                  Revoke Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserManagement: React.FC<AdminProps> = ({ state, updateState, addLog }) => {
  const [showModal, setShowModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [bulkData, setBulkData] = useState('');
  const [bulkRole, setBulkRole] = useState<UserRole>(UserRole.STUDENT);
  const [search, setSearch] = useState('');

  const filteredUsers = state.users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData: User = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as UserRole,
      office: formData.get('office') as string,
      program: formData.get('program') as string,
      id: editingUser?.id || `USER-${Date.now()}`,
      isActive: editingUser ? editingUser.isActive : true,
      passwordChanged: editingUser ? editingUser.passwordChanged : false,
      tempPassword: editingUser ? editingUser.tempPassword : 'initialPass123'
    };

    updateState(prev => {
      const users = editingUser 
        ? prev.users.map(u => u.id === editingUser.id ? userData : u)
        : [...prev.users, userData];
      return { ...prev, users };
    });

    addLog(state.currentUser!, editingUser ? 'USER_UPDATE' : 'USER_CREATE', `${editingUser ? 'Updated' : 'Created'} account: ${userData.email}`);
    setShowModal(false);
    setEditingUser(null);
  };

  const resetPassword = (user: User) => {
    const newTemp = `temp-${Math.random().toString(36).slice(-8)}`;
    updateState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === user.id ? { ...u, passwordChanged: false, tempPassword: newTemp } : u)
    }));
    addLog(state.currentUser!, 'PASSWORD_RESET', `Reset password for ${user.email}.`);
    alert(`New temporary password for ${user.name}: ${newTemp}`);
  };

  const toggleUserActive = (user: User) => {
    updateState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u)
    }));
    addLog(state.currentUser!, 'USER_STATUS_TOGGLE', `${user.isActive ? 'Deactivated' : 'Activated'} user ${user.email}`);
  };

  const handleBulkUpload = () => {
    const lines = bulkData.split('\n').filter(l => l.trim().length > 0);
    const newUsers: User[] = lines.map((line, idx) => {
      const parts = line.split(',').map(s => s.trim());
      const [email, name, id] = parts;
      return {
        id: id || `USER-${Date.now()}-${idx}`,
        email: email || `user${idx}@bisu.edu.ph`,
        name: name || `Imported User ${idx}`,
        role: bulkRole,
        passwordChanged: false,
        tempPassword: 'temporaryPass123',
        isActive: true
      };
    });

    updateState(prev => ({ ...prev, users: [...prev.users, ...newUsers] }));
    addLog(state.currentUser!, 'BULK_UPLOAD', `Uploaded ${newUsers.length} users (${bulkRole}).`);
    setBulkData('');
    setShowBulk(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Institutional Accounts</h2>
          <p className="text-sm text-slate-500 font-medium">Provision and manage roles for University staff and students.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setEditingUser(null); setShowModal(true); }}
            className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            Create Account
          </button>
          <button 
            onClick={() => setShowBulk(true)}
            className="bg-slate-100 text-slate-700 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Bulk Import
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text" 
              placeholder="Filter database..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
            />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredUsers.length} Matches Found</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-10 py-5">Full Profile</th>
                <th className="px-10 py-5">System Role</th>
                <th className="px-10 py-5">Status</th>
                <th className="px-10 py-5">Security</th>
                <th className="px-10 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className={`${user.isActive ? 'hover:bg-slate-50/30' : 'bg-slate-50/50 opacity-40 grayscale'} transition-colors group`}>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-white text-lg ${
                        user.role === UserRole.ADMIN ? 'bg-indigo-600' :
                        user.role === UserRole.FACULTY ? 'bg-indigo-400' : 'bg-slate-300'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-base">{user.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block mb-1 ${
                      user.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-700' :
                      user.role === UserRole.FACULTY ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{user.office || user.program || 'Institutional'}</p>
                  </td>
                  <td className="px-10 py-7">
                    <button 
                      onClick={() => toggleUserActive(user)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                        user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </button>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-tight ${user.passwordChanged ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {user.passwordChanged ? '✓ Verified' : '⚠ Temporary'}
                      </span>
                      <button onClick={() => resetPassword(user)} className="text-[10px] font-bold text-indigo-500 hover:underline text-left mt-1">Force Reset</button>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingUser(user); setShowModal(true); }} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => toggleUserActive(user)} className={`p-3 border rounded-xl transition-all shadow-sm ${user.isActive ? 'bg-white border-red-100 text-red-400 hover:bg-red-50' : 'bg-white border-emerald-100 text-emerald-400 hover:bg-emerald-50'}`}>
                        {user.isActive ? <Icons.X /> : <Icons.Check />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <form onSubmit={handleSaveUser} className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-10 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-2xl text-slate-800 tracking-tight">{editingUser ? 'Profile Settings' : 'New Identity'}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">System Provisioning</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><Icons.X /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Full Name</label>
                <input name="name" defaultValue={editingUser?.name} required placeholder="e.g. Melvin Sereno" className="w-full p-5 rounded-2xl border border-slate-200 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Institutional Email</label>
                <input name="email" type="email" defaultValue={editingUser?.email} required placeholder="name@bisu.edu.ph" className="w-full p-5 rounded-2xl border border-slate-200 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Access Level</label>
                  <select name="role" defaultValue={editingUser?.role || UserRole.STUDENT} className="w-full p-5 rounded-2xl border border-slate-200 text-sm font-bold bg-slate-50 outline-none appearance-none cursor-pointer">
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assignment</label>
                  <input name="program" placeholder="Program/Office" defaultValue={editingUser?.program || editingUser?.office} className="w-full p-5 rounded-2xl border border-slate-200 text-sm font-bold outline-none" />
                </div>
              </div>
            </div>
            <div className="p-10 bg-slate-50 flex gap-4 border-t border-slate-100">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95">
                {editingUser ? 'Save Updates' : 'Provision User'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="px-8 bg-white border border-slate-200 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">
                Close
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden p-10 space-y-8 border border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Bulk Import</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Multi-Account Provisioning</p>
              </div>
              <button onClick={() => setShowBulk(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Icons.X /></button>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Global Role</label>
                <select value={bulkRole} onChange={e => setBulkRole(e.target.value as UserRole)} className="bg-white border-2 border-slate-200 p-3 rounded-xl text-xs font-black uppercase outline-none focus:border-indigo-500">
                  {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Source (CSV Format)</label>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Icons.Clock /> Format: <span className="text-indigo-600">email, Full Name, Student_ID</span>
                </div>
                <textarea 
                  rows={8}
                  value={bulkData}
                  onChange={e => setBulkData(e.target.value)}
                  placeholder="melvin@bisu.edu.ph, Melvin Sereno, 2021-00123"
                  className="w-full p-6 rounded-[1.5rem] border-2 border-slate-100 text-sm font-mono shadow-inner bg-slate-50/50 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleBulkUpload} className="flex-1 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95">
                Process Dataset
              </button>
              <button onClick={() => setShowBulk(false)} className="px-8 bg-slate-100 text-slate-500 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ClearanceRules: React.FC<AdminProps> = ({ state, updateState, addLog }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Clearance Configuration</h2>
        <p className="text-sm text-slate-500 font-medium">Manage required offices and approval sequences for all clearance types.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 tracking-tight">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Icons.Check /></span>
            Active Office Sequence
          </h3>
          <div className="space-y-4">
            {OFFICES.map((office, idx) => (
              <div key={office} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[10px]">{idx + 1}</span>
                <span className="font-bold text-slate-700 flex-1">{office}</span>
                <button className="opacity-0 group-hover:opacity-100 text-[10px] font-black uppercase text-red-500 transition-opacity">Remove</button>
              </div>
            ))}
            <button className="w-full mt-4 border-2 border-dashed border-slate-200 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all">
              + Add Office to Sequence
            </button>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 tracking-tight">
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Icons.Clock /></span>
              Clearance Templates
            </h3>
            <div className="space-y-4">
              {Object.values(ClearanceType).map(type => (
                <div key={type} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-black text-slate-800 text-xs tracking-widest uppercase">{type}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Standard approval logic applied</p>
                  </div>
                  <button className="text-indigo-600 font-black text-[10px] uppercase hover:underline">Edit Rules</button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-indigo-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
             <h4 className="text-lg font-black mb-2 tracking-tight">Batch Management</h4>
             <p className="text-indigo-200 text-xs font-medium mb-6 leading-relaxed">Download full University records or trigger bulk approval for specific graduation batches.</p>
             <div className="flex gap-4">
                <button className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all">Export All</button>
                <button className="bg-indigo-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">Archiving</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
