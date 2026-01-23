
import React, { useMemo } from 'react';
import { SemanticModel } from '../types';

interface GlobalFilterBarProps {
  semanticModel: SemanticModel;
  data: any[];
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({ semanticModel, data, filters, onFilterChange }) => {
  // Extract categorical dimensions that are useful for filtering
  const filterableDimensions = useMemo(() => 
    semanticModel.dimensions.filter(d => d.type === 'Categorical' || d.name.includes('Date')), 
  [semanticModel]);

  // Get unique values for each dimension from the actual data
  const options = useMemo(() => {
    const opts: Record<string, string[]> = {};
    if (data.length === 0) return opts;

    filterableDimensions.forEach(dim => {
      // Find the actual data key (simple matching strategy)
      const sample = data[0];
      const key = Object.keys(sample).find(k => k.toLowerCase() === dim.name.toLowerCase()) || dim.name.toLowerCase();
      
      // Get unique values
      const unique = Array.from(new Set(data.map(item => String(item[key] || '')))).filter(Boolean) as string[];
      opts[dim.name] = unique.sort().slice(0, 50); // Limit dropdown size for perf
    });
    return opts;
  }, [data, filterableDimensions]);

  return (
    <div className="flex items-center gap-3 px-8 py-3 border-b border-white/5 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-2 text-slate-500 mr-2 shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
      </div>
      
      {filterableDimensions.map(dim => (
        <div key={dim.name} className="relative group shrink-0">
           <select
             value={filters[dim.name] || ''}
             onChange={(e) => onFilterChange(dim.name, e.target.value)}
             className="appearance-none bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-[11px] font-bold text-slate-300 rounded-lg py-1.5 pl-3 pr-8 outline-none focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer min-w-[120px]"
           >
             <option value="">All {dim.name}s</option>
             {options[dim.name]?.map(opt => (
               <option key={opt} value={opt}>{opt}</option>
             ))}
           </select>
           <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </div>
        </div>
      ))}

      {Object.keys(filters).length > 0 && (
        <button 
          onClick={() => Object.keys(filters).forEach(k => onFilterChange(k, ''))}
          className="ml-auto text-[9px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20"
        >
          Clear Active
        </button>
      )}
    </div>
  );
};
