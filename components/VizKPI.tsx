
import React from 'react';

interface VizKPIProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  
  // Computed numerical value for comparison
  rawValue?: number;
  // Threshold config
  referenceValue?: number;
  referenceType?: 'min' | 'max';
}

export const VizKPI: React.FC<VizKPIProps> = ({ title, value, trend, isPositive, rawValue, referenceValue, referenceType }) => {
  let statusColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
  let barColor = isPositive ? 'bg-emerald-400' : 'bg-rose-400';
  let statusText = trend;

  // Threshold Logic
  if (referenceValue !== undefined && rawValue !== undefined) {
    const isMinGoal = referenceType === 'min'; // e.g. Steps > 10000
    const isMaxLimit = referenceType === 'max'; // e.g. Spending < 500

    let isSuccess = true;
    if (isMinGoal) isSuccess = rawValue >= referenceValue;
    if (isMaxLimit) isSuccess = rawValue <= referenceValue;

    if (!isSuccess) {
        statusColor = 'text-amber-500 animate-pulse'; // Warning
        barColor = 'bg-amber-500';
        statusText = `Off Track`;
    } else {
        statusColor = 'text-emerald-400';
        barColor = 'bg-emerald-400';
        statusText = 'On Track';
    }
  }

  const formattedRef = referenceValue !== undefined 
    ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(referenceValue)
    : null;

  return (
    <div className="h-full flex flex-col justify-center relative">
      <div className="flex justify-between items-start">
        <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</div>
        {referenceValue !== undefined && (
          <div className="text-[9px] font-bold px-2 py-1 rounded-md bg-white/5 text-slate-400 border border-white/5">
             {referenceType === 'min' ? 'Goal' : 'Limit'}: {formattedRef}
          </div>
        )}
      </div>
      
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>{value}</span>
        <span className={`text-sm font-bold ${statusColor}`}>
          {statusText}
        </span>
      </div>
      
      <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_currentColor] ${barColor}`} style={{ width: '70%' }}></div>
        
        {/* Visual Marker for Threshold within bar if we could calculate % but standardized to 70% width for style currently */}
      </div>
    </div>
  );
};
