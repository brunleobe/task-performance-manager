// Admin Dashboard page — user management, role assignment, and department management
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { User, Department, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockData';
import NotificationBell from '../components/NotificationBell';
import { ProfileModal } from '../components/ProfileModal';
import { ThemeToggle } from '../components/ThemeToggle';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'users' | 'departments'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
    department_id: '',
  });

  const [userFormError, setUserFormError] = useState('');
  const [userFormSuccess, setUserFormSuccess] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const [deptFormName, setDeptFormName] = useState('');
  const [deptFormError, setDeptFormError] = useState('');
  const [deptFormSuccess, setDeptFormSuccess] = useState('');
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const loadAdminData = async () => {
    try {
      const [uList, dList] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminDepartments(),
      ]);
      setUsers(uList);
      setDepartments(dList);
      if (dList.length > 0 && !userForm.department_id) {
        setUserForm(f => ({ ...f, department_id: dList[0].id }));
      }
    } catch {
      setUsers(DEMO_USERS as any);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    setUserFormSuccess('');

    if (!userForm.full_name.trim()) { setUserFormError('Full name is required'); return; }
    if (!userForm.email.trim()) { setUserFormError('Email address is required'); return; }
    if (!userForm.password) { setUserFormError('Password is required'); return; }

    setIsSubmittingUser(true);
    try {
      await api.createAdminUser(userForm);
      setUserFormSuccess(`User account created for ${userForm.full_name}!`);
      setUserForm({
        full_name: '',
        email: '',
        password: '',
        role: 'staff',
        department_id: departments[0]?.id || '',
      });
      loadAdminData();
    } catch (err: any) {
      setUserFormError(err.message || 'Failed to create user');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptFormError('');
    setDeptFormSuccess('');

    if (!deptFormName.trim()) { setDeptFormError('Department name is required'); return; }

    setIsSubmittingDept(true);
    try {
      await api.createAdminDepartment(deptFormName.trim());
      setDeptFormSuccess(`Department '${deptFormName.trim()}' created!`);
      setDeptFormName('');
      loadAdminData();
    } catch (err: any) {
      setDeptFormError(err.message || 'Failed to create department');
    } finally {
      setIsSubmittingDept(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const getRoleBadge = (role: UserRole) => {
    if (role === 'admin') return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    if (role === 'manager') return 'bg-blue-500/15 text-blue-700 dark:text-sky-300 border-blue-500/30';
    return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30';
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0b1329] dark:text-white transition-colors">
      <header className="border-b border-slate-200/90 bg-white/90 dark:border-blue-900/40 dark:bg-[#0d1630]/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">TaskFlow</span>
              <span className="text-indigo-600 dark:text-sky-400 text-xs ml-2 font-bold uppercase tracking-wider">Admin Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsProfileOpen(true)}
              className="text-right hidden sm:block px-3 py-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-blue-900/40 transition-all border border-transparent hover:border-slate-200 dark:hover:border-blue-800/40"
              title="Click to edit profile & password"
            >
              <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                {user?.full_name} <span className="text-xs text-slate-400 dark:text-sky-300">⚙️</span>
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/30">
                System Admin
              </span>
            </button>
            <NotificationBell />
            <button
              id="admin-logout-btn"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:border-blue-900/40 dark:hover:bg-blue-900/40 dark:hover:text-white border transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">System Admin Control Panel</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Provision organization user accounts, assign roles, and structure corporate departments.</p>
        </div>

        {/* Top Summary Stat Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: users.length, icon: '👥' },
            { label: 'Staff Accounts', value: users.filter(u => u.role === 'staff').length, icon: '💼' },
            { label: 'Managers', value: users.filter(u => u.role === 'manager').length, icon: '👔' },
            { label: 'Departments', value: departments.length, icon: '🏢' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-xl p-4 text-center animate-fade-in">
              <p className="text-2xl">{stat.icon}</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-1">{stat.value}</p>
              <p className="text-xs text-slate-500 font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tab Controls */}
        <div className="flex gap-1 p-1 bg-slate-200/70 border-slate-300/70 dark:bg-blue-950/40 dark:border-blue-900/40 border rounded-xl w-full sm:w-fit overflow-x-auto mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'users' ? 'bg-white text-blue-900 shadow-sm dark:bg-blue-600 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            👥 User Management ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'departments' ? 'bg-white text-blue-900 shadow-sm dark:bg-blue-600 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            🏢 Departments ({departments.length})
          </button>
        </div>

        {/* Tab 1: User Management */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl p-6 animate-fade-in">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-sky-400" />
                  Create User Account
                </h2>

                {userFormError && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-slide-up">
                    {userFormError}
                  </div>
                )}
                {userFormSuccess && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold animate-slide-up flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {userFormSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      value={userForm.full_name}
                      onChange={e => setUserForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="e.g. Michael Scott"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="user@company.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Password</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Assigned Role</label>
                    <select
                      value={userForm.role}
                      onChange={e => setUserForm(f => ({ ...f, role: e.target.value as UserRole }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="staff" className="bg-white dark:bg-[#0b1329]">💼 Staff (Task Worker)</option>
                      <option value="manager" className="bg-white dark:bg-[#0b1329]">👔 Manager (Task Assignee)</option>
                      <option value="admin" className="bg-white dark:bg-[#0b1329]">👑 System Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={userForm.department_id}
                      onChange={e => setUserForm(f => ({ ...f, department_id: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id} className="bg-white dark:bg-[#0b1329]">{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-700 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60"
                  >
                    {isSubmittingUser ? 'Creating Account...' : '+ Create Account'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl p-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">All User Accounts</h2>
                <div className="space-y-2">
                  {users.map(u => (
                    <div
                      key={u.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3.5 rounded-xl border bg-slate-50 border-slate-200/90 hover:bg-slate-100 dark:border-blue-900/40 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 transition-all"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{u.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <span className="text-xs text-slate-700 bg-slate-200/80 dark:text-slate-300 dark:bg-blue-950/80 px-2.5 py-1 rounded-md font-semibold">
                          {u.department_name ?? 'Engineering'}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getRoleBadge(u.role)}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Department Management */}
        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl p-6 animate-fade-in">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Add New Department
                </h2>

                {deptFormError && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-slide-up">
                    {deptFormError}
                  </div>
                )}
                {deptFormSuccess && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold animate-slide-up">
                    {deptFormSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateDept} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Department Name</label>
                    <input
                      type="text"
                      value={deptFormName}
                      onChange={e => setDeptFormName(e.target.value)}
                      placeholder="e.g. Product Design"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingDept}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-700 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60"
                  >
                    {isSubmittingDept ? 'Creating Department...' : '+ Create Department'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl p-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Organization Departments</h2>
                <div className="space-y-2">
                  {departments.map(d => (
                    <div
                      key={d.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-xl border bg-slate-50 border-slate-200/90 hover:bg-slate-100 dark:border-blue-900/40 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 transition-all"
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{d.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">ID: {d.id}</p>
                      </div>
                      <span className="text-xs text-slate-700 bg-slate-200/80 dark:text-slate-300 dark:bg-blue-950/80 px-3 py-1 rounded-full border border-slate-200 dark:border-blue-900/40 font-bold">
                        {d.user_count ?? 0} user{(d.user_count ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

export default AdminDashboard;
