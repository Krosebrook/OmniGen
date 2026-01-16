
import React, { useState, useMemo } from 'react';
import { WidgetConfig, EditMode, VizType } from '../types';
import { ChartRenderer } from './ChartRenderer';
import { Icons } from '../constants';

const DRILL_HIERARCHY = ['region', 'category', 'date'];

interface BreadcrumbsProps {
  path: string[];
  onNavigate: (index: number) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate }) => (
  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 px-0.5">
    <button 
      onClick={() => onNavigate(-1)} 
      className={`px-2 py-0.5 rounded transition-all ${path.length === 0 ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-100 hover:text-indigo-600'}`}
    >
      Global
    </button>
    {path.map((segment, idx) => (
      <React.Fragment key={idx}>
        <span className="text-slate-300 mx-0.5">/</span>
        <button 
          onClick={() => onNavigate(idx)} 
          className={`px-2 py-0.5 rounded transition-all ${idx === path.length - 1 ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-100 hover:text-indigo-600'}`}
        >
          {segment}
        </button>
      </React.Fragment>
    ))}
  </div>
);

interface WidgetContainerProps {
  widget: WidgetConfig;
  mode: EditMode;
  data: any[];
  onAnalyze: (widget: WidgetConfig, currentData: any[]) => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ widget, mode, data, onAnalyze }) => {
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const currentLevelIndex = Math.min(drillPath.length, DRILL_HIERARCHY.length - 1);
  const currentLevel = DRILL_HIERARCHY[currentLevelIndex];
  const canDrill = drillPath.length < DRILL_HIERARCHY.length;

  // Filter data based on current drill-down path
  const filteredData = useMemo(() => {
    let result = data;
    drillPath.forEach((val, idx) => {
      const dim = DRILL_HIERARCHY[idx];
      result = result.filter(item => String(item[dim]) === val);
    });
    return result;
  }, [data, drillPath]);

  const handleDrill = (val: string) => {
    if (drillPath.length < DRILL_HIERARCHY.length) {
      setDrillPath([...drillPath, val]);
    }
  };

  const handleNavigate = (idx: number) => {
    setDrillPath(drillPath.slice(0, idx + 1));
  };

  const handleLevelUp = () => {
    setDrillPath(drillPath.slice(0, -1));
  };

  return (
    <div 
      className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-lg hover:border-indigo-200 relative group/widget"
      style={{ gridColumn: `span ${widget.w}`, gridRow: `span ${widget.h}` }}
    >
      {widget.type !== VizType.KPI_CARD && (
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/20 rounded-t-3xl">
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-800 tracking-tight uppercase">{widget.title}</span>
            <Breadcrumbs path={drillPath} onNavigate={handleNavigate} />
          </div>
          <div className="flex items-center gap-2">
            <button
               onClick={() => onAnalyze(widget, filteredData)}
               className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
            >
              <Icons.Sparkles /> Analyze
            </button>
            {drillPath.length > 0 && (
              <button 
                onClick={handleLevelUp}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                title="Go up one level"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
      
      {widget.type === VizType.KPI_CARD && (
         <div className="absolute top-4 right-4 opacity-0 group-hover/widget:opacity-100 transition-opacity">
            <button onClick={() => onAnalyze(widget, filteredData)} className="p-2 bg-indigo-50 text-indigo-600 rounded-full shadow-sm hover:scale-110 transition-transform">
               <Icons.Sparkles />
            </button>
         </div>
      )}

      <div className="flex-1 p-6 relative">
        <ChartRenderer 
          config={widget} 
          data={filteredData} 
          onDrill={handleDrill} 
          currentLevel={currentLevel}
          drillPath={drillPath}
          canDrill={canDrill}
        />
      </div>
    </div>
  );
};
