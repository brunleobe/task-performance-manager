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
  pending:     { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-blue-950/60 dark:text-slate-300 dark:border-blue-800/40 border', label: 'Pending' },
  in_progress: { dot: 'bg-sky-400',   badge: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700/50 border',     label: 'In Progress' },
  completed:   { dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/50 border', label: 'Completed' },
  overdue:     { dot: 'bg-rose-400',   badge: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/50 border',     label: 'Overdue' },
};

const weightColors = ['', 'bg-slate-400', 'bg-sky-500', 'bg-blue-600', 'bg-indigo-600', 'bg-rose-600'];

const getDueDateLabel = (dueDate: string) => {
  const d = new Date(dueDate);

  if (isPast(d) && !isToday(d)) {
    const days = Math.abs(differenceInDays(d, new Date()));
    return { text: `${days}d overdue`, className: 'text-rose-600 dark:text-rose-400 font-semibold' };
  }

  if (isToday(d))    return { text: 'Due Today',    className: 'text-amber-600 dark:text-amber-400 font-semibold' };
  if (isTomorrow(d)) return { text: 'Due Tomorrow', className: 'text-sky-600 dark:text-sky-400 font-semibold' };

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
          ? 'bg-rose-50/80 border-rose-200 hover:border-rose-300 dark:bg-rose-950/20 dark:border-rose-800/40 dark:hover:border-rose-600/60'
          : isCompleted
          ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30 opacity-85'
          : 'bg-white border-slate-200/90 hover:border-blue-300 shadow-sm dark:bg-[#121c38]/90 dark:border-blue-900/40 dark:hover:border-blue-500/40'
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
              ? 'border-rose-500 hover:bg-rose-500/20'
              : 'border-slate-300 dark:border-blue-700/60 hover:border-sky-500 hover:bg-sky-500/10'
            }
          `}
          title="Mark as complete"
        />
      )}

      {/* Completed indicator */}
      {isCompleted && (
        <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md bg-emerald-500/30 border-2 border-emerald-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-emerald-700 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <button onClick={() => onEdit(task)} className="p-1 text-xs rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-blue-900/40 transition-colors" title="Edit Task">
                    ✏️
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(task.id)} className="p-1 text-xs rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="Delete Task">
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

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((w) => (
              <div
                key={w}
                className={`w-2 h-2 rounded-full transition-all ${
                  w <= task.weight_points
                    ? weightColors[task.weight_points]
                    : 'bg-slate-200 dark:bg-blue-950/80'
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
