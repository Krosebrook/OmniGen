
import React, { useState, useMemo, useRef } from 'react';
import { WidgetConfig, VizType, GRID_SYSTEM, Annotation } from '../types';
import { ChartRenderer } from './ChartRenderer';
import { Icons } from '../constants';

const DRILL_HIERARCHY = ['region', 'category', 'date'];

interface WidgetContainerProps {
  widget: WidgetConfig;
  isLocked: boolean;
  data: any[];
  onAnalyze: (widget: WidgetConfig, currentData: any[]) => void;
  onResize: (id: string, w: number, h: number) => void;
  onMove: (id: string, x: number, y: number) => void;
  onUpdate: (id: string, updates: Partial<WidgetConfig>) => void;
  onMaximize?: (widget: WidgetConfig) => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ widget, isLocked, data, onAnalyze, onResize, onMove, onUpdate, onMaximize }) => {
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showObservations, setShowObservations] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');

  const currentLevelIndex = Math.min(drillPath.length, DRILL_HIERARCHY.length - 1);
  const currentLevel = DRILL_HIERARCHY[currentLevelIndex];
  const canDrill = drillPath.length < DRILL_HIERARCHY.length;

  const dataKeys = useMemo(() => data.length > 0 ? Object.keys(data[0]) : [], [data]);

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

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnotation.trim()) return;
    
    const annotation: Annotation = {
      id: Date.now().toString(),
      text: newAnnotation.trim(),
      timestamp: Date.now()
    };
    
    const updated = [...(widget.annotations || []), annotation];
    onUpdate(widget.id, { annotations: updated });
    setNewAnnotation('');
  };

  const handleDeleteAnnotation = (id: string) => {
    const updated = (widget.annotations || []).filter(a => a.id !== id);
    onUpdate(widget.id, { annotations: updated });
  };

  const calculateGridCoords = (clientX: number, clientY: number, parent: HTMLElement) => {
    const rect = parent.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const colWidth = (rect.width - (GRID_SYSTEM.COLS - 1) * GRID_SYSTEM.GAP_PX) / GRID_SYSTEM.COLS;
    const cellWidth = colWidth + GRID_SYSTEM.GAP_PX;
    const cellHeight = GRID_SYSTEM.ROW_HEIGHT_PX + GRID_SYSTEM.GAP_PX;

    return {
      x: Math.round(relativeX / cellWidth),
      y: Math.round(relativeY / cellHeight)
    };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (isLocked) return;
    e.preventDefault(); e.stopPropagation();
    setIsResizing(true);
    
    const parent = containerRef.current?.offsetParent as HTMLElement;
    if (!parent) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const coords = calculateGridCoords(moveEvent.clientX, moveEvent.clientY, parent);
      const newW = Math.max(2, coords.x - widget.x);
      const newH = Math.max(1, coords.y - widget.y);
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

  const handleDragStart = (e: React.MouseEvent) => {
    if (isLocked) return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('video')) return;
    
    e.preventDefault();
    setIsDragging(true);

    const parent = containerRef.current?.offsetParent as HTMLElement;
    if (!parent) return;

    const rect = containerRef.current!.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const coords = calculateGridCoords(moveEvent.clientX - offsetX, moveEvent.clientY - offsetY, parent);
      if (coords.x !== widget.x || coords.y !== widget.y) {
        onMove(widget.id, coords.x, coords.y);
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

  const annotationCount = widget.annotations?.length || 0;

  return (
    <div 
      ref={containerRef}
      className={`rounded-3xl flex flex-col transition-all duration-300 relative group/widget 
        bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-800/90 backdrop-blur-xl border border-white/10 shadow-xl
        ${isResizing || isDragging ? 'z-50 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)] scale-[1.01]' : 'hover:border-cyan-500/30 hover:shadow-cyan-500/10 hover:shadow-2xl hover:from-slate-900/95 hover:to-slate-800/95'}
        ${!isLocked ? 'cursor-grab active:cursor-grabbing border-white/10 ring-1 ring-white/5' : ''}
      `}
      style={{ 
        gridColumn: `span ${widget.w}`, 
        gridRow: `span ${widget.h}`,
        gridColumnStart: widget.x + 1,
        gridRowStart: widget.y + 1,
        userSelect: isResizing || isDragging ? 'none' : 'auto'
      }}
      onMouseDown={handleDragStart}
      role="article"
      aria-label={`${widget.title} widget`}
    >
      <div className="px-5 py-4 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{widget.type.replace('-', ' ')}</span>
          <span className="text-xs font-black text-slate-200 tracking-tight uppercase truncate max-w-[150px]">{widget.title}</span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover/widget:opacity-100 transition-all duration-200 pointer-events-auto">
          {onMaximize && (
            <button
               onClick={(e) => { e.stopPropagation(); onMaximize(widget); }}
               className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
               title="Focus Mode"
               aria-label="Maximize Widget"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
          )}
          
          <button
             onClick={(e) => { e.stopPropagation(); setShowObservations(!showObservations); }}
             className={`p-1.5 rounded-lg transition-all flex items-center gap-1 focus:ring-2 focus:ring-cyan-400 focus:outline-none ${showObservations || annotationCount > 0 ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
             title="Observations"
             aria-label="Toggle Observations"
          >
            <Icons.Pin />
            {annotationCount > 0 && <span className="text-[9px] font-black">{annotationCount}</span>}
          </button>

          <button
             onClick={(e) => { e.stopPropagation(); onAnalyze(widget, filteredData); }}
             className="p-1.5 hover:bg-cyan-500/10 rounded-lg text-cyan-400 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
             title="AI Analysis"
             aria-label="Analyze with AI"
          >
            <Icons.Sparkles />
          </button>
          {!isLocked && (
             <button 
                onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                aria-label="Widget Settings"
             >
                <Icons.Settings />
             </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 pb-5 pt-0 relative overflow-hidden flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
        <ChartRenderer 
          config={widget} 
          data={filteredData} 
          onDrill={handleDrill} 
          currentLevel={currentLevel} 
          drillPath={drillPath} 
          canDrill={canDrill}
        />
      </div>

      {/* Observations Overlay */}
      {showObservations && (
        <div className="absolute inset-0 bg-slate-900/98 z-40 p-5 rounded-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col border border-white/10" onMouseDown={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-4 shrink-0">
              <h4 className="font-black text-white uppercase tracking-tighter text-sm flex items-center gap-2">
                 <span className="text-cyan-400"><Icons.Pin /></span>
                 Observations
              </h4>
              <button onClick={() => setShowObservations(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4">
              {widget.annotations?.length ? (
                widget.annotations.map(note => (
                  <div key={note.id} className="p-3 rounded-xl bg-white/5 border border-white/5 group relative hover:bg-white/10 transition-colors">
                     <p className="text-sm text-slate-300 font-medium leading-relaxed">{note.text}</p>
                     <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(note.timestamp).toLocaleDateString()}</span>
                        <button onClick={() => handleDeleteAnnotation(note.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100" aria-label="Delete note">
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                     </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                   <div className="mb-2 opacity-50"><Icons.Pin /></div>
                   <p className="text-xs font-medium text-center">No observations recorded.<br/>Add context to your data.</p>
                </div>
              )}
           </div>

           <form onSubmit={handleAddAnnotation} className="shrink-0 relative">
              <input 
                type="text" 
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
                placeholder="Type an observation..."
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:border-cyan-500 outline-none transition-all placeholder-slate-600 focus:ring-1 focus:ring-cyan-500"
              />
              <button 
                type="submit" 
                disabled={!newAnnotation.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-600 text-white disabled:opacity-0 disabled:pointer-events-none transition-all hover:bg-cyan-500"
                aria-label="Add Note"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </button>
           </form>
        </div>
      )}

      {showSettings && (
        <div className="absolute inset-0 bg-slate-900/98 z-50 p-6 rounded-3xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto custom-scrollbar border border-white/10" onMouseDown={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-white uppercase tracking-tighter text-sm">Widget Settings</h4>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white"><Icons.Settings /></button>
           </div>
           
           <div className="space-y-5">
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-500 uppercase">Metric & Dimension</label>
                 <div className="grid grid-cols-2 gap-2">
                   <select 
                      value={widget.metric || ''}
                      onChange={(e) => onUpdate(widget.id, { metric: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                   >
                      <option value="">Auto Metric</option>
                      {dataKeys.filter(k => typeof data[0]?.[k] === 'number').map(k => <option key={k} value={k}>{k}</option>)}
                   </select>
                   <select 
                      value={widget.dimension || ''}
                      onChange={(e) => onUpdate(widget.id, { dimension: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                   >
                      <option value="">Auto Dimension</option>
                      {dataKeys.map(k => <option key={k} value={k}>{k}</option>)}
                   </select>
                 </div>
              </div>

              {widget.type === VizType.VIDEO && (
                 <div className="space-y-2 pt-2 border-t border-white/10">
                   <label className="text-[9px] font-black text-cyan-500 uppercase">Video Options</label>
                   <input 
                      type="text" 
                      placeholder="Video URL"
                      value={widget.videoUrl || ''}
                      onChange={(e) => onUpdate(widget.id, { videoUrl: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-cyan-500 outline-none placeholder-slate-600 mb-2"
                   />
                   <div className="flex gap-2">
                     <input 
                        type="text" 
                        placeholder="Aspect Ratio (e.g. 16/9)"
                        value={widget.aspectRatio || ''}
                        onChange={(e) => onUpdate(widget.id, { aspectRatio: e.target.value })}
                        className="w-1/2 bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                     />
                     <div className="flex items-center gap-2 p-2 w-1/2">
                       <input 
                         type="checkbox"
                         checked={widget.autoPlay || false}
                         onChange={(e) => onUpdate(widget.id, { autoPlay: e.target.checked })}
                         className="rounded bg-black/50 border-white/10 text-cyan-500 focus:ring-cyan-500"
                       />
                       <span className="text-xs text-slate-300">AutoPlay</span>
                     </div>
                   </div>
                 </div>
              )}

              {/* Threshold Configuration */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                 <label className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Reference & Goals
                 </label>
                 <div className="flex gap-2">
                   <input 
                      type="number" 
                      placeholder="Value"
                      value={widget.referenceValue || ''}
                      onChange={(e) => onUpdate(widget.id, { referenceValue: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-1/2 bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none placeholder-slate-600"
                   />
                   <select 
                      value={widget.referenceType || 'max'}
                      onChange={(e) => onUpdate(widget.id, { referenceType: e.target.value as 'min' | 'max' })}
                      className="w-1/2 bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                   >
                      <option value="min">Goal (Min)</option>
                      <option value="max">Limit (Max)</option>
                   </select>
                 </div>
                 <p className="text-[9px] text-slate-500 leading-tight">
                   {widget.referenceType === 'min' ? 'Metrics should stay ABOVE this value.' : 'Metrics should stay BELOW this value.'}
                 </p>
              </div>
           </div>
        </div>
      )}

      {!isLocked && (
        <div 
          onMouseDown={handleResizeStart}
          className="absolute bottom-2 right-2 w-6 h-6 cursor-se-resize z-20 flex items-center justify-center text-cyan-500 opacity-0 group-hover/widget:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14m7-14v14" /></svg>
        </div>
      )}
    </div>
  );
};
