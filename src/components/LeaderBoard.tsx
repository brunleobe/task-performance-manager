// Team KPI Leaderboard component
import React, { useEffect, useRef } from 'react';
import type { KPILog } from '../types';

interface LeaderBoardProps {
  entries: KPILog[];
}

const getRankBadge = (rank: number) => {
  if (rank === 1) return { emoji: '🥇', color: 'text-amber-500' };
  if (rank === 2) return { emoji: '🥈', color: 'text-slate-500 dark:text-slate-300' };
  if (rank === 3) return { emoji: '🥉', color: 'text-amber-700 dark:text-amber-600' };
  return { emoji: `#${rank}`, color: 'text-slate-400 dark:text-slate-500' };
};

const getBarColor = (score: number) => {
  if (score >= 80) return 'from-blue-600 to-sky-400';
  if (score >= 60) return 'from-amber-500 to-sky-500';
  return 'from-rose-500 to-orange-400';
};

const LeaderBoard: React.FC<LeaderBoardProps> = ({ entries }) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sorted = [...entries].sort((a, b) => Number(b.kpi_score) - Number(a.kpi_score));

  useEffect(() => {
    sorted.forEach((entry, i) => {
      const bar = barRefs.current[i];
      if (!bar) return;

      bar.style.width = '0%';
      const delay = 200 + i * 120;

      setTimeout(() => {
        bar.style.transition = 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        bar.style.width = `${Number(entry.kpi_score)}%`;
      }, delay);
    });
  }, [entries]);

  return (
    <div className="space-y-3">
      {sorted.map((entry, index) => {
        const rank = getRankBadge(index + 1);
        const barColor = getBarColor(Number(entry.kpi_score));

        return (
          <div
            key={entry.user_id}
            className="group p-3.5 rounded-xl border bg-slate-50 border-slate-200/90 hover:bg-slate-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:hover:border-blue-700/50 transition-all duration-200 animate-slide-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${rank.color}`}>{rank.emoji}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{entry.user_name ?? 'Staff Member'}</span>
              </div>
              <span className="text-sm font-bold text-blue-950 dark:text-sky-300 tabular-nums">
                {Number(entry.kpi_score).toFixed(1)}%
              </span>
            </div>

            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-blue-950/80 overflow-hidden">
              <div
                ref={el => { barRefs.current[index] = el; }}
                className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              <span>{entry.total_weight_completed}/{entry.total_weight_assigned} pts completed</span>
              <span>{entry.on_time_count} on-time</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeaderBoard;

