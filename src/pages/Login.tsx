import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

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

  const fillDemo = (type: 'manager' | 'staff') => {
    if (type === 'manager') {
      setEmail('manager@company.com');
      setPassword('manager123');
    } else {
      setEmail('sarah@company.com');
      setPassword('staff123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0b1329] flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Sapphire & Sky Blue Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/15 dark:bg-sky-400/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md animate-fade-in z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-sky-500 mb-4 shadow-xl shadow-blue-600/30 ring-1 ring-white/20">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">TaskFlow</h1>
          <p className="text-slate-500 dark:text-sky-300/80 text-sm mt-1 font-medium">Enterprise Performance & Task Manager</p>
        </div>

        {/* Card */}
        <div className="bg-white border-slate-200/90 shadow-xl shadow-blue-950/5 dark:bg-[#121c38]/90 dark:backdrop-blur-xl dark:border-blue-900/40 dark:shadow-2xl border rounded-2xl p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Sign in to your portal</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm animate-slide-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Email address</label>
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white dark:placeholder-slate-500 border text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white dark:placeholder-slate-500 border text-sm pr-11
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-sky-300 transition-colors"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white
                bg-gradient-to-r from-blue-600 via-blue-700 to-sky-500
                hover:from-blue-500 hover:to-sky-400
                shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40
                transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-blue-900/30">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3 font-medium">Demo accounts — click to fill</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="demo-manager-btn"
                type="button"
                onClick={() => fillDemo('manager')}
                className="py-2.5 px-3 rounded-xl bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-slate-200 dark:hover:bg-blue-900/40 border text-xs transition-all duration-200 text-left"
              >
                <div className="font-bold text-blue-900 dark:text-sky-300">👔 Manager</div>
                <div className="text-slate-500 text-[10px] mt-0.5">Rachel Adams</div>
              </button>

              <button
                id="demo-staff-btn"
                type="button"
                onClick={() => fillDemo('staff')}
                className="py-2.5 px-3 rounded-xl bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-slate-200 dark:hover:bg-blue-900/40 border text-xs transition-all duration-200 text-left"
              >
                <div className="font-bold text-blue-900 dark:text-sky-300">💼 Staff</div>
                <div className="text-slate-500 text-[10px] mt-0.5">Sarah Connor</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6">
          TaskFlow Executive System · Enterprise Access Only
        </p>
      </div>
    </div>
  );
};

export default Login;
