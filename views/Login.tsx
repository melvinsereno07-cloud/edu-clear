
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASS, INSTITUTION_NAME } from '../constants';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  const [mustChangePassword, setMustChangePassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.email === email);
    
    // Auth logic
    if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASS) {
      if (user && !user.passwordChanged) {
        setMustChangePassword(user);
        return;
      }
      if (user) {
        onLogin(user);
        return;
      }
    }

    // Generic fallback for other users in this mock
    if (user && user.isActive) {
      if (!user.passwordChanged) {
        setMustChangePassword(user);
      } else {
        onLogin(user);
      }
    } else {
      setError(user && !user.isActive ? 'This account has been deactivated.' : 'Invalid credentials or unauthorized access.');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (mustChangePassword) {
      const updatedUser = { ...mustChangePassword, passwordChanged: true };
      // In a real app, we'd persist this to DB
      onLogin(updatedUser);
    }
  };

  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-amber-500 p-8 text-center text-white">
            <h2 className="text-2xl font-black uppercase tracking-tight">Security Update</h2>
            <p className="text-amber-50 text-xs font-bold uppercase mt-1">First-time login requirement</p>
          </div>
          <form onSubmit={handlePasswordChange} className="p-8 space-y-5">
            <p className="text-sm text-slate-500 font-medium">For security reasons, you must change your temporary password before accessing the {mustChangePassword.role.toLowerCase()} dashboard.</p>
            
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all"
            >
              Update & Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-indigo-600 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">SEE-OMS</h1>
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest opacity-80">{INSTITUTION_NAME}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Institution ID / Email</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
              placeholder="e.g. admin@see-org.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Secure Password</label>
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-[10px] text-indigo-600 hover:text-indigo-700 font-black uppercase tracking-tighter"
              >
                {showPass ? 'Hide' : 'Reveal'}
              </button>
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs rounded-2xl border border-red-100 font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transform transition-all active:scale-95 shadow-2xl shadow-indigo-100"
          >
            Access Dashboard
          </button>

          <div className="pt-4 text-center space-y-2">
             <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-tight">
              Authorized personnel only.<br />
              All access attempts are logged for audit.
            </p>
            <p className="text-[10px] text-indigo-500 font-black uppercase cursor-pointer hover:underline">
              Trouble logging in?
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
