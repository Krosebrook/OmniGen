
import React from 'react';
import { TooltipProps } from 'recharts';

interface CustomTooltipProps extends TooltipProps<number, string> {
  currentLevel: string;
  drillPath: string[];
  canDrill: boolean;
}

export const VizTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, currentLevel, drillPath, canDrill }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc, entry) => acc + (typeof entry.value === 'number' ? entry.value : 0), 0);

    return (
      <div className="bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5 min-w-[260px] animate-in fade-in zoom-in-95 duration-200 z-50">
        {/* Header */}
        <div className="flex flex-col gap-1.5 mb-4 pb-3 border-b border-slate-100/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {currentLevel}
            </span>
             {canDrill && (
                <span className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">
                  Drill Down →
                </span>
             )}
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight leading-none">{label}</span>
        </div>
        
        {/* Metrics */}
        <div className="space-y-3">
          {payload.map((entry, index) => {
            const val = Number(entry.value);
            const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
            const isSales = entry.name.toLowerCase().includes('sales') || entry.name.toLowerCase().includes('revenue');
            
            return (
              <div key={index} className="group/item">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full ring-2 ring-white shadow-sm transition-transform group-hover/item:scale-125" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-xs font-bold text-slate-600 capitalize group-hover/item:text-slate-900 transition-colors">{entry.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 font-mono tracking-tight">
                    {isSales 
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
                      : new Intl.NumberFormat('en-US').format(val)
                    }
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                   <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                     <div 
                       className="h-full rounded-full transition-all duration-500 ease-out" 
                       style={{ width: `${percent}%`, backgroundColor: entry.color }} 
                     />
                   </div>
                   <span className="text-[10px] font-semibold text-slate-400 w-9 text-right">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Footer */}
        {payload.length > 1 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(total)}
                </span>
            </div>
        )}

        {/* Filters Context */}
        {drillPath.length > 0 && (
          <div className="mt-4 pt-3 border-t border-indigo-50/50">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-2 block">
              Applied Filters
            </span>
            <div className="flex flex-wrap gap-1.5">
              {drillPath.map((filter, i) => (
                <span key={i} className="px-2 py-1 bg-indigo-50/80 text-indigo-600 border border-indigo-100/50 rounded-lg text-[9px] font-bold shadow-sm backdrop-blur-sm">
                  {filter}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};
