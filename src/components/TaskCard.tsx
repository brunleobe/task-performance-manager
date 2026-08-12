// Task Card item component
import React from 'react';
import type { Task } from '../types';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  showAssignee?: boolean;
}

const statusConfig = {
  pending:     { dot: 'bg-slate-400', badge: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600/50 border', label: 'Pending' },
  in_progress: { dot: 'bg-blue-400',  badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30 border',   label: 'In Progress' },
  completed:   { dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 border', label: 'Completed' },
  overdue:     { dot: 'bg-red-400',   badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30 border',     label: 'Overdue' },
};

const weightColors = ['', 'bg-slate-500', 'bg-blue-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'];

// Formats due date label relative to current day
const getDueDateLabel = (dueDate: string) => {
  const d = new Date(dueDate);

  if (isPast(d) && !isToday(d)) {
    const days = Math.abs(differenceInDays(d, new Date()));
    return { text: `${days}d overdue`, className: 'text-red-500 font-semibold' };
  }

  if (isToday(d))    return { text: 'Due Today',    className: 'text-amber-500 font-semibold' };
  if (isTomorrow(d)) return { text: 'Due Tomorrow', className: 'text-blue-500 font-semibold' };

  return { text: format(d, 'MMM d, yyyy'), className: 'text-slate-500 dark:text-slate-400' };
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onEdit, onDelete, showAssignee = false }) => {
  const sc = statusConfig[task.status];
  const due = getDueDateLabel(task.due_date);
  const isCompleted = task.status === 'completed';
  const isOverdue   = task.status === 'overdue';

  return (
    <div
      className={`
        group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200
        ${isOverdue
          ? 'bg-red-50/80 border-red-200 hover:border-red-300 dark:bg-red-950/20 dark:border-red-800/40 dark:hover:border-red-600/60'
          : isCompleted
          ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30 opacity-80'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm dark:bg-white/[0.03] dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/[0.06]'
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
              : 'border-slate-300 dark:border-slate-600 hover:border-cyan-500 hover:bg-cyan-500/10'
            }
          `}
          title="Mark as complete"
        />
      )}

      {/* Completed indicator */}
      {isCompleted && (
        <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md bg-emerald-500/30 border-2 border-emerald-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Task Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className={`font-semibold text-sm leading-tight ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2">
            {(onEdit || onDelete) && (
              <div className="hidden group-hover:flex items-center gap-1 mr-1">
                {onEdit && (
                  <button onClick={() => onEdit(task)} className="p-1 text-xs rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors" title="Edit Task">
                    ✏️
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(task.id)} className="p-1 text-xs rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete Task">
                    🗑️
                  </button>
                )}
              </div>
            )}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${sc.badge}`}>
              {sc.label}
            </span>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{task.description}</p>
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
                    : 'bg-slate-200 dark:bg-white/10'
                }`}
              />
            ))}
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-medium">{task.weight_points} pts</span>
          </div>

          {showAssignee && task.assigned_to_name && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">👤 {task.assigned_to_name}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
