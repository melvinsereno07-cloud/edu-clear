
import React, { useState } from 'react';
import { AppState, User, ClearanceStatus, ClearanceType, ClearanceRequest } from '../types';
import { Icons, INSTITUTION_NAME, OFFICES } from '../constants.tsx';

interface StudentProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  addLog: (user: Partial<User>, action: string, details: string) => void;
}

const StudentDashboard: React.FC<StudentProps> = ({ state, updateState, addLog }) => {
  const [showApply, setShowApply] = useState(false);
  const [selectedType, setSelectedType] = useState<ClearanceType>(ClearanceType.SEMESTER);
  const [showCert, setShowCert] = useState<ClearanceRequest | null>(null);

  const studentRequests = state.requests.filter(r => r.studentId === state.currentUser?.id);

  const handleApply = () => {
    // Check if system is locked or period is inactive
    if (state.settings.lockdownMode) {
      alert("System is currently under emergency lockdown. All submissions are suspended.");
      return;
    }
    
    if (!state.settings.clearancePeriodActive) {
      alert("The clearance period is currently closed. New requests are not being accepted at this time.");
      return;
    }

    const newReq: ClearanceRequest = {
      id: `REQ-${Date.now()}`,
      studentId: state.currentUser!.id,
      studentName: state.currentUser!.name,
      type: selectedType,
      academicYear: '2023-2024',
      semester: '1st Semester',
      status: ClearanceStatus.PENDING,
      approvals: OFFICES.map(office => ({
        officeId: office.toLowerCase().replace(' ', '-'),
        officeName: office,
        status: ClearanceStatus.PENDING,
        updatedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateState(prev => ({
      ...prev,
      requests: [newReq, ...prev.requests]
    }));

    addLog(state.currentUser!, 'CLEARANCE_SUBMISSION', `Submitted ${selectedType} clearance request.`);
    setShowApply(false);
  };

  const handlePrint = () => {
    window.print();
    addLog(state.currentUser!, 'PRINT_CERTIFICATE', `Student initiated print for ${showCert?.id}`);
  };

  const isPrintable = (req: ClearanceRequest) => {
    if (req.status === ClearanceStatus.REVOKED) return false;
    if (req.status === ClearanceStatus.APPROVED && state.settings.printEnabled) return true;
    if (req.status !== ClearanceStatus.APPROVED && state.settings.allowProvisionalPrint) return true;
    return false;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-3 tracking-tighter">Welcome Back, {state.currentUser?.name.split(' ')[0]}!</h1>
          <p className="text-indigo-100 max-w-md font-medium leading-relaxed opacity-90">
            {state.settings.clearancePeriodActive 
              ? `The ${selectedType} clearance period is currently ACTIVE. Ensure all departmental requirements are settled.`
              : `The clearance period is currently CLOSED. Monitor your existing applications below for status updates.`}
          </p>
        </div>
        <button 
          onClick={() => setShowApply(true)}
          disabled={state.settings.lockdownMode || !state.settings.clearancePeriodActive}
          className="relative z-10 bg-white text-indigo-600 px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-50 transition-all transform hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50 disabled:grayscale"
        >
          {state.settings.clearancePeriodActive ? 'Start New Clearance' : 'Submission Closed'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-8 bg-indigo-600 rounded-full"></span> 
              Your Clearance Dashboard
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{studentRequests.length} Applications</p>
          </div>
          
          {studentRequests.length === 0 ? (
            <div className="py-24 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] mx-auto flex items-center justify-center text-slate-200 shadow-inner">
                <Icons.Clock />
              </div>
              <div className="max-w-xs mx-auto">
                <p className="text-slate-700 font-black text-xl mb-1">No Records Found</p>
                <p className="text-slate-400 text-sm font-medium">When you submit a clearance request, it will appear here for tracking.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {studentRequests.map(req => (
                <div key={req.id} className={`border rounded-[2.5rem] overflow-hidden transition-all shadow-sm ${req.status === ClearanceStatus.REVOKED ? 'border-red-200 bg-red-50/20' : 'border-slate-100 bg-white'}`}>
                  <div className="bg-slate-50/50 p-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-100">
                    <div className="flex items-center gap-5">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
                         req.status === ClearanceStatus.APPROVED ? 'bg-emerald-500' :
                         req.status === ClearanceStatus.REVOKED ? 'bg-slate-900' :
                         req.status === ClearanceStatus.REJECTED ? 'bg-red-500' : 'bg-amber-500'
                       }`}>
                         <Icons.Check />
                       </div>
                       <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-xl font-black text-slate-800 tracking-tight">{req.type}</h4>
                          {req.status === ClearanceStatus.REVOKED && (
                            <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest">INVALIDATED</span>
                          )}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.academicYear} • {req.semester}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${
                        req.status === ClearanceStatus.APPROVED ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                        req.status === ClearanceStatus.REVOKED ? 'bg-slate-900 text-white border-slate-900' :
                        req.status === ClearanceStatus.REJECTED ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                      {isPrintable(req) && (
                        <button 
                          onClick={() => setShowCert(req)}
                          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                        >
                          <Icons.Print /> Download Certificate
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-10">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
                      {req.approvals.map(app => (
                        <div key={app.officeId} className="flex flex-col items-center text-center group relative">
                          <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center mb-4 transition-all transform group-hover:-translate-y-1 shadow-sm border-2 ${
                            app.status === ClearanceStatus.APPROVED ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                            app.status === ClearanceStatus.REJECTED ? 'bg-red-50 text-red-500 border-red-100' :
                            'bg-slate-50 text-slate-200 border-slate-100'
                          }`}>
                            {app.status === ClearanceStatus.APPROVED ? <Icons.Check /> : 
                             app.status === ClearanceStatus.REJECTED ? <Icons.X /> : 
                             <Icons.Clock />}
                          </div>
                          <p className="text-[11px] font-black uppercase tracking-tight text-slate-700 mb-1 leading-tight">{app.officeName}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${
                            app.status === ClearanceStatus.APPROVED ? 'text-emerald-500' :
                            app.status === ClearanceStatus.REJECTED ? 'text-red-500' :
                            'text-slate-300'
                          }`}>{app.status}</p>
                          {app.remarks && (
                            <div className="absolute top-0 left-full ml-2 w-32 bg-slate-800 text-white text-[9px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                              {app.remarks}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {req.adminJustification && (
                      <div className="mt-10 p-6 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100 border-dashed">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Institutional Remarks / Admin Note</p>
                        <p className="text-sm font-bold text-slate-700 italic leading-relaxed">"{req.adminJustification}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* New Request Modal */}
      {showApply && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden p-12 border border-slate-200">
            <div className="flex justify-between items-center mb-10">
              <div>
                 <h3 className="text-3xl font-black text-slate-800 tracking-tight">Provision Clearance</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Institutional Requirement Selection</p>
              </div>
              <button onClick={() => setShowApply(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Icons.X /></button>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Application Objective</label>
                <div className="grid grid-cols-1 gap-4">
                  {Object.values(ClearanceType).map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`text-left p-6 rounded-2xl border-2 transition-all ${
                        selectedType === type ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-4 ring-indigo-500/10' : 'border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      <p className="font-black uppercase text-[11px] tracking-widest mb-1">{type}</p>
                      <p className="text-[10px] opacity-60 font-medium">Standard approval sequence required.</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={handleApply} className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95">
                  Confirm Application
                </button>
                <button onClick={() => setShowApply(false)} className="px-8 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer */}
      {showCert && (
        <div className="fixed inset-0 bg-white z-[200] overflow-y-auto no-print">
          <div className="sticky top-0 p-6 bg-slate-900 border-b border-white/10 flex justify-between items-center text-white backdrop-blur-md bg-slate-900/90">
            <div>
              <h3 className="font-black tracking-tight text-xl">Verified Institutional Document</h3>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Authorized Digitally Verified Copy</p>
            </div>
            <div className="flex gap-4">
              <button onClick={handlePrint} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">Print / Export PDF</button>
              <button onClick={() => setShowCert(null)} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all">Exit Viewer</button>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto my-20 p-20 bg-white border-2 border-slate-100 shadow-2xl relative min-h-[11in] print:my-0 print:p-12 print:shadow-none print:border-none">
            <div className="text-center mb-20 border-b-8 border-slate-900 pb-12">
              <div className="w-40 h-40 bg-slate-50 rounded-full mx-auto mb-8 flex items-center justify-center border-4 border-slate-900 shadow-inner">
                <span className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase">University Seal</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-[0.25em] mb-2">{INSTITUTION_NAME}</h2>
              <p className="text-lg font-black text-slate-900 tracking-widest mb-2 uppercase">Office of the University Registrar</p>
              <p className="text-sm text-slate-400 font-bold tracking-widest uppercase">Central Campus Records Division</p>
            </div>

            <div className="text-center mb-20">
              <h1 className="text-6xl font-black uppercase mb-4 tracking-tighter">Certificate of Clearance</h1>
              <div className="inline-block px-6 py-2 bg-slate-900 text-white text-[12px] font-black uppercase tracking-[0.4em]">
                {showCert.status === ClearanceStatus.APPROVED ? 'Official Final Release' : 'Provisional Document'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-20 mb-20">
              <div className="space-y-10">
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Credential Name</p>
                  <p className="text-3xl font-black text-slate-900 border-b-4 border-slate-50 pb-3">{showCert.studentName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Student ID Reference</p>
                  <p className="text-2xl font-black text-slate-700 border-b-4 border-slate-50 pb-3">{showCert.studentId}</p>
                </div>
              </div>
              <div className="space-y-10">
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Academic Period</p>
                  <p className="text-2xl font-black text-slate-700 border-b-4 border-slate-50 pb-3">{showCert.academicYear} | {showCert.semester}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Release Category</p>
                  <p className="text-2xl font-black text-slate-700 border-b-4 border-slate-50 pb-3">{showCert.type}</p>
                </div>
              </div>
            </div>

            <div className="mb-24">
              <p className="text-xs font-black mb-10 uppercase text-slate-900 tracking-[0.2em] flex items-center gap-5">
                <span className="w-16 h-[2px] bg-slate-900"></span> 
                Verification of Account Settlement
              </p>
              <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                {showCert.approvals.map(app => (
                  <div key={app.officeId} className="flex justify-between items-center py-4 border-b-2 border-slate-50">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-tight">{app.officeName}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${app.status === ClearanceStatus.APPROVED ? 'text-emerald-600' : 'text-amber-500 opacity-40'}`}>
                      {app.status === ClearanceStatus.APPROVED ? 'Verified' : 'Incomplete'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="space-y-8">
                <div className="w-40 h-40 bg-white border-4 border-slate-900 p-3 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-full h-full border-2 border-dashed border-slate-100 flex items-center justify-center font-mono text-[9px] leading-tight text-slate-300">
                    DYNAMIC<br/>SECURE<br/>AUTH<br/>{showCert.id.slice(-8)}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-900 mb-1 tracking-widest">Digital Audit Hash</p>
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">{btoa(showCert.id + showCert.studentId).slice(0, 48)}</p>
                </div>
              </div>
              <div className="text-center w-80">
                <div className="h-20 flex items-end justify-center mb-4">
                   <p className="font-mono text-[9px] text-slate-200 tracking-[0.6em] uppercase">Electronic Sign-off Verified</p>
                </div>
                <div className="border-t-8 border-slate-900 pt-6">
                  <p className="font-black uppercase text-lg tracking-widest mb-1">Melvin Sereno</p>
                  <p className="text-[11px] uppercase text-slate-500 font-bold tracking-tight">University Registrar & Controller</p>
                </div>
              </div>
            </div>

            {/* Document Watermarks */}
            {showCert.status !== ClearanceStatus.APPROVED && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden select-none">
                <div className="transform -rotate-45 text-slate-100 text-[12rem] font-black uppercase tracking-[0.6em] whitespace-nowrap opacity-40">
                  PROVISIONAL
                </div>
              </div>
            )}
            
            <div className="absolute top-12 right-12 text-[10px] font-mono text-slate-400 font-black">
              CERT_REFERENCE: {showCert.id}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
