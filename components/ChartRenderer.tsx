
import React, { useMemo } from 'react';
import { Icons } from '../constants';
import { VizType, WidgetConfig } from '../types';
import { VizArea } from './VizArea';
import { VizBar } from './VizBar';
import { VizKPI } from './VizKPI';

interface ChartRendererProps {
  config: WidgetConfig;
  data: any[];
  onDrill: (value: string) => void;
  currentLevel: string;
  drillPath: string[];
  canDrill: boolean;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ config, data, onDrill, currentLevel, drillPath, canDrill }) => {
  // Common Data Aggregation Logic
  const chartData = useMemo(() => {
    const agg: Record<string, any> = {};
    data.forEach(item => {
      const key = String(item[currentLevel] || 'Unknown');
      if (!agg[key]) {
        agg[key] = { [currentLevel]: key, sales: 0, users: 0 };
      }
      agg[key].sales += Number(item.sales || 0);
      agg[key].users += Number(item.users || 0);
    });
    return Object.values(agg).sort((a, b) => String(a[currentLevel]).localeCompare(String(b[currentLevel])));
  }, [data, currentLevel]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 italic">
        <Icons.Search />
        <span className="text-xs">No data at this drill level</span>
      </div>
    );
  }

  const commonProps = {
    data: chartData,
    onDrill,
    currentLevel,
    drillPath,
    canDrill
  };

  switch (config.type) {
    case VizType.TIME_SERIES:
      return <VizArea {...commonProps} />;
    
    case VizType.BAR:
      return <VizBar {...commonProps} />;
    
    case VizType.KPI_CARD:
      const total = chartData.reduce((acc, curr) => acc + curr.sales, 0);
      return <VizKPI title={config.title} value={`$${total.toLocaleString()}`} trend="+8.4%" isPositive={true} />;
    
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
          <Icons.Dashboard />
          <span className="text-xs font-semibold uppercase tracking-widest">{config.type} Placeholder</span>
        </div>
      );
  }
};
