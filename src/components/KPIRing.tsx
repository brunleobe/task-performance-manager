// Animated SVG circular KPI gauge component
import React, { useEffect, useRef } from 'react';

interface KPIRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

// Get color scheme based on performance zone
const getColor = (pct: number) => {
  if (pct >= 80) return { stroke: '#22d3ee', glow: 'rgba(34,211,238,0.4)', label: 'ON TARGET', badge: 'bg-cyan-500/20 text-cyan-300' };
  if (pct >= 60) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'NEEDS FOCUS', badge: 'bg-amber-500/20 text-amber-300' };
  return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.4)', label: 'AT RISK', badge: 'bg-red-500/20 text-red-300' };
};

const KPIRing: React.FC<KPIRingProps> = ({ percentage, size = 200, strokeWidth = 14, label }) => {
  const circleRef = useRef<SVGCircleElement>(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getColor(percentage);

  // Animate the stroke-dashoffset on score update
  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;

    circle.style.strokeDashoffset = String(circumference);
    const offset = circumference - (percentage / 100) * circumference;

    requestAnimationFrame(() => {
      circle.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      circle.style.strokeDashoffset = String(offset);
    });
  }, [percentage, circumference]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow backdrop */}
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          style={{ background: color.glow }}
        />

        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress ring */}
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ filter: `drop-shadow(0 0 8px ${color.stroke})` }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white tracking-tight">
            {Math.round(percentage)}%
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${color.badge}`}>
            {label ?? color.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default KPIRing;
