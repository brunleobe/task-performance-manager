// Reports Page — Monthly KPI Trends for Managers
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { format, parseISO } from 'date-fns';
import NotificationBell from '../components/NotificationBell';
import { ProfileModal } from '../components/ProfileModal';
import { ThemeToggle } from '../components/ThemeToggle';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { TrendsData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const STAFF_COLORS = [
  { border: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  { border: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
  { border: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { border: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
  { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
];

const chartBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#94a3b8',
        font: { family: 'Inter', size: 12, weight: '600' },
        usePointStyle: true,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: '#0b1329',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      borderColor: '#1e3a8a',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.06)' },
      ticks: { color: '#64748b', font: { family: 'Inter', size: 11, weight: '500' } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.06)' },
      ticks: { color: '#64748b', font: { family: 'Inter', size: 11, weight: '500' } },
    },
  },
};

const ReportsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<TrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getKpiTrends();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const buildLineData = () => {
    if (!data) return { labels: [], datasets: [] };

    const labels = data.periods.map(p => format(parseISO(`${p}-01`), 'MMM yyyy'));

    const byUser: Record<string, Record<string, number>> = {};
    data.records.forEach(r => {
      if (!byUser[r.user_name]) byUser[r.user_name] = {};
      byUser[r.user_name][r.period] = Number(r.kpi_score);
    });

    const datasets = Object.entries(byUser).map(([name, scores], i) => {
      const color = STAFF_COLORS[i % STAFF_COLORS.length];
      return {
        label: name,
        data: data.periods.map(p => scores[p] ?? null),
        borderColor: color.border,
        backgroundColor: color.bg,
        pointBackgroundColor: color.border,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        spanGaps: true,
      };
    });

    return { labels, datasets };
  };

  const buildBarData = () => {
    if (!data) return { labels: [], datasets: [] };
    const labels = data.periods.map(p => format(parseISO(`${p}-01`), 'MMM yyyy'));
    return {
      labels,
      datasets: [
        {
          label: 'Weight Completed',
          data: data.periods.map(p => data.monthlyTotals[p]?.completed ?? 0),
          backgroundColor: 'rgba(56,189,248,0.8)',
          borderColor: '#38bdf8',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'Weight Assigned',
          data: data.periods.map(p => data.monthlyTotals[p]?.assigned ?? 0),
          backgroundColor: 'rgba(37,99,235,0.4)',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  };

  const latestPeriod = data?.periods[data.periods.length - 1];
  const latestRecords = data?.records.filter(r => r.period === latestPeriod) ?? [];
  const avgKpi = latestRecords.length
    ? latestRecords.reduce((s, r) => s + Number(r.kpi_score), 0) / latestRecords.length
    : 0;
  const topPerformer = latestRecords.sort((a, b) => Number(b.kpi_score) - Number(a.kpi_score))[0];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0b1329] dark:text-white transition-colors">
      <header className="border-b border-slate-200/90 bg-white/90 dark:border-blue-900/40 dark:bg-[#0d1630]/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">TaskFlow</span>
              <span className="text-blue-600 dark:text-sky-400 text-xs ml-2 font-bold uppercase tracking-wider">KPI Reports</span>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            <Link to="/manager/dashboard"
              className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-blue-900/40 rounded-xl transition-all">
              Dashboard
            </Link>
            <Link to="/manager/reports"
              className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-blue-600 text-white dark:bg-blue-600/90 dark:text-white rounded-xl shadow-md shadow-blue-600/20 transition-all">
              Reports
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
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
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:border-blue-900/40 dark:hover:bg-blue-900/40 dark:hover:text-white border transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Performance Analytics & KPI Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Historical KPI score trends and workload delivery metrics over the last 6 months.</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
            ⚠️ {error} — Make sure your backend server is running.
          </div>
        )}

        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-xl bg-slate-200/60 dark:bg-blue-950/40 animate-pulse border border-slate-200 dark:border-blue-900/30" />
              ))}
            </div>
            <div className="h-80 rounded-2xl bg-slate-200/60 dark:bg-blue-950/40 animate-pulse border border-slate-200 dark:border-blue-900/30" />
            <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-blue-950/40 animate-pulse border border-slate-200 dark:border-blue-900/30" />
          </div>
        )}

        {data && !isLoading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Staff Tracked', value: new Set(data.records.map(r => r.user_id)).size, icon: '👥', color: 'text-sky-600 dark:text-sky-400' },
                { label: 'Avg KPI (this month)', value: `${avgKpi.toFixed(1)}%`, icon: '📊', color: avgKpi >= 80 ? 'text-emerald-600 dark:text-emerald-400' : avgKpi >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400' },
                { label: 'Top Performer', value: topPerformer?.user_name?.split(' ')[0] ?? '—', icon: '🏆', color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Months of Data', value: data.periods.filter(p => data.records.some(r => r.period === p)).length, icon: '📅', color: 'text-blue-600 dark:text-sky-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-xl p-4 animate-fade-in">
                  <p className="text-xl mb-1">{stat.icon}</p>
                  <p className={`text-xl font-extrabold tabular-nums ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {data.records.length === 0 ? (
              <div className="text-center py-24 bg-white border-slate-200 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-slate-700 dark:text-slate-300 font-bold">No KPI analytics data recorded yet</p>
                <p className="text-slate-500 text-sm mt-1 font-medium">Assign tasks to staff members and complete workload items to generate monthly trends.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl p-6">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    KPI Performance Trends — Per Staff Member
                  </h2>
                  <p className="text-xs text-slate-500 mb-6 font-medium">Monthly score trajectory (%) per individual over 6 months</p>
                  <div className="h-72">
                    <Line
                      data={buildLineData()}
                      options={{
                        ...chartBaseOptions,
                        plugins: {
                          ...chartBaseOptions.plugins,
                          title: { display: false },
                        },
                        scales: {
                          ...chartBaseOptions.scales,
                          y: {
                            ...chartBaseOptions.scales.y,
                            min: 0,
                            max: 100,
                            ticks: { color: '#64748b', callback: (v: any) => `${v}%` },
                          },
                        },
                      } as any}
                    />
                  </div>
                </div>

                <div className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl p-6">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Monthly Workload Weight — Assigned vs Completed
                  </h2>
                  <p className="text-xs text-slate-500 mb-6 font-medium">Total weight point volume across team per period</p>
                  <div className="h-60">
                    <Bar
                      data={buildBarData()}
                      options={chartBaseOptions as any}
                    />
                  </div>
                </div>

                <div className="bg-white border-slate-200/90 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 border rounded-2xl p-6">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    Current Month Breakdown
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 border-b border-slate-200 dark:border-blue-900/40">
                          <th className="text-left pb-3 pr-4 font-bold uppercase tracking-wider">Staff Member</th>
                          <th className="text-right pb-3 pr-4 font-bold uppercase tracking-wider">KPI Score</th>
                          <th className="text-right pb-3 pr-4 font-bold uppercase tracking-wider">Assigned</th>
                          <th className="text-right pb-3 pr-4 font-bold uppercase tracking-wider">Completed</th>
                          <th className="text-right pb-3 font-bold uppercase tracking-wider">On Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                        {latestRecords.sort((a, b) => Number(b.kpi_score) - Number(a.kpi_score)).map((r, i) => (
                          <tr key={r.user_id} className="hover:bg-slate-50 dark:hover:bg-blue-950/30 transition-colors">
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                <span className="text-slate-900 dark:text-white font-bold">{r.user_name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 pr-4 text-right">
                              <span className={`font-extrabold tabular-nums ${Number(r.kpi_score) >= 80 ? 'text-emerald-600 dark:text-emerald-400' : Number(r.kpi_score) >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {Number(r.kpi_score).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3.5 pr-4 text-right text-slate-600 dark:text-slate-400 tabular-nums font-semibold">{r.total_weight_assigned} pts</td>
                            <td className="py-3.5 pr-4 text-right text-slate-600 dark:text-slate-400 tabular-nums font-semibold">{r.total_weight_completed} pts</td>
                            <td className="py-3.5 text-right text-slate-600 dark:text-slate-400 tabular-nums font-semibold">{r.on_time_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

export default ReportsPage;

