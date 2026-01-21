
import React, { useState, useMemo, useRef } from 'react';
import { WidgetConfig, EditMode, VizType, GRID_SYSTEM } from '../types';
import { ChartRenderer } from './ChartRenderer';
import { Icons } from '../constants';

const DRILL_HIERARCHY = ['region', 'category', 'date'];

interface BreadcrumbsProps {
  path: string[];
  onNavigate: (index: number) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate }) => (
  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 px-0.5">
    <button 
      onClick={() => onNavigate(-1)} 
      className={`px-2 py-0.5 rounded transition-all ${path.length === 0 ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30' : 'hover:bg-white/10 hover:text-fuchsia-400'}`}
    >
      Global
    </button>
    {path.map((segment, idx) => (
      <React.Fragment key={idx}>
        <span className="text-slate-600 mx-0.5">/</span>
        <button 
          onClick={() => onNavigate(idx)} 
          className={`px-2 py-0.5 rounded transition-all ${idx === path.length - 1 ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30' : 'hover:bg-white/10 hover:text-fuchsia-400'}`}
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
  onResize?: (id: string, w: number, h: number) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onUpdate?: (id: string, updates: Partial<WidgetConfig>) => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ widget, mode, data, onAnalyze, onResize, onMove, onUpdate }) => {
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const currentLevelIndex = Math.min(drillPath.length, DRILL_HIERARCHY.length - 1);
  const currentLevel = DRILL_HIERARCHY[currentLevelIndex];
  const canDrill = drillPath.length < DRILL_HIERARCHY.length;

  // Extract available keys from data for settings dropdowns
  const dataKeys = useMemo(() => data.length > 0 ? Object.keys(data[0]) : [], [data]);

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

  // --- Grid Math Helpers ---
  const calculateGridDelta = (deltaX: number, deltaY: number, parentWidth: number) => {
     // Calculate strict grid sizes based on types.ts constants
     const totalGapWidth = (GRID_SYSTEM.COLS - 1) * GRID_SYSTEM.GAP_PX;
     const colWidth = (parentWidth - totalGapWidth) / GRID_SYSTEM.COLS;
     
     const stepX = colWidth + GRID_SYSTEM.GAP_PX;
     const stepY = GRID_SYSTEM.ROW_HEIGHT_PX + GRID_SYSTEM.GAP_PX;

     return {
       dCol: Math.round(deltaX / stepX),
       dRow: Math.round(deltaY / stepY)
     };
  };

  // --- Resize Handler ---
  const handleResizeStart = (e: React.MouseEvent) => {
    if (mode !== EditMode.PRO || !onResize) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = widget.w;
    const startH = widget.h;
    
    const parent = containerRef.current?.offsetParent as HTMLElement;
    if (!parent) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const { dCol, dRow } = calculateGridDelta(
        moveEvent.clientX - startX,
        moveEvent.clientY - startY,
        parent.clientWidth
      );

      // Constraint resizing to grid bounds and min size
      const newW = Math.max(2, Math.min(GRID_SYSTEM.COLS - widget.x, startW + dCol));
      const newH = Math.max(1, Math.min(12, startH + dRow));

      if (newW !== widget.w || newH !== widget.h) {
         onResize(widget.id, newW, newH);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // --- Drag Handler ---
  const handleDragStart = (e: React.MouseEvent) => {
    if (mode !== EditMode.PRO || !onMove) return;
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startGridX = widget.x;
    const startGridY = widget.y;

    const parent = containerRef.current?.offsetParent as HTMLElement;
    if (!parent) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const { dCol, dRow } = calculateGridDelta(
          moveEvent.clientX - startX,
          moveEvent.clientY - startY,
          parent.clientWidth
        );

        const newX = Math.max(0, Math.min(GRID_SYSTEM.COLS - widget.w, startGridX + dCol));
        const newY = Math.max(0, startGridY + dRow);

        if (newX !== widget.x || newY !== widget.y) {
           onMove(widget.id, newX, newY);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      ref={containerRef}
      className={`glass-panel rounded-3xl flex flex-col transition-all relative group/widget backdrop-blur-md 
        ${isResizing || isDragging ? 'z-50 border-fuchsia-500 shadow-2xl scale-[1.02]' : 'hover:border-fuchsia-500/30'}
        ${mode === EditMode.PRO ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
      style={{ 
        gridColumn: `span ${widget.w}`, 
        gridRow: `span ${widget.h}`,
        ...(widget.x > 0 || widget.y > 0 ? {
            gridColumnStart: widget.x + 1,
            gridRowStart: widget.y + 1
        } : {}),
        userSelect: isResizing || isDragging ? 'none' : 'auto'
      }}
      onMouseDown={handleDragStart}
    >
      {/* Settings Overlay */}
      {showSettings && (
          <div className="absolute inset-0 bg-slate-900/95 z-40 p-6 flex flex-col gap-4 animate-in fade-in rounded-3xl" onMouseDown={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="font-bold text-white uppercase tracking-wider">Configure Widget</span>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><Icons.Settings /></button>
              </div>
              
              <div className="space-y-4 overflow-y-auto custom-scrollbar">
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Title</label>
                      <input 
                          type="text" 
                          value={widget.title} 
                          onChange={(e) => onUpdate?.(widget.id, { title: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none"
                      />
                  </div>
                  
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dimension (X-Axis)</label>
                      <select 
                          value={widget.dimension || ''} 
                          onChange={(e) => onUpdate?.(widget.id, { dimension: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none"
                      >
                          <option value="">Auto</option>
                          {dataKeys.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Secondary Dimension (Y-Axis)</label>
                      <select 
                          value={widget.secondaryDimension || ''} 
                          onChange={(e) => onUpdate?.(widget.id, { secondaryDimension: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none"
                      >
                          <option value="">None</option>
                          {dataKeys.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Metric (Value)</label>
                      <select 
                          value={widget.metric || ''} 
                          onChange={(e) => onUpdate?.(widget.id, { metric: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none"
                      >
                          <option value="">Auto</option>
                          {dataKeys.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                  </div>
              </div>
          </div>
      )}

      {widget.type !== VizType.KPI_CARD && (
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] rounded-t-3xl">
          <div className="flex flex-col">
            <span className="text-sm font-black text-white tracking-tight uppercase drop-shadow-sm">{widget.title}</span>
            <Breadcrumbs path={drillPath} onNavigate={handleNavigate} />
          </div>
          <div className="flex items-center gap-2">
            {mode === EditMode.PRO && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"
                >
                    <Icons.Settings />
                </button>
            )}
            <button
               onClick={(e) => { e.stopPropagation(); onAnalyze(widget, filteredData); }}
               className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm"
            >
              <Icons.Sparkles /> Analyze
            </button>
            {drillPath.length > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleLevelUp(); }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"
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
         <div className="absolute top-4 right-4 opacity-0 group-hover/widget:opacity-100 transition-opacity z-20 flex gap-2">
            {mode === EditMode.PRO && (
                <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} className="p-2 bg-slate-800 text-slate-300 rounded-full shadow-sm hover:scale-110 transition-transform">
                   <Icons.Settings />
                </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onAnalyze(widget, filteredData); }} className="p-2 bg-fuchsia-500/20 text-fuchsia-300 rounded-full shadow-sm hover:scale-110 transition-transform">
               <Icons.Sparkles />
            </button>
         </div>
      )}

      <div className="flex-1 p-6 relative overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <ChartRenderer 
          config={widget} 
          data={filteredData} 
          onDrill={handleDrill} 
          currentLevel={currentLevel} 
          drillPath={drillPath} 
          canDrill={canDrill}
        />
      </div>

      {/* Resize Handle */}
      {mode === EditMode.PRO && (
        <div 
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20 flex items-center justify-center opacity-0 group-hover/widget:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4 text-fuchsia-500 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14m7-14v14" />
          </svg>
        </div>
      )}
    </div>
  );
};
