// Task Card item component
import React from 'react';
import type { Task } from '../types';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  showAssignee?: boolean;
}

const statusConfig = {
  pending:     { dot: 'bg-slate-400', badge: 'bg-slate-700/60 text-slate-300', label: 'Pending' },
  in_progress: { dot: 'bg-blue-400',  badge: 'bg-blue-500/20 text-blue-300',   label: 'In Progress' },
  completed:   { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', label: 'Completed' },
  overdue:     { dot: 'bg-red-400',   badge: 'bg-red-500/20 text-red-300',     label: 'Overdue' },
};

const weightColors = ['', 'bg-slate-500', 'bg-blue-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'];

// Formats due date label relative to current day
const getDueDateLabel = (dueDate: string) => {
  const d = new Date(dueDate);

  if (isPast(d) && !isToday(d)) {
    const days = Math.abs(differenceInDays(d, new Date()));
    return { text: `${days}d overdue`, className: 'text-red-400' };
  }

  if (isToday(d))    return { text: 'Due Today',    className: 'text-amber-400' };
  if (isTomorrow(d)) return { text: 'Due Tomorrow', className: 'text-blue-400' };

  return { text: format(d, 'MMM d, yyyy'), className: 'text-slate-400' };
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, showAssignee = false }) => {
  const sc = statusConfig[task.status];
  const due = getDueDateLabel(task.due_date);
  const isCompleted = task.status === 'completed';
  const isOverdue   = task.status === 'overdue';

  return (
    <div
      className={`
        group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200
        ${isOverdue
          ? 'bg-red-950/20 border-red-800/40 hover:border-red-600/60'
          : isCompleted
          ? 'bg-emerald-950/20 border-emerald-800/30 opacity-75'
          : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
        }
      `}
    >
      {/* Complete Checkbox */}
      {!isCompleted && onComplete && (
        <button
          onClick={() => onComplete(task.id)}
          className={`
            mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all duration-200
            hover:scale-110 active:scale-95
            ${isOverdue
              ? 'border-red-500 hover:bg-red-500/20'
              : 'border-slate-600 hover:border-cyan-500 hover:bg-cyan-500/10'
            }
          `}
          title="Mark as complete"
        />
      )}

      {/* Completed indicator */}
      {isCompleted && (
        <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md bg-emerald-500/30 border-2 border-emerald-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Task Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className={`font-medium text-sm leading-tight ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
            {task.title}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sc.badge}`}>
            {sc.label}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-slate-500 mt-1 truncate">{task.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className={`text-xs font-medium ${due.className}`}>
            📅 {due.text}
          </span>

          {/* Weight dots */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((w) => (
              <div
                key={w}
                className={`w-2 h-2 rounded-full transition-all ${
                  w <= task.weight_points
                    ? weightColors[task.weight_points]
                    : 'bg-white/10'
                }`}
              />
            ))}
            <span className="text-xs text-slate-500 ml-1">{task.weight_points} pts</span>
          </div>

          {showAssignee && task.assigned_to_name && (
            <span className="text-xs text-slate-500">👤 {task.assigned_to_name}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
