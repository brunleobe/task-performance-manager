// Staff Dashboard page — task checklist and personal KPI metrics
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import TaskCard from '../components/TaskCard';
import KPIRing from '../components/KPIRing';
import type { Task } from '../types';
import { format } from 'date-fns';
import NotificationBell from '../components/NotificationBell';
import { ProfileModal } from '../components/ProfileModal';
import { ThemeToggle } from '../components/ThemeToggle';

const StaffDashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [kpiScore, setKpiScore] = useState<number>(0);
  const [kpiData, setKpiData] = useState({
    total_weight_assigned: 0,
    total_weight_completed: 0,
    on_time_count: 0,
    kpi_score: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRealToken = !!(token && token.split('.').length === 3);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (hasRealToken) {
        const [myTasks, summary] = await Promise.all([
          api.getMyTasks(),
          api.getMySummary(),
        ]);

        setTasks(myTasks);
        setKpiScore(summary.kpi_score);
        setKpiData({
          total_weight_assigned: summary.total_weight_assigned,
          total_weight_completed: summary.total_weight_completed,
          on_time_count: summary.on_time_count,
          kpi_score: summary.kpi_score,
        });
        setIsLiveMode(true);
      } else {
        const mockTasks = await api.getMyTasks();
        setTasks(mockTasks);
        recalculateKPI(mockTasks);
        setIsLiveMode(false);
      }
    } catch (err: any) {
      if (err instanceof TypeError) {
        setIsLiveMode(false);
        const mockTasks = await api.getMyTasks();
        setTasks(mockTasks);
        recalculateKPI(mockTasks);
      } else {
        setError(err.message || 'Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const recalculateKPI = (taskList: Task[]) => {
    const totalAssigned = taskList.reduce((acc, t) => acc + t.weight_points, 0);
    const completedTasks = taskList.filter(t => t.status === 'completed');
    const totalCompleted = completedTasks.reduce((acc, t) => acc + t.weight_points, 0);

    const onTime = completedTasks.filter(t => {
      if (!t.completed_at) return false;
      return new Date(t.completed_at) <= new Date(t.due_date);
    }).length;

    const completionRate = totalAssigned > 0 ? totalCompleted / totalAssigned : 0;
    const totalCompletedCount = completedTasks.length;
    const timelinessRate = totalCompletedCount > 0 ? onTime / totalCompletedCount : 1;

    const score = totalAssigned === 0 ? 0 : Math.round((completionRate * 0.7 + timelinessRate * 0.3) * 100 * 10) / 10;

    setKpiScore(Math.min(100, Math.round(score * 10) / 10));
    setKpiData(prev => ({
      ...prev,
      total_weight_assigned: totalAssigned,
      total_weight_completed: totalCompleted,
      on_time_count: onTime,
      kpi_score: score,
    }));
  };

  const handleComplete = async (taskId: string) => {
    const now = new Date().toISOString();
    const updated = tasks.map(t =>
      t.id === taskId ? { ...t, status: 'completed' as const, completed_at: now } : t
    );

    setTasks(updated);
    recalculateKPI(updated);

    try {
      await api.completeTask(taskId);
      if (hasRealToken) {
        const summary = await api.getMySummary();
        setKpiScore(summary.kpi_score);
        setKpiData({
          total_weight_assigned: summary.total_weight_assigned,
          total_weight_completed: summary.total_weight_completed,
          on_time_count: summary.on_time_count,
          kpi_score: summary.kpi_score,
        });
      }
    } catch {
      // Optimistic update
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const onTimeRate = kpiData.total_weight_completed > 0
    ? Math.round((kpiData.on_time_count / Math.max(1, tasks.filter(t => t.status === 'completed').length)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-white transition-colors">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white/80 dark:border-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">TaskFlow</span>
              <span className="text-slate-500 text-sm ml-2 font-medium">Staff Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <span className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
              isLiveMode
                ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                : 'text-amber-600 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isLiveMode ? 'Live DB' : 'Demo Mode'}
            </span>
            <NotificationBell />
            <button
              onClick={() => setIsProfileOpen(true)}
              className="text-right hidden sm:block px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
              title="Click to edit profile & password"
            >
              <p className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-1.5">
                {user?.full_name} <span className="text-xs text-slate-500 dark:text-slate-400">⚙️</span>
              </p>
              <p className="text-xs text-slate-500 font-medium">{format(new Date(), 'MMMM yyyy')}</p>
            </button>
            <button
              id="staff-logout-btn"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:border-white/[0.06] dark:hover:bg-white/[0.05] dark:hover:text-white border transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Welcome back, {user?.full_name?.split(' ')[0]}. Here's your task overview.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Task Checklist */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                My Tasks
              </h2>
              <span className="text-xs text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-white/[0.04] dark:border-white/[0.06] px-3 py-1 rounded-full border font-medium">
                {completedCount}/{totalCount} done
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-slate-100 border-slate-200 dark:bg-white/[0.03] dark:border-white/[0.06] border animate-pulse" />
                ))}
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="text-center py-16 bg-white border-slate-200 shadow-sm dark:bg-white/[0.02] dark:border-white/[0.06] border rounded-2xl">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-20 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-slate-500">No tasks assigned to you yet</p>
                <p className="text-xs text-slate-400 mt-1">Ask your manager to assign you a task</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <TaskCard
                      task={task}
                      onComplete={task.status !== 'completed' ? handleComplete : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KPI Performance Section */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              My KPI Performance
            </h2>

            <div className="bg-white border-slate-200 shadow-sm dark:bg-white/[0.03] dark:border-white/[0.08] border rounded-2xl p-6 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-white/[0.04] dark:border-white/[0.06] px-3 py-1 rounded-full border font-medium">
                  {format(new Date(), 'MMMM yyyy')}
                </span>
              </div>

              <div className="flex justify-center">
                <KPIRing percentage={kpiScore} size={180} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border-slate-200 dark:bg-white/[0.03] dark:border-white/[0.06] border rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{completedCount}/{totalCount}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Tasks Done</p>
                </div>

                <div className="bg-slate-50 border-slate-200 dark:bg-white/[0.03] dark:border-white/[0.06] border rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{onTimeRate}%</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">On-Time Rate</p>
                </div>

                <div className="bg-slate-50 border-slate-200 dark:bg-white/[0.03] dark:border-white/[0.06] border rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{kpiData.total_weight_completed}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Points Earned</p>
                </div>

                <div className="bg-slate-50 border-slate-200 dark:bg-white/[0.03] dark:border-white/[0.06] border rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{kpiData.total_weight_assigned}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Points Assigned</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                  <span>Task Completion</span>
                  <span>{completedCount}/{totalCount}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

export default StaffDashboard;
