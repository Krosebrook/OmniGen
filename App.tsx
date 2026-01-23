
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Icons } from './constants';
import { WidgetConfig, AnalysisResult, GRID_SYSTEM } from './types';
import { inferSemanticModel } from './services/semanticEngine';
import { generateTemplates } from './services/templateService';
import { generateAnalysis } from './services/aiService';
import { WidgetContainer } from './components/WidgetContainer';
import { Sidebar } from './components/Sidebar';
import { MagicBar } from './components/MagicBar';
import { AnalysisPanel } from './components/AnalysisPanel';
import { useDataManager } from './hooks/useDataManager';
import { ExportModal, ExportConfig } from './components/ExportModal';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { ChartRenderer } from './components/ChartRenderer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'about'>('dashboard');
  const [isLocked, setIsLocked] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('personal-health');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [dashboardWidgets, setDashboardWidgets] = useState<WidgetConfig[]>([]);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analyzingWidget, setAnalyzingWidget] = useState<WidgetConfig | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const [globalFilters, setGlobalFilters] = useState<Record<string, string>>({});
  const [focusedWidget, setFocusedWidget] = useState<WidgetConfig | null>(null);
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  const templates = useMemo(() => generateTemplates(), []);
  const currentTemplate = useMemo(() => 
    templates.find(t => t.id === selectedTemplateId) || templates[0], 
    [templates, selectedTemplateId]
  );

  const { data, isStreaming, setIsStreaming, handleFileUpload } = useDataManager(currentTemplate.name);
  const semanticModel = useMemo(() => inferSemanticModel(data), [data]);

  // Apply Global Filters to Data
  const filteredData = useMemo(() => {
    let result = data;
    Object.entries(globalFilters).forEach(([key, value]) => {
        if (!value) return;
        result = result.filter(item => {
           const itemKey = Object.keys(item).find(k => k.toLowerCase() === key.toLowerCase());
           return itemKey ? String(item[itemKey]) === value : true;
        });
    });
    return result;
  }, [data, globalFilters]);

  const handleGlobalFilterChange = (key: string, value: string) => {
      setGlobalFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const savedLayout = localStorage.getItem(`flashfusion_layout_${selectedTemplateId}`);
    if (savedLayout) {
      try {
        setDashboardWidgets(JSON.parse(savedLayout));
      } catch (e) {
        setDashboardWidgets(currentTemplate.widgets);
      }
    } else {
      setDashboardWidgets(currentTemplate.widgets);
    }
  }, [currentTemplate, selectedTemplateId]);

  useEffect(() => {
    if (dashboardWidgets.length > 0) {
      localStorage.setItem(`flashfusion_layout_${selectedTemplateId}`, JSON.stringify(dashboardWidgets));
    }
  }, [dashboardWidgets, selectedTemplateId]);

  const checkCollision = (id: string, x: number, y: number, w: number, h: number, widgets: WidgetConfig[]): boolean => {
    return widgets.some(other => {
      if (other.id === id) return false;
      return (
        x < other.x + other.w &&
        x + w > other.x &&
        y < other.y + other.h &&
        y + h > other.y
      );
    });
  };

  const handleWidgetGenerated = (newWidget: WidgetConfig) => {
    setDashboardWidgets(prev => {
      let placed = false;
      let y = 0;
      const widgetToPlace = { ...newWidget };
      while (!placed && y < 50) {
        for (let x = 0; x <= GRID_SYSTEM.COLS - widgetToPlace.w; x++) {
           if (!checkCollision(widgetToPlace.id, x, y, widgetToPlace.w, widgetToPlace.h, prev)) {
             widgetToPlace.x = x;
             widgetToPlace.y = y;
             placed = true;
             break;
           }
        }
        y++;
      }
      return [...prev, widgetToPlace];
    });
  };

  const handleWidgetResize = useCallback((id: string, newW: number, newH: number) => {
    setDashboardWidgets(prev => {
      const target = prev.find(w => w.id === id);
      if (!target) return prev;
      if (target.x + newW > GRID_SYSTEM.COLS) return prev;
      if (checkCollision(id, target.x, target.y, newW, newH, prev)) return prev;
      return prev.map(w => w.id === id ? { ...w, w: newW, h: newH } : w);
    });
  }, []);

  const handleWidgetMove = useCallback((id: string, newX: number, newY: number) => {
    setDashboardWidgets(prev => {
      const target = prev.find(w => w.id === id);
      if (!target) return prev;
      if (newX < 0 || newX + target.w > GRID_SYSTEM.COLS || newY < 0) return prev;
      if (checkCollision(id, newX, newY, target.w, target.h, prev)) return prev;
      return prev.map(w => w.id === id ? { ...w, x: newX, y: newY } : w);
    });
  }, []);

  const handleWidgetUpdate = useCallback((id: string, updates: Partial<WidgetConfig>) => {
    setDashboardWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const handleAnalyze = async (widget: WidgetConfig, currentData: any[]) => {
    setAnalyzingWidget(widget);
    setIsAnalysisOpen(true);
    setAnalysisResult(null);
    setIsAnalyzing(true);
    const result = await generateAnalysis(widget.title, currentData);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const processExport = async (config: ExportConfig) => {
    if (!dashboardRef.current) return;
    setIsExportModalOpen(false);
    
    // 1. Capture Dashboard Canvas
    const scale = config.dpi / 96;
    const canvas = await html2canvas(dashboardRef.current, {
      backgroundColor: '#020617',
      scale: scale,
      useCORS: true,
      logging: false,
    });

    // 2. Prepare Composition Canvas (for metadata)
    let finalCanvas = canvas;
    
    if (config.includeTitle || config.includeDate) {
        const titleHeight = config.includeTitle ? 60 * scale : 0;
        const dateHeight = config.includeDate ? 30 * scale : 0;
        const padding = 40 * scale;
        const totalHeaderHeight = titleHeight + dateHeight + (config.includeTitle || config.includeDate ? padding : 0);

        const compositCanvas = document.createElement('canvas');
        compositCanvas.width = canvas.width + (padding * 2);
        compositCanvas.height = canvas.height + totalHeaderHeight + padding;

        const ctx = compositCanvas.getContext('2d');
        if (ctx) {
            // Fill Background
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, compositCanvas.width, compositCanvas.height);

            // Draw Metadata
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            let currentY = padding;

            if (config.includeTitle) {
                ctx.fillStyle = '#f1f5f9'; // slate-100
                ctx.font = `900 ${32 * scale}px Inter, sans-serif`;
                ctx.fillText(currentTemplate.name, padding, currentY);
                currentY += titleHeight;
            }

            if (config.includeDate) {
                ctx.fillStyle = '#94a3b8'; // slate-400
                ctx.font = `500 ${14 * scale}px Inter, sans-serif`;
                ctx.fillText(new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), padding, currentY);
                currentY += dateHeight;
            }

            if (config.includeTitle || config.includeDate) {
                currentY += (10 * scale); // spacer
            }

            // Draw captured dashboard
            ctx.drawImage(canvas, padding, currentY);
            finalCanvas = compositCanvas;
        }
    }

    // 3. Output Generation
    const filename = `${currentTemplate.name.replace(/\s+/g, '_')}`;

    if (config.format === 'PDF') {
        const pdf = new jsPDF({
            orientation: config.orientation,
            unit: 'mm',
            format: config.paperSize
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Convert canvas to image data
        const imgData = finalCanvas.toDataURL('image/jpeg', config.quality);

        // Calculate fit dimensions
        const imgRatio = finalCanvas.width / finalCanvas.height;
        let finalW = pageWidth;
        let finalH = pageWidth / imgRatio;

        if (finalH > pageHeight) {
            finalH = pageHeight;
            finalW = pageHeight * imgRatio;
        }
        
        // Center alignment
        const x = (pageWidth - finalW) / 2;
        const y = (pageHeight - finalH) / 2;

        pdf.addImage(imgData, 'JPEG', x, y, finalW, finalH);
        pdf.save(`${filename}.pdf`);
    } else {
        const mime = config.format === 'JPG' ? 'image/jpeg' : 'image/png';
        const ext = config.format === 'JPG' ? 'jpg' : 'png';
        const dataUrl = finalCanvas.toDataURL(mime, config.quality);
        
        const link = document.createElement('a');
        link.download = `${filename}.${ext}`;
        link.href = dataUrl;
        link.click();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-slate-200 bg-cyber selection:bg-cyan-500/30 font-inter">
      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        onConfirm={processExport} 
        contentDimensions={dashboardRef.current ? { 
            width: dashboardRef.current.scrollWidth, 
            height: dashboardRef.current.scrollHeight 
        } : undefined}
      />

      {focusedWidget && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
           <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
              <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{focusedWidget.type} Focus</span>
                  <h2 className="text-2xl font-black text-white">{focusedWidget.title}</h2>
              </div>
              <button 
                onClick={() => setFocusedWidget(null)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                aria-label="Close Focus View"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
           <div className="flex-1 p-12 overflow-hidden">
               <div className="w-full h-full bg-slate-900/50 rounded-[2rem] border border-white/5 p-8 shadow-2xl relative">
                   <ChartRenderer 
                     config={focusedWidget} 
                     data={filteredData}
                     onDrill={() => {}}
                     currentLevel="none"
                     drillPath={[]}
                     canDrill={false}
                   />
               </div>
           </div>
        </div>
      )}

      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        onImport={handleFileUpload}
        onExport={() => setIsExportModalOpen(true)}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 px-6 flex items-center justify-between shrink-0 glass-panel border-b border-white/5 z-40 bg-slate-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-6 flex-1">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                   <Icons.Sparkles />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-white tracking-tight leading-none">FLASHFUSION</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{currentTemplate.name}</span>
                </div>
             </div>
             
             <div className="hidden lg:block flex-1 max-w-xl mx-6">
                <MagicBar 
                  onWidgetGenerated={handleWidgetGenerated} 
                  semanticModel={semanticModel} 
                  variant="header"
                />
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-slate-500'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                  {isStreaming ? "Live" : "Static"}
                </span>
             </div>
             
             <button 
                onClick={() => setIsLocked(!isLocked)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  !isLocked 
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' 
                    : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10'
                }`}
                aria-label={isLocked ? "Unlock Dashboard" : "Lock Dashboard"}
             >
                {isLocked ? <Icons.Lock /> : <Icons.Unlock />}
                {isLocked ? "Locked" : "Editing"}
             </button>
          </div>
        </header>

        <GlobalFilterBar 
           semanticModel={semanticModel} 
           data={data} 
           filters={globalFilters} 
           onFilterChange={handleGlobalFilterChange} 
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-[1920px] mx-auto flex flex-col items-center">
              
              <div className="lg:hidden w-full mb-8">
                 <MagicBar onWidgetGenerated={handleWidgetGenerated} semanticModel={semanticModel} />
              </div>

              {dashboardWidgets.length === 0 && (
                <div className="text-center py-32 animate-in fade-in zoom-in duration-500">
                   <div className="mb-6 inline-flex p-5 rounded-[2rem] bg-white/5 text-cyan-400 border border-white/10">
                      <Icons.Sparkles />
                   </div>
                   <h1 className="text-4xl font-black text-white tracking-tighter mb-4">Start your story</h1>
                   <p className="text-slate-400 font-medium mb-8 max-w-md mx-auto">
                     Use the command bar above to generate insights, or load a blueprint to get started.
                   </p>
                   <button onClick={() => setDashboardWidgets(currentTemplate.widgets)} className="px-6 py-3 bg-white text-slate-950 rounded-xl font-bold uppercase tracking-tight hover:bg-slate-200 transition-all">Load Blueprint</button>
                </div>
              )}

              <div 
                ref={dashboardRef} 
                className="grid w-full pb-32 relative transition-all duration-300"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SYSTEM.COLS}, minmax(0, 1fr))`,
                  gap: `${GRID_SYSTEM.GAP_PX}px`,
                  gridAutoRows: `${GRID_SYSTEM.ROW_HEIGHT_PX}px`
                }}
              >
                {dashboardWidgets.map(w => (
                  <WidgetContainer 
                    key={w.id} 
                    widget={w} 
                    isLocked={isLocked}
                    data={filteredData} 
                    onAnalyze={handleAnalyze}
                    onResize={handleWidgetResize}
                    onMove={handleWidgetMove}
                    onUpdate={handleWidgetUpdate}
                    onMaximize={setFocusedWidget} 
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'library' && (
             <div className="max-w-screen-xl mx-auto">
               <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Library</h1>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {templates.map(t => (
                   <button 
                    key={t.id} 
                    onClick={() => { setSelectedTemplateId(t.id); setActiveTab('dashboard'); }}
                    className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-cyan-500/30 text-left transition-all group relative overflow-hidden bg-slate-900/40 focus:ring-2 focus:ring-cyan-500 outline-none"
                   >
                     <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-600/5 blur-3xl group-hover:bg-cyan-600/10 transition-all" />
                     <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">{t.category}</span>
                     <h3 className="text-xl font-black text-white mt-1 group-hover:text-cyan-300 transition-colors">{t.name}</h3>
                     <p className="text-slate-400 text-xs mt-3 leading-relaxed line-clamp-2">{t.description}</p>
                   </button>
                 ))}
               </div>
             </div>
          )}

          {activeTab === 'about' && (
             <div className="max-w-3xl mx-auto text-center py-20">
                <div className="inline-flex p-6 rounded-full bg-white/5 border border-white/10 mb-8">
                   <Icons.Shield />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Privacy First</h2>
                <p className="text-slate-300 leading-relaxed mb-8 text-lg">
                   FlashFusion Observatory runs entirely in your browser. Your personal data is processed locally and never sent to our servers.
                </p>
             </div>
          )}
        </div>
        
        <AnalysisPanel 
          isOpen={isAnalysisOpen} 
          onClose={() => setIsAnalysisOpen(false)} 
          widget={analyzingWidget}
          analysis={analysisResult}
          isLoading={isAnalyzing}
        />
      </main>
    </div>
  );
};

export default App;
