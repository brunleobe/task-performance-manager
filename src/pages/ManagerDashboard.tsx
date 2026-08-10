// Manager Dashboard page with live DB API Integration
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LeaderBoard from '../components/LeaderBoard';
import TaskCard from '../components/TaskCard';
import WeightSelector from '../components/WeightSelector';
import { api } from '../services/api';
import { DEMO_TASKS, DEMO_KPI_LOGS, DEMO_USERS } from '../data/mockData';
import type { Task, KPILog, User, CreateTaskPayload } from '../types';
import { format, addDays } from 'date-fns';

const ManagerDashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [kpiLogs, setKpiLogs] = useState<KPILog[]>([]);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'tasks'>('create');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);

  const [form, setForm] = useState<CreateTaskPayload>({
    title: '',
    description: '',
    assigned_to: '',
    weight_points: 3,
    due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if the stored token is a real JWT
  const hasRealToken = token ? token.split('.').length === 3 : false;

  // Load tasks, leaderboard, and real staff list from backend
  const loadDashboardData = async () => {
    setIsLoading(true);

    if (!hasRealToken) {
      // Demo mode
      setTasks(DEMO_TASKS);
      setKpiLogs(DEMO_KPI_LOGS);
      setStaffMembers(DEMO_USERS.filter(u => u.role === 'staff') as User[]);
      setIsLiveMode(false);
      setIsLoading(false);
      return;
    }

    // Silently flag overdue tasks before fetching fresh data
    await api.checkOverdue();

    try {
      const [fetchedTasks, leaderboard, allUsers] = await Promise.all([
        api.getTasks(),
        api.getLeaderboard(),
        api.getAdminUsers(),
      ]);
      setTasks(fetchedTasks);
      setKpiLogs(leaderboard);
      setStaffMembers(allUsers.filter(u => u.role === 'staff'));
      setIsLiveMode(true);
    } catch (err: any) {
      // Network unreachable: fall back to demo data
      if (err instanceof TypeError) {
        setTasks(DEMO_TASKS);
        setKpiLogs(DEMO_KPI_LOGS);
        setStaffMembers(DEMO_USERS.filter(u => u.role === 'staff') as User[]);
        setIsLiveMode(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [hasRealToken]);

  // Handles task creation via backend API
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.assigned_to) { setFormError('Please select an assignee.'); return; }
    if (!form.title.trim()) { setFormError('Task title is required.'); return; }

    setIsSubmitting(true);

    const assignee = staffMembers.find(u => u.id === form.assigned_to);

    try {
      await api.createTask(form);
      setFormSuccess(`Task "${form.title.trim()}" assigned to ${assignee?.full_name}!`);
      await loadDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setForm({
        title: '',
        description: '',
        assigned_to: form.assigned_to,
        weight_points: 3,
        due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      });
      setIsSubmitting(false);
    }
  };

  // Triggers CSV download of monthly team KPI report
  const handleExport = async () => {
    try {
      await api.exportKpiReportCsv();
    } catch {
      const period = format(new Date(), 'yyyy-MM');
      const rows = [
        ['Rank', 'Name', 'KPI Score', 'Weight Assigned', 'Weight Completed', 'On-Time Tasks', 'Period'],
        ...[...kpiLogs]
          .sort((a, b) => b.kpi_score - a.kpi_score)
          .map((k, i) => [
            i + 1,
            k.user_name ?? 'N/A',
            `${k.kpi_score.toFixed(1)}%`,
            k.total_weight_assigned,
            k.total_weight_completed,
            k.on_time_count,
            k.period,
          ]),
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-kpi-${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const allTasksSorted = [...tasks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen bg-[#080c18] text-white">
      {/* Navigation Header */}
      <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-white">TaskFlow</span>
              <span className="text-slate-500 text-sm ml-2">Manager Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live / Demo mode badge */}
            <span className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
              isLiveMode
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isLiveMode ? 'Live DB' : 'Demo Mode'}
            </span>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.full_name}</p>
              <p className="text-xs text-slate-500">{format(new Date(), 'MMMM yyyy')}</p>
            </div>
            <button
              id="manager-logout-btn"
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
          <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Assign tasks, track team performance, and export reports.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Create Task Form & Task List Panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tab Controls — scrollable on mobile */}
            <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-full sm:w-fit overflow-x-auto">
              {(['create', 'tasks'] as const).map(tab => (
                <button
                  key={tab}
                  id={`tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab === 'create' ? '+ Create Task' : `All Tasks (${tasks.length})`}
                </button>
              ))}
            </div>

            {/* Create Task Tab */}
            {activeTab === 'create' && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 animate-fade-in">
                <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Assign New Task
                </h2>

                {formError && (
                  <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-slide-up flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Assignee</label>
                    <select
                      id="assignee-select"
                      value={form.assigned_to}
                      onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      disabled={isLoading}
                    >
                      <option value="" className="bg-[#0f1729]">
                        {isLoading ? 'Loading staff...' : staffMembers.length === 0 ? 'No staff accounts found' : 'Select staff member...'}
                      </option>
                      {staffMembers.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0f1729]">{s.full_name}</option>
                      ))}
                    </select>
                    {isLiveMode && staffMembers.length === 0 && !isLoading && (
                      <p className="text-xs text-amber-400 mt-1">
                        No staff accounts yet — create staff users in the Admin Dashboard first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Task Name</label>
                    <input
                      id="task-title-input"
                      type="text"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Refactor authentication module"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-sm
                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                    <textarea
                      id="task-description-input"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Detailed instructions for the task..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-sm resize-none
                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date</label>
                    <input
                      id="task-due-date-input"
                      type="date"
                      value={form.due_date}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all
                        [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Difficulty / Weight</label>
                    <WeightSelector
                      value={form.weight_points}
                      onChange={v => setForm(f => ({ ...f, weight_points: v }))}
                    />
                  </div>

                  <button
                    id="create-task-btn"
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white
                      bg-gradient-to-r from-purple-500 to-indigo-600
                      hover:from-purple-400 hover:to-indigo-500
                      shadow-lg shadow-purple-500/20
                      transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                      disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Assigning...
                      </span>
                    ) : '✦ Create & Assign Task'}
                  </button>
                </form>
              </div>
            )}

            {/* All Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-2 animate-fade-in">
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
                  ))
                ) : allTasksSorted.length === 0 ? (
                  <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                    <p className="text-sm text-slate-500">No tasks created yet</p>
                    <p className="text-xs text-slate-600 mt-1">Switch to Create Task to assign the first task</p>
                  </div>
                ) : (
                  allTasksSorted.map((task, i) => (
                    <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <TaskCard task={task} showAssignee />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Leaderboard & Stats Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Team KPI Leaderboard
              </h2>
              <span className="text-xs text-slate-500 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06]">
                {format(new Date(), 'MMM yyyy')}
              </span>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />
                  ))}
                </div>
              ) : kpiLogs.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-2xl mb-2">📊</p>
                  <p className="text-sm text-slate-500">No KPI data yet</p>
                  <p className="text-xs text-slate-600 mt-1">KPI scores appear after tasks are assigned & completed</p>
                </div>
              ) : (
                <LeaderBoard entries={kpiLogs} />
              )}

              <div className="mt-5 pt-5 border-t border-white/[0.06]">
                <button
                  id="export-report-btn"
                  onClick={handleExport}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-300
                    border border-white/[0.08] bg-white/[0.02]
                    hover:bg-white/[0.06] hover:border-white/20 hover:text-white
                    transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Monthly Report (CSV)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Staff',  value: staffMembers.length, icon: '👥' },
                { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'completed').length, icon: '📋' },
                { label: 'Completed',    value: tasks.filter(t => t.status === 'completed').length, icon: '✅' },
                { label: 'Overdue',      value: tasks.filter(t => t.status === 'overdue').length, icon: '⚠️' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center animate-fade-in">
                  <p className="text-lg">{stat.icon}</p>
                  <p className="text-xl font-bold text-white tabular-nums mt-0.5">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
