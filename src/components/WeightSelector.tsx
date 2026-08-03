import React from 'react';

interface WeightSelectorProps {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
}

const weightLabels: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: '1', color: 'bg-slate-500 border-slate-400 text-white', desc: 'Trivial' },
  2: { label: '2', color: 'bg-blue-500 border-blue-400 text-white', desc: 'Easy' },
  3: { label: '3', color: 'bg-amber-500 border-amber-400 text-white', desc: 'Medium' },
  4: { label: '4', color: 'bg-orange-500 border-orange-400 text-white', desc: 'Hard' },
  5: { label: '5', color: 'bg-red-500 border-red-400 text-white', desc: 'Critical' },
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
              flex-1 h-10 rounded-lg border-2 font-bold text-sm transition-all duration-200
              hover:scale-105 active:scale-95
              ${value === w
                ? weightLabels[w].color
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }
            `}
          >
            {w}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center">
        Weight: <span className="text-slate-300 font-medium">{weightLabels[value].desc}</span>
        {' '}({value} point{value > 1 ? 's' : ''})
      </p>
    </div>
  );
};

export default WeightSelector;
