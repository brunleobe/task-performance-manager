// Task Weight / Difficulty rating selector (1-5)
import React from 'react';

interface WeightSelectorProps {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
}

const weightLabels: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: '1', color: 'bg-slate-500 border-slate-400 text-white',  desc: 'Trivial' },
  2: { label: '2', color: 'bg-sky-500 border-sky-400 text-white',      desc: 'Easy' },
  3: { label: '3', color: 'bg-blue-600 border-blue-500 text-white',    desc: 'Medium' },
  4: { label: '4', color: 'bg-indigo-600 border-indigo-500 text-white', desc: 'Hard' },
  5: { label: '5', color: 'bg-rose-600 border-rose-500 text-white',    desc: 'Critical' },
};

const WeightSelector: React.FC<WeightSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {([1, 2, 3, 4, 5] as (1 | 2 | 3 | 4 | 5)[]).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onChange(w)}
            className={`
              flex-1 h-10 rounded-xl border-2 font-bold text-sm transition-all duration-200
              hover:scale-105 active:scale-95
              ${value === w
                ? weightLabels[w].color
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-slate-400 dark:hover:border-blue-700/50 dark:hover:text-white'
              }
            `}
          >
            {w}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
        Difficulty:{' '}
        <span className="text-blue-900 dark:text-sky-300 font-bold">{weightLabels[value].desc}</span>
        {' '}({value} point{value > 1 ? 's' : ''})
      </p>
    </div>
  );
};

export default WeightSelector;
