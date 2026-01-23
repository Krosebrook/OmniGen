
import React, { useState, useMemo } from 'react';

interface VizTableProps {
  data: any[];
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

export const VizTable: React.FC<VizTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // 1. Extract Columns
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // 2. Compute Column Maxima for Heat Bars
  const columnMaxValues = useMemo(() => {
    const maxes: Record<string, number> = {};
    columns.forEach(col => {
      // Check if column is numeric
      if (typeof data[0][col] === 'number') {
        maxes[col] = Math.max(...data.map(d => Number(d[col]) || 0));
      }
    });
    return maxes;
  }, [data, columns]);

  // 3. Handle Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-xs uppercase tracking-widest font-bold">
        No Data Available
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto custom-scrollbar rounded-xl border border-white/5 bg-slate-950/30">
      <table className="w-full text-left border-collapse min-w-[400px]">
        <thead className="sticky top-0 z-10 bg-slate-900 shadow-lg ring-1 ring-white/5">
          <tr>
            {columns.map(col => (
              <th 
                key={col}
                onClick={() => handleSort(col)}
                className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-white hover:bg-white/5 transition-colors select-none whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  {col}
                  {sortConfig?.key === col && (
                    <span className="text-cyan-400">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sortedData.map((row, idx) => (
            <tr key={idx} className="hover:bg-white/5 transition-colors group">
              {columns.map(col => {
                const val = row[col];
                const isNum = typeof val === 'number';
                const max = columnMaxValues[col];
                const percentage = isNum && max > 0 ? (val / max) * 100 : 0;

                return (
                  <td key={col} className="p-3 text-xs font-medium text-slate-300 relative">
                    {/* Heat Bar Background */}
                    {isNum && (
                      <div 
                        className="absolute inset-y-1 left-0 bg-cyan-500/10 rounded-r-md transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                    
                    {/* Content */}
                    <span className="relative z-0 font-mono">
                      {isNum 
                        ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val)
                        : String(val)
                      }
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
