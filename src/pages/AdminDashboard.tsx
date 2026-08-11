// Admin Dashboard Page for User and Department Management
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { User, Department, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockData';
import NotificationBell from '../components/NotificationBell';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'departments'>('users');

  // User form state
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
    department_id: 'd1',
  });
  const [userFormError, setUserFormError] = useState('');
  const [userFormSuccess, setUserFormSuccess] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Department form state
  const [deptFormName, setDeptFormName] = useState('');
  const [deptFormError, setDeptFormError] = useState('');
  const [deptFormSuccess, setDeptFormSuccess] = useState('');
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);

  // Fetch users and departments from backend API
  const loadAdminData = async () => {
    try {
      const [fetchedUsers, fetchedDepts] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminDepartments(),
      ]);
      setUsers(fetchedUsers);
      setDepartments(fetchedDepts);
    } catch {
      // Fallback demo data if API is offline
      setUsers(DEMO_USERS);
      setDepartments([{ id: 'd1', name: 'Engineering' }]);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handle user account creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    setUserFormSuccess('');

    if (!userForm.full_name.trim()) { setUserFormError('Full name is required.'); return; }
    if (!userForm.email.trim()) { setUserFormError('Email address is required.'); return; }
    if (!userForm.password || userForm.password.length < 6) {
      setUserFormError('Password must be at least 6 characters.'); return;
    }

    setIsSubmittingUser(true);

    try {
      await api.createAdminUser(userForm);
      setUserFormSuccess(`Account created successfully for ${userForm.full_name}!`);
      await loadAdminData();
      setUserForm({ full_name: '', email: '', password: '', role: 'staff', department_id: userForm.department_id });
    } catch (err: any) {
      setUserFormError(err.message || 'Failed to create user account.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Handle department creation
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptFormError('');
    setDeptFormSuccess('');

    if (!deptFormName.trim()) { setDeptFormError('Department name is required.'); return; }

    setIsSubmittingDept(true);

    try {
      await api.createAdminDepartment(deptFormName.trim());
      setDeptFormSuccess(`Department "${deptFormName.trim()}" created successfully!`);
      setDeptFormName('');
      await loadAdminData();
    } catch (err: any) {
      setDeptFormError(err.message || 'Failed to create department.');
    } finally {
      setIsSubmittingDept(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // Role badge helper
  const getRoleBadge = (role: UserRole) => {
    if (role === 'admin') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (role === 'manager') return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  };

  return (
    <div className="min-h-screen bg-[#080c18] text-white">
      {/* Navigation Header */}
      <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-white">TaskFlow</span>
              <span className="text-slate-500 text-sm ml-2">Admin Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.full_name}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold border border-red-500/30">
                System Admin
              </span>
            </div>
            <NotificationBell />
            <button
              id="admin-logout-btn"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-white/[0.06] hover:bg-white/[0.05] hover:text-white transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Manage organization user accounts, roles, and department structures.</p>
        </div>

        {/* Top Summary Stat Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: users.length, icon: '👥' },
            { label: 'Staff Accounts', value: users.filter(u => u.role === 'staff').length, icon: '💼' },
            { label: 'Managers', value: users.filter(u => u.role === 'manager').length, icon: '👔' },
            { label: 'Departments', value: departments.length, icon: '🏢' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center animate-fade-in">
              <p className="text-2xl">{stat.icon}</p>
              <p className="text-2xl font-bold text-white tabular-nums mt-1">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tab Controls — scrollable on mobile */}
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-full sm:w-fit overflow-x-auto mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            👥 User Management ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'departments' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🏢 Departments ({departments.length})
          </button>
        </div>

        {/* Tab 1: User Management */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Create User Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 animate-fade-in">
                <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Create User Account
                </h2>

                {userFormError && (
                  <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
                    {userFormError}
                  </div>
                )}
                {userFormSuccess && (
                  <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-slide-up flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {userFormSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={userForm.full_name}
                      onChange={e => setUserForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="e.g. Michael Scott"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="user@company.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Assigned Role</label>
                    <select
                      value={userForm.role}
                      onChange={e => setUserForm(f => ({ ...f, role: e.target.value as UserRole }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                      <option value="staff" className="bg-[#0f1729]">💼 Staff (Task Worker)</option>
                      <option value="manager" className="bg-[#0f1729]">👔 Manager (Task Assignee)</option>
                      <option value="admin" className="bg-[#0f1729]">👑 System Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                    <select
                      value={userForm.department_id}
                      onChange={e => setUserForm(f => ({ ...f, department_id: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id} className="bg-[#0f1729]">{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 shadow-lg shadow-red-500/20 transition-all disabled:opacity-60"
                  >
                    {isSubmittingUser ? 'Creating...' : '+ Create Account'}
                  </button>
                </form>
              </div>
            </div>

            {/* Users List Table */}
            <div className="lg:col-span-3">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-4">All User Accounts</h2>
                <div className="space-y-2">
                  {users.map(u => (
                    <div
                      key={u.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-white truncate">{u.full_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <span className="text-xs text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-md">
                          {u.department_name ?? 'Engineering'}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getRoleBadge(u.role)}`}>
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
            {/* Create Dept Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 animate-fade-in">
                <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  Add New Department
                </h2>

                {deptFormError && (
                  <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
                    {deptFormError}
                  </div>
                )}
                {deptFormSuccess && (
                  <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-slide-up">
                    {deptFormSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateDept} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Department Name</label>
                    <input
                      type="text"
                      value={deptFormName}
                      onChange={e => setDeptFormName(e.target.value)}
                      placeholder="e.g. Product Design"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingDept}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 shadow-lg shadow-pink-500/20 transition-all disabled:opacity-60"
                  >
                    {isSubmittingDept ? 'Creating...' : '+ Create Department'}
                  </button>
                </form>
              </div>
            </div>

            {/* Department List */}
            <div className="lg:col-span-3">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-4">Organization Departments</h2>
                <div className="space-y-2">
                  {departments.map(d => (
                    <div
                      key={d.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🏢</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-white truncate">{d.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">ID: {d.id}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06] self-start sm:self-auto flex-shrink-0">
                        {(d as any).user_count ?? users.filter(u => u.department_id === d.id).length} members
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
