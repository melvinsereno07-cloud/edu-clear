
import React, { useState } from 'react';
import { AppState, User, UserRole, ClearanceStatus, ClearanceRequest } from '../types';
import { Icons } from '../constants.tsx';

interface FacultyProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  addLog: (user: Partial<User>, action: string, details: string) => void;
}

const FacultyDashboard: React.FC<FacultyProps> = ({ state, updateState, addLog }) => {
  const [selectedReq, setSelectedReq] = useState<ClearanceRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  
  const facultyOffice = state.currentUser?.office || '';
  
  // Filter requests that are relevant to this faculty's office
  const pendingRequests = state.requests.filter(req => {
    const myApproval = req.approvals.find(a => a.officeName === facultyOffice);
    return myApproval && myApproval.status === ClearanceStatus.PENDING;
  });

  const handleApproval = (status: ClearanceStatus) => {
    if (!selectedReq) return;

    updateState(prev => ({
      ...prev,
      requests: prev.requests.map(req => {
        if (req.id === selectedReq.id) {
          const newApprovals = req.approvals.map(app => {
            if (app.officeName === facultyOffice) {
              return { 
                ...app, 
                status, 
                remarks, 
                approvedBy: state.currentUser?.name, 
                updatedAt: new Date().toISOString() 
              };
            }
            return app;
          });

          // Check if all are approved to update overall status
          const allApproved = newApprovals.every(a => a.status === ClearanceStatus.APPROVED);

          return { 
            ...req, 
            approvals: newApprovals, 
            status: allApproved ? ClearanceStatus.APPROVED : req.status,
            updatedAt: new Date().toISOString()
          };
        }
        return req;
      })
    }));

    addLog(state.currentUser!, 'APPROVAL_ACTION', `${status} clearance for ${selectedReq.studentName} in ${facultyOffice} office.`);
    setSelectedReq(null);
    setRemarks('');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Queue: {facultyOffice} Office</h1>
          <p className="text-slate-500">Manage and approve student clearance requests for your department.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-6 py-4 rounded-xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-1">Pending Tasks</p>
          <p className="text-3xl font-black">{pendingRequests.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request List */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-700 px-2">Incoming Requests</h3>
          {pendingRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <Icons.Check />
              </div>
              <p className="text-slate-500 font-medium">All cleared! No pending requests for your office.</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div 
                key={req.id}
                onClick={() => setSelectedReq(req)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedReq?.id === req.id ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-800">{req.studentName}</h4>
                    <p className="text-xs text-slate-500">{req.studentId} • {req.type}</p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">
                    New Request
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Icons.Clock />
                  Submitted {new Date(req.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Panel */}
        <div className="relative">
          {selectedReq ? (
            <div className="sticky top-8 bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
              <div className="p-6 bg-indigo-600 text-white">
                <h3 className="text-lg font-bold">Review Request</h3>
                <p className="text-indigo-100 text-sm">Action for {selectedReq.studentName}</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Academic Year</p>
                    <p className="font-bold text-slate-700">{selectedReq.academicYear}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Semester</p>
                    <p className="font-bold text-slate-700">{selectedReq.semester}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Remarks / Observations</label>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter notes or reason for rejection..."
                    className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleApproval(ClearanceStatus.APPROVED)}
                    className="bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    <Icons.Check /> Approve
                  </button>
                  <button 
                    onClick={() => handleApproval(ClearanceStatus.REJECTED)}
                    className="bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                  >
                    <Icons.X /> Reject
                  </button>
                </div>
                
                <button 
                  onClick={() => handleApproval(ClearanceStatus.CONDITIONAL)}
                  className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors"
                >
                  Approve with Conditions
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <svg className="w-20 h-20 mb-4 opacity-10" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-bold mb-1">No Selection</h3>
              <p className="max-w-xs">Select a student from the queue to start the review process.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
