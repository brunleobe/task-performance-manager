// Manager Dashboard page with API Integration
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LeaderBoard from '../components/LeaderBoard';
import TaskCard from '../components/TaskCard';
import WeightSelector from '../components/WeightSelector';
import { api } from '../services/api';
import { DEMO_TASKS, DEMO_KPI_LOGS, DEMO_USERS } from '../data/mockData';
import type { Task, KPILog, CreateTaskPayload } from '../types';
import { format, addDays } from 'date-fns';

const ManagerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const staffMembers = DEMO_USERS.filter(u => u.role === 'staff');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [kpiLogs, setKpiLogs] = useState<KPILog[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'tasks'>('create');

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

  // Fetch tasks and team leaderboard from backend API on mount
  const loadDashboardData = async () => {
    try {
      const [fetchedTasks, leaderboard] = await Promise.all([
        api.getTasks(),
        api.getLeaderboard(),
      ]);
      setTasks(fetchedTasks);
      setKpiLogs(leaderboard);
    } catch {
      // Fallback to demo data if backend server is offline
      setTasks(DEMO_TASKS);
      setKpiLogs(DEMO_KPI_LOGS);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

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
      // Fallback local update if API is unreachable
      const newTask: Task = {
        id: `t${Date.now()}`,
        title: form.title.trim(),
        description: form.description.trim(),
        assigned_to: form.assigned_to,
        assigned_to_name: assignee?.full_name,
        created_by: user?.id ?? 'u1',
        weight_points: form.weight_points,
        status: 'pending',
        due_date: new Date(form.due_date).toISOString(),
        completed_at: null,
        created_at: new Date().toISOString(),
      };

      setTasks(prev => [newTask, ...prev]);
      setFormSuccess(`Task "${newTask.title}" assigned to ${assignee?.full_name}!`);
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

          <div className="flex items-center gap-4">
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
            {/* Tab Controls */}
            <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
              {(['create', 'tasks'] as const).map(tab => (
                <button
                  key={tab}
                  id={`tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                    >
                      <option value="" className="bg-[#0f1729]">Select staff member...</option>
                      {staffMembers.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0f1729]">{s.full_name}</option>
                      ))}
                    </select>
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
                    disabled={isSubmitting}
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
                {allTasksSorted.map((task, i) => (
                  <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <TaskCard task={task} showAssignee />
                  </div>
                ))}
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
              <LeaderBoard entries={kpiLogs} />

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
                { label: 'Total Staff',   value: staffMembers.length, icon: '👥' },
                { label: 'Active Tasks',  value: tasks.filter(t => t.status !== 'completed').length, icon: '📋' },
                { label: 'Completed',     value: tasks.filter(t => t.status === 'completed').length, icon: '✅' },
                { label: 'Overdue',       value: tasks.filter(t => t.status === 'overdue').length, icon: '⚠️' },
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
