
import React from 'react';

interface VizKPIProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
}

export const VizKPI: React.FC<VizKPIProps> = ({ title, value, trend, isPositive }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col justify-center">
    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</div>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trend}
      </span>
    </div>
    <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-1000 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: '70%' }}></div>
    </div>
  </div>
);
