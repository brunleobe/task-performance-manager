// Team KPI Leaderboard component
import React, { useEffect, useRef } from 'react';
import type { KPILog } from '../types';

interface LeaderBoardProps {
  entries: KPILog[];
}

// Rank badge helper
const getRankBadge = (rank: number) => {
  if (rank === 1) return { emoji: '🥇', color: 'text-amber-500' };
  if (rank === 2) return { emoji: '🥈', color: 'text-slate-600 dark:text-slate-300' };
  if (rank === 3) return { emoji: '🥉', color: 'text-amber-700' };
  return { emoji: `#${rank}`, color: 'text-slate-400 dark:text-slate-500' };
};

// Bar gradient helper
const getBarColor = (score: number) => {
  if (score >= 80) return 'from-cyan-500 to-blue-500';
  if (score >= 60) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-pink-500';
};

const LeaderBoard: React.FC<LeaderBoardProps> = ({ entries }) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sorted = [...entries].sort((a, b) => b.kpi_score - a.kpi_score);

  // Staggered width animation for progress bars
  useEffect(() => {
    sorted.forEach((entry, i) => {
      const bar = barRefs.current[i];
      if (!bar) return;

      bar.style.width = '0%';
      const delay = 200 + i * 120;

      setTimeout(() => {
        bar.style.transition = 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        bar.style.width = `${entry.kpi_score}%`;
      }, delay);
    });
  }, [entries]);

  return (
    <div className="space-y-3">
      {sorted.map((entry, index) => {
        const rank = getRankBadge(index + 1);
        const barColor = getBarColor(entry.kpi_score);

        return (
          <div
            key={entry.user_id}
            className="group p-3.5 rounded-xl border bg-slate-50 border-slate-200 hover:bg-slate-100 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.05] dark:hover:border-white/10 transition-all duration-200 animate-slide-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${rank.color}`}>{rank.emoji}</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">{entry.user_name ?? 'Staff Member'}</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {entry.kpi_score.toFixed(1)}%
              </span>
            </div>

            <div className="h-2 rounded-full bg-slate-200 dark:bg-white/[0.05] overflow-hidden">
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
