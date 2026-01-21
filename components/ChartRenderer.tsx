
import React, { useMemo } from 'react';
import { Icons } from '../constants';
import { VizType, WidgetConfig } from '../types';
import { VizArea } from './VizArea';
import { VizBar } from './VizBar';
import { VizKPI } from './VizKPI';
import { VizScatter } from './VizScatter';
import { VizHeatmap } from './VizHeatmap';
import { VizTreemap } from './VizTreemap';

interface ChartRendererProps {
  config: WidgetConfig;
  data: any[];
  onDrill: (value: string) => void;
  currentLevel: string;
  drillPath: string[];
  canDrill: boolean;
}

/**
 * Renders the appropriate visualization based on the widget configuration.
 * Handles data aggregation, transformation, and distribution to specific Viz components.
 */
export const ChartRenderer: React.FC<ChartRendererProps> = ({ config, data, onDrill, currentLevel, drillPath, canDrill }) => {
  
  // -- Standard Aggregation (Bar, Line, KPI) --
  // Aggregates data by the current drill level (Dimension) and sums the metric.
  const standardData = useMemo(() => {
    if ([VizType.SCATTER, VizType.HEATMAP, VizType.TREEMAP].includes(config.type)) return [];
    
    const metric = config.metric || 'sales';
    const agg: Record<string, any> = {};
    
    data.forEach(item => {
      const key = String(item[currentLevel] || 'Unknown');
      
      // Initialize the group if it doesn't exist
      if (!agg[key]) {
        agg[key] = { [currentLevel]: key };
        agg[key][metric] = 0;
        
        // Backward compatibility: ensure standard keys exist for legacy templates
        if (metric !== 'sales') agg[key]['sales'] = 0;
        if (metric !== 'users') agg[key]['users'] = 0;
      }
      
      // Safely accumulate the metric
      const val = Number(item[metric]);
      if (!isNaN(val)) {
        agg[key][metric] += val;
      }
      
      // Accumulate defaults if present in source data (legacy support)
      if (metric !== 'sales' && item.sales) agg[key]['sales'] += Number(item.sales) || 0;
      if (metric !== 'users' && item.users) agg[key]['users'] += Number(item.users) || 0;
    });
    
    // Sort by dimension key for consistent display
    return Object.values(agg).sort((a, b) => String(a[currentLevel]).localeCompare(String(b[currentLevel])));
  }, [data, currentLevel, config.type, config.metric]);

  // -- Scatter Data (Raw) --
  // Maps data directly for X/Y/Z plotting without aggregation
  const scatterData = useMemo(() => {
    if (config.type !== VizType.SCATTER) return [];
    return data.map(d => ({
        ...d,
        [config.dimension || 'sales']: Number(d[config.dimension || 'sales'] || 0),
        [config.secondaryDimension || 'users']: Number(d[config.secondaryDimension || 'users'] || 0),
        [config.metric || 'conversion']: Number(d[config.metric || 'conversion'] || 0),
    }));
  }, [data, config.type, config.dimension, config.secondaryDimension, config.metric]);

  // -- Heatmap Data (Pivoted) --
  // Aggregates data into a matrix form (X-Axis vs Y-Axis) with value Z
  const heatmapData = useMemo(() => {
    if (config.type !== VizType.HEATMAP) return [];
    const xKey = config.dimension || 'category';
    const yKey = config.secondaryDimension || 'region';
    const valKey = config.metric || 'sales';
    
    const agg: Record<string, any> = {};
    data.forEach(item => {
        const x = String(item[xKey] || 'N/A');
        const y = String(item[yKey] || 'N/A');
        const key = `${x}-${y}`;
        if(!agg[key]) agg[key] = { [xKey]: x, [yKey]: y, [valKey]: 0 };
        agg[key][valKey] += Number(item[valKey] || 0);
    });
    return Object.values(agg);
  }, [data, config.type, config.dimension, config.secondaryDimension, config.metric]);

  // -- Treemap Data (Hierarchical) --
  // Simple grouping by current level for size comparison
  const treemapData = useMemo(() => {
      if (config.type !== VizType.TREEMAP) return [];
      const valKey = config.metric || 'sales';
      
      const agg: Record<string, number> = {};
      data.forEach(item => {
          const key = String(item[currentLevel] || 'Unknown');
          agg[key] = (agg[key] || 0) + (Number(item[valKey]) || 0);
      });
      return Object.entries(agg).map(([name, size]) => ({ name, size }));
  }, [data, config.type, currentLevel, config.metric]);

  // Render Logic
  switch (config.type) {
    case VizType.TIME_SERIES:
      return <VizArea 
        data={standardData} 
        onDrill={onDrill} 
        currentLevel={currentLevel} 
        drillPath={drillPath} 
        canDrill={canDrill}
        metric={config.metric || 'sales'}
      />;
    
    case VizType.BAR:
      return <VizBar 
        data={standardData} 
        onDrill={onDrill} 
        currentLevel={currentLevel} 
        drillPath={drillPath} 
        canDrill={canDrill}
        metric={config.metric || 'sales'}
      />;
    
    case VizType.KPI_CARD:
      const metric = config.metric || 'sales';
      const total = standardData.reduce((acc, curr) => acc + (Number(curr[metric]) || 0), 0);
      // Format large numbers for KPI card
      const formattedTotal = new Intl.NumberFormat('en-US', { 
        notation: "compact", 
        compactDisplay: "short" 
      }).format(total);
      
      return <VizKPI title={config.title} value={formattedTotal} trend="--" isPositive={true} />;
    
    case VizType.SCATTER:
        return <VizScatter 
          data={scatterData} 
          xKey={config.dimension || 'sales'}
          yKey={config.secondaryDimension || 'users'}
          zKey={config.metric || 'conversion'}
        />;

    case VizType.HEATMAP:
        return <VizHeatmap 
          data={heatmapData} 
          xKey={config.dimension || 'category'} 
          yKey={config.secondaryDimension || 'region'} 
          valKey={config.metric || 'sales'} 
        />;

    case VizType.TREEMAP:
        return <VizTreemap data={treemapData} />;

    default:
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
          <Icons.Dashboard />
          <span className="text-xs font-semibold uppercase tracking-widest">{config.type} Placeholder</span>
        </div>
      );
  }
};
