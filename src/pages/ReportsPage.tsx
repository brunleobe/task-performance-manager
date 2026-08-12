// Reports Page — Monthly KPI Trends for Managers
// Uses react-chartjs-2 + chart.js for line/bar charts
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { format, parseISO } from 'date-fns';
import NotificationBell from '../components/NotificationBell';

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

// Distinct colours for each staff member on the line chart
const STAFF_COLORS = [
  { border: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
  { border: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  { border: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { border: '#f472b6', bg: 'rgba(244,114,182,0.08)' },
];

interface TrendRecord {
  period: string;
  user_name: string;
  user_id: string;
  kpi_score: number;
  total_weight_assigned: number;
  total_weight_completed: number;
  on_time_count: number;
}

interface TrendsData {
  periods: string[];
  records: TrendRecord[];
  monthlyTotals: Record<string, { completed: number; assigned: number }>;
}

const chartBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { size: 12 }, padding: 16 },
    },
    tooltip: {
      backgroundColor: '#0d1626',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#94a3b8',
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b' },
      grid: { color: 'rgba(255,255,255,0.04)' },
    },
    y: {
      ticks: { color: '#64748b' },
      grid: { color: 'rgba(255,255,255,0.04)' },
    },
  },
};

const ReportsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<TrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Build per-staff line chart datasets
  const buildLineData = () => {
    if (!data) return { labels: [], datasets: [] };

    const labels = data.periods.map(p => format(parseISO(`${p}-01`), 'MMM yyyy'));

    // Group records by user
    const byUser: Record<string, Record<string, number>> = {};
    data.records.forEach(r => {
      if (!byUser[r.user_name]) byUser[r.user_name] = {};
      byUser[r.user_name][r.period] = r.kpi_score;
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

  // Build monthly totals bar chart
  const buildBarData = () => {
    if (!data) return { labels: [], datasets: [] };
    const labels = data.periods.map(p => format(parseISO(`${p}-01`), 'MMM yyyy'));
    return {
      labels,
      datasets: [
        {
          label: 'Weight Completed',
          data: data.periods.map(p => data.monthlyTotals[p]?.completed ?? 0),
          backgroundColor: 'rgba(6,182,212,0.7)',
          borderColor: '#06b6d4',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'Weight Assigned',
          data: data.periods.map(p => data.monthlyTotals[p]?.assigned ?? 0),
          backgroundColor: 'rgba(167,139,250,0.4)',
          borderColor: '#a78bfa',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  };

  // Summary stats from latest period
  const latestPeriod = data?.periods[data.periods.length - 1];
  const latestRecords = data?.records.filter(r => r.period === latestPeriod) ?? [];
  const avgKpi = latestRecords.length
    ? latestRecords.reduce((s, r) => s + r.kpi_score, 0) / latestRecords.length
    : 0;
  const topPerformer = latestRecords.sort((a, b) => b.kpi_score - a.kpi_score)[0];

  return (
    <div className="min-h-screen bg-[#080c18] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-white">TaskFlow</span>
              <span className="text-slate-500 text-sm ml-2">Reports</span>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            <Link to="/manager/dashboard"
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all">
              Dashboard
            </Link>
            <Link to="/manager/reports"
              className="px-3 py-1.5 text-sm text-white rounded-lg bg-white/[0.08] transition-all">
              Reports
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.full_name}</p>
              <p className="text-xs text-slate-500">{format(new Date(), 'MMMM yyyy')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-white/[0.06] hover:bg-white/[0.05] hover:text-white transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">KPI Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Team performance trends over the last 6 months.</p>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            ⚠️ {error} — Make sure your backend server is running.
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.06]" />
              ))}
            </div>
            <div className="h-80 rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.06]" />
            <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.06]" />
          </div>
        )}

        {data && !isLoading && (
          <>
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Staff Tracked', value: new Set(data.records.map(r => r.user_id)).size, icon: '👥', color: 'text-cyan-400' },
                { label: 'Avg KPI (this month)', value: `${avgKpi.toFixed(1)}%`, icon: '📊', color: avgKpi >= 80 ? 'text-emerald-400' : avgKpi >= 60 ? 'text-amber-400' : 'text-red-400' },
                { label: 'Top Performer', value: topPerformer?.user_name?.split(' ')[0] ?? '—', icon: '🏆', color: 'text-yellow-400' },
                { label: 'Months of Data', value: data.periods.filter(p => data.records.some(r => r.period === p)).length, icon: '📅', color: 'text-purple-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 animate-fade-in">
                  <p className="text-xl mb-1">{stat.icon}</p>
                  <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* No data empty state */}
            {data.records.length === 0 ? (
              <div className="text-center py-24 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-slate-400 font-medium">No KPI data yet</p>
                <p className="text-slate-600 text-sm mt-1">Assign tasks to staff and let them complete tasks to generate KPI data.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Line chart — KPI score per staff member over time */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    KPI Score Trends — Per Staff Member
                  </h2>
                  <p className="text-xs text-slate-500 mb-6">Monthly KPI score (%) for each team member over the last 6 months</p>
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

                {/* Bar chart — Weight assigned vs completed per month */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Monthly Task Weight — Assigned vs Completed
                  </h2>
                  <p className="text-xs text-slate-500 mb-6">Total task weight points across all staff per month</p>
                  <div className="h-60">
                    <Bar
                      data={buildBarData()}
                      options={chartBaseOptions as any}
                    />
                  </div>
                </div>

                {/* Data table — individual scores this month */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    This Month — Detailed Breakdown
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 border-b border-white/[0.06]">
                          <th className="text-left pb-3 pr-4 font-medium">Staff Member</th>
                          <th className="text-right pb-3 pr-4 font-medium">KPI Score</th>
                          <th className="text-right pb-3 pr-4 font-medium">Assigned</th>
                          <th className="text-right pb-3 pr-4 font-medium">Completed</th>
                          <th className="text-right pb-3 font-medium">On Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {latestRecords.sort((a, b) => b.kpi_score - a.kpi_score).map((r, i) => (
                          <tr key={r.user_id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                <span className="text-white font-medium">{r.user_name}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <span className={`font-bold tabular-nums ${r.kpi_score >= 80 ? 'text-emerald-400' : r.kpi_score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                {r.kpi_score.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right text-slate-400 tabular-nums">{r.total_weight_assigned} pts</td>
                            <td className="py-3 pr-4 text-right text-slate-400 tabular-nums">{r.total_weight_completed} pts</td>
                            <td className="py-3 text-right text-slate-400 tabular-nums">{r.on_time_count}</td>
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
    </div>
  );
};

export default ReportsPage;
