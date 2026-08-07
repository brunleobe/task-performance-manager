// Login Page component with Admin Demo account option
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      const stored = localStorage.getItem('tpm_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'admin') navigate('/admin/dashboard');
        else if (u.role === 'manager') navigate('/manager/dashboard');
        else navigate('/staff/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fills credentials for testing
  const fillDemo = (type: 'admin' | 'manager' | 'staff') => {
    if (type === 'admin') {
      setEmail('admin@company.com');
      setPassword('admin123');
    } else if (type === 'manager') {
      setEmail('manager@company.com');
      setPassword('manager123');
    } else {
      setEmail('sarah@company.com');
      setPassword('staff123');
    }
  };

  return (
    <div className="min-h-screen bg-[#080c18] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md animate-fade-in">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/20">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">TaskFlow</h1>
          <p className="text-slate-400 text-sm mt-1">Internal Task & Performance System</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-slide-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-sm
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-sm pr-11
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white
                bg-gradient-to-r from-cyan-500 to-blue-600
                hover:from-cyan-400 hover:to-blue-500
                shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-slate-500 text-center mb-3">Demo accounts — click to fill</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="demo-admin-btn"
                type="button"
                onClick={() => fillDemo('admin')}
                className="py-2 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300
                  hover:bg-white/[0.08] hover:border-white/10 transition-all duration-200 text-left"
              >
                <div className="font-medium text-[11px]">👑 Admin</div>
                <div className="text-slate-500 text-[9px] mt-0.5 truncate">System Admin</div>
              </button>

              <button
                id="demo-manager-btn"
                type="button"
                onClick={() => fillDemo('manager')}
                className="py-2 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300
                  hover:bg-white/[0.08] hover:border-white/10 transition-all duration-200 text-left"
              >
                <div className="font-medium text-[11px]">👔 Manager</div>
                <div className="text-slate-500 text-[9px] mt-0.5 truncate">Rachel Adams</div>
              </button>

              <button
                id="demo-staff-btn"
                type="button"
                onClick={() => fillDemo('staff')}
                className="py-2 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300
                  hover:bg-white/[0.08] hover:border-white/10 transition-all duration-200 text-left"
              >
                <div className="font-medium text-[11px]">💼 Staff</div>
                <div className="text-slate-500 text-[9px] mt-0.5 truncate">Sarah Connor</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          TaskFlow Internal System · For authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default Login;
