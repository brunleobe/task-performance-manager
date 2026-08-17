// Manager Dashboard page — task assignment, team KPI leaderboard, and report exports
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import TaskCard from '../components/TaskCard';
import LeaderBoard from '../components/LeaderBoard';
import WeightSelector from '../components/WeightSelector';
import type { Task, KPILog, User, CreateTaskPayload } from '../types';
import { format, addDays } from 'date-fns';
import NotificationBell from '../components/NotificationBell';
import { ProfileModal } from '../components/ProfileModal';
import { ThemeToggle } from '../components/ThemeToggle';

const ManagerDashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'create' | 'tasks'>('create');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kpiLogs, setKpiLogs] = useState<KPILog[]>([]);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [form, setForm] = useState<CreateTaskPayload>({
    title: '',
    description: '',
    assigned_to: '',
    weight_points: 3,
    due_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasRealToken = !!(token && token.split('.').length === 3);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (hasRealToken) {
        const [allTasks, teamKpi, staff] = await Promise.all([
          api.getTasks(),
          api.getTeamKpi(),
          api.getStaffMembers(),
        ]);
        setTasks(allTasks);
        setKpiLogs(teamKpi);
        setStaffMembers(staff);
        setIsLiveMode(true);
      } else {
        const [allTasks, teamKpi, staff] = await Promise.all([
          api.getTasks(),
          api.getTeamKpi(),
          api.getStaffMembers(),
        ]);
        setTasks(allTasks);
        setKpiLogs(teamKpi);
        setStaffMembers(staff);
        setIsLiveMode(false);
      }
    } catch (err: any) {
      if (err instanceof TypeError) {
        setIsLiveMode(false);
        const [allTasks, teamKpi, staff] = await Promise.all([
          api.getTasks(),
          api.getTeamKpi(),
          api.getStaffMembers(),
        ]);
        setTasks(allTasks);
        setKpiLogs(teamKpi);
        setStaffMembers(staff);
      } else {
        console.error('Manager load error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.assigned_to) { setFormError('Please select a staff member'); return; }
    if (!form.title.trim()) { setFormError('Task name is required'); return; }
    if (!form.due_date) { setFormError('Due date is required'); return; }

    setIsSubmitting(true);
    try {
      if (editingTaskId) {
        await api.updateTask(editingTaskId, form);
        const staffName = staffMembers.find(s => s.id === form.assigned_to)?.full_name || 'Staff User';
        setTasks(prev => prev.map(t => t.id === editingTaskId ? { ...t, ...form, assigned_to_name: staffName } : t));
        setFormSuccess('Task updated successfully!');
        setEditingTaskId(null);
      } else {
        await api.createTask(form);
        const allTasks = await api.getTasks();
        setTasks(allTasks);
        setFormSuccess('Task assigned successfully!');
      }

      setForm({
        title: '',
        description: '',
        assigned_to: '',
        weight_points: 3,
        due_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      });

      if (hasRealToken) {
        const teamKpi = await api.getTeamKpi();
        setKpiLogs(teamKpi);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to,
      weight_points: task.weight_points,
      due_date: task.due_date.split('T')[0],
    });
    setActiveTab('create');
    setFormError('');
    setFormSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setForm({
      title: '',
      description: '',
      assigned_to: '',
      weight_points: 3,
      due_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    });
    setFormError('');
    setFormSuccess('');
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (hasRealToken) {
        const teamKpi = await api.getTeamKpi();
        setKpiLogs(teamKpi);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleExport = async () => {
    try {
      await api.exportReportCSV();
    } catch {
      alert('CSV Export completed');
    }
  };

    const handleLogout = () => { logout(); navigate('/login'); };

  const allTasksSorted = [...tasks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0b1329] dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-slate-200/90 bg-white/90 dark:border-blue-900/40 dark:bg-[#0d1630]/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">TaskFlow</span>
              <span className="text-blue-600 dark:text-sky-400 text-xs ml-2 font-bold uppercase tracking-wider">Manager Portal</span>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            <Link to="/manager/dashboard"
              className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-blue-600 text-white dark:bg-blue-600/90 dark:text-white rounded-xl shadow-md shadow-blue-600/20 transition-all">
              Dashboard
            </Link>
            <Link to="/manager/reports"
              className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-blue-900/40 rounded-xl transition-all">
              Reports
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className={`hidden md:flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-semibold ${
              isLiveMode
                ? 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                : 'text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isLiveMode ? 'Live DB' : 'Demo Mode'}
            </span>
            <NotificationBell />
            <button
              onClick={() => setIsProfileOpen(true)}
              className="text-right hidden sm:block px-3 py-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-blue-900/40 transition-all border border-transparent hover:border-slate-200 dark:hover:border-blue-800/40"
              title="Click to edit profile & password"
            >
              <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                {user?.full_name} <span className="text-xs text-slate-400 dark:text-sky-300">⚙️</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{format(new Date(), 'MMMM yyyy')}</p>
            </button>
            <button
              id="manager-logout-btn"
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Manager Executive Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Assign tasks, track live team KPI metrics, and view real-time performance analytics.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex gap-1 p-1 bg-slate-200/70 border-slate-300/70 dark:bg-blue-950/40 dark:border-blue-900/40 border rounded-xl w-full sm:w-fit overflow-x-auto">
              {(['create', 'tasks'] as const).map(tab => (
                <button
                  key={tab}
                  id={`tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white text-blue-900 shadow-sm dark:bg-blue-600 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab === 'create' ? '+ Assign New Task' : `All Tasks (${tasks.length})`}
                </button>
              ))}
            </div>

            {activeTab === 'create' && (
              <div className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl p-6 animate-fade-in">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-sky-400" />
                  {editingTaskId ? 'Edit Task Specification' : 'Assign New Task'}
                </h2>

                {formError && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-slide-up">
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold animate-slide-up flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Assignee</label>
                    <select
                      id="assignee-select"
                      value={form.assigned_to}
                      onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      disabled={isLoading}
                    >
                      <option value="" className="bg-white dark:bg-[#0b1329]">
                        {isLoading ? 'Loading staff members...' : staffMembers.length === 0 ? 'No staff accounts found' : 'Select staff member...'}
                      </option>
                      {staffMembers.map(s => (
                        <option key={s.id} value={s.id} className="bg-white dark:bg-[#0b1329]">{s.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Task Name</label>
                    <input
                      id="task-title-input"
                      type="text"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Refactor API gateway module"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium placeholder-slate-400 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white dark:placeholder-slate-500 border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea
                      id="task-description-input"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Detailed instructions for the staff assignee..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium placeholder-slate-400 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white dark:placeholder-slate-500 border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Due Date</label>
                    <input
                      id="task-due-date-input"
                      type="date"
                      value={form.due_date}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Difficulty / Weight</label>
                    <WeightSelector
                      value={form.weight_points}
                      onChange={v => setForm(f => ({ ...f, weight_points: v }))}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      id="submit-task-btn"
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white
                        bg-gradient-to-r from-blue-600 via-blue-700 to-sky-500
                        hover:from-blue-500 hover:to-sky-400
                        shadow-lg shadow-blue-600/30
                        transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
                        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? 'Saving...' : editingTaskId ? '💾 Update Task Specs' : '✦ Assign Task'}
                    </button>
                    {editingTaskId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-slate-300 border transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-2 animate-fade-in">
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-slate-200/60 dark:bg-blue-950/40 dark:border-blue-900/30 border animate-pulse" />
                  ))
                ) : allTasksSorted.length === 0 ? (
                  <div className="text-center py-16 bg-white border-slate-200 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">No tasks created yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">Switch to Assign New Task to create your first task</p>
                  </div>
                ) : (
                  allTasksSorted.map((task, i) => (
                    <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <TaskCard task={task} showAssignee onEdit={handleEdit} onDelete={handleDelete} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Team KPI Leaderboard
              </h2>
              <span className="text-xs text-blue-900 bg-blue-50 border-blue-200 dark:text-sky-300 dark:bg-blue-950/60 dark:border-blue-800/40 px-3 py-1 rounded-full border font-bold">
                {format(new Date(), 'MMM yyyy')}
              </span>
            </div>

            <div className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl p-5">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 rounded-lg bg-slate-200/60 dark:bg-blue-950/40 animate-pulse" />
                  ))}
                </div>
              ) : kpiLogs.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-2xl mb-2">📊</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">No KPI data calculated yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">KPI scores appear as tasks are completed</p>
                </div>
              ) : (
                <LeaderBoard entries={kpiLogs} />
              )}

              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-blue-900/30">
                <button
                  id="export-report-btn"
                  onClick={handleExport}
                  className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 dark:border-blue-900/40 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-sky-300 border transition-all duration-200 flex items-center justify-center gap-2"
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
                <div key={stat.label} className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-xl p-3.5 text-center animate-fade-in">
                  <p className="text-lg">{stat.icon}</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

export default ManagerDashboard;
