
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Icons } from './constants';
import { EditMode, WidgetConfig, AnalysisResult, GRID_SYSTEM, VizType } from './types';
import { inferSemanticModel } from './services/semanticEngine';
import { generateTemplates } from './services/templateService';
import { generateAnalysis } from './services/aiService';
import { WidgetContainer } from './components/WidgetContainer';
import { Sidebar } from './components/Sidebar';
import { MagicBar } from './components/MagicBar';
import { AnalysisPanel } from './components/AnalysisPanel';
import { useDataManager } from './hooks/useDataManager';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'model' | 'trust'>('dashboard');
  const [mode, setMode] = useState<EditMode>(EditMode.SAFE);
  const [selectedTemplateId, setSelectedTemplateId] = useState('foh-sales-exec');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [dashboardWidgets, setDashboardWidgets] = useState<WidgetConfig[]>([]);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analyzingWidget, setAnalyzingWidget] = useState<WidgetConfig | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const templates = useMemo(() => generateTemplates(), []);
  const currentTemplate = useMemo(() => 
    templates.find(t => t.id === selectedTemplateId) || templates[0], 
    [templates, selectedTemplateId]
  );

  const { data, isStreaming, setIsStreaming, handleFileUpload } = useDataManager(currentTemplate.name);
  const semanticModel = useMemo(() => inferSemanticModel(data), [data]);

  // Sync with Template or LocalStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem(`omnigen_layout_${selectedTemplateId}`);
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

  // Persist Layout Changes
  useEffect(() => {
    if (dashboardWidgets.length > 0) {
      localStorage.setItem(`omnigen_layout_${selectedTemplateId}`, JSON.stringify(dashboardWidgets));
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
      // Simple vertical search for first available slot
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

  const handleExportPNG = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current, {
      backgroundColor: '#020617',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const link = document.createElement('a');
    link.download = `${currentTemplate.name.replace(/\s+/g, '_')}_Dashboard.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current, {
      backgroundColor: '#020617',
      scale: 1.5,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${currentTemplate.name.replace(/\s+/g, '_')}_Dashboard.pdf`);
  };

  return (
    <div className="flex h-screen overflow-hidden text-slate-200 bg-cyber">
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        onImport={handleFileUpload}
        onExport={handleExportPNG}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Global Control Header */}
        <header className="h-16 px-8 flex items-center justify-between shrink-0 glass-panel border-b border-white/5 z-40">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none">{activeTab}</h2>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{currentTemplate.name}</span>
            </div>
            <div className="h-6 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {isStreaming ? "Simulating Intelligence" : "Static Engine Ready"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10 shadow-inner">
                <button 
                  onClick={handleExportPNG}
                  className="px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-full"
                >
                  PNG
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-full"
                >
                  PDF
                </button>
             </div>
             
             <button 
                onClick={() => setMode(mode === EditMode.SAFE ? EditMode.PRO : EditMode.SAFE)}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                  mode === EditMode.PRO 
                    ? 'bg-fuchsia-600 text-white shadow-fuchsia-600/20' 
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
                }`}
             >
                <Icons.Settings />
                {mode === EditMode.PRO ? "Save Layout" : "Customize"}
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-6 lg:p-12">
          {activeTab === 'dashboard' && (
            <div className="max-w-screen-2xl mx-auto flex flex-col items-center">
              
              {/* Studio-Grade AI Input */}
              <div className="w-full max-w-4xl mb-16 relative">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-fuchsia-600/5 blur-[120px] rounded-full pointer-events-none" />
                <MagicBar 
                  onWidgetGenerated={handleWidgetGenerated} 
                  semanticModel={semanticModel} 
                  compact={dashboardWidgets.length > 0}
                />
              </div>

              {/* Zero-State Onboarding */}
              {dashboardWidgets.length === 0 && (
                <div className="text-center py-20 animate-in fade-in zoom-in duration-1000">
                   <div className="mb-8 inline-flex p-5 rounded-3xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-xl">
                      <Icons.Sparkles />
                   </div>
                   <h1 className="text-5xl font-black text-white tracking-tighter mb-6">OmniGen Intelligence</h1>
                   <p className="text-slate-400 font-medium mb-12 max-w-xl mx-auto leading-relaxed text-lg">
                     Describe the insight you need. We'll crawl your data, model the relationships, and build high-fidelity visuals automatically.
                   </p>
                   <div className="flex justify-center gap-4">
                      <button onClick={() => setDashboardWidgets(currentTemplate.widgets)} className="px-8 py-3 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-tighter hover:bg-slate-200 transition-all">Load Blueprint</button>
                      <button onClick={() => setIsStreaming(true)} className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-tighter hover:bg-white/10 transition-all">Watch Simulation</button>
                   </div>
                </div>
              )}

              {/* High-Fidelity Responsive Grid */}
              <div 
                ref={dashboardRef} 
                className="grid w-full pb-64 relative transition-all duration-500"
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
                    mode={mode} 
                    data={data} 
                    onAnalyze={handleAnalyze}
                    onResize={handleWidgetResize}
                    onMove={handleWidgetMove}
                    onUpdate={handleWidgetUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
             <div className="max-w-screen-xl mx-auto">
               <div className="flex items-end justify-between mb-12">
                 <div>
                   <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Blueprint Catalog</h1>
                   <p className="text-slate-500 font-bold mt-2 tracking-wide uppercase text-[10px]">Verified Enterprise Templates</p>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {templates.map(t => (
                   <button 
                    key={t.id} 
                    onClick={() => { setSelectedTemplateId(t.id); setActiveTab('dashboard'); }}
                    className="glass-panel p-8 rounded-[2.5rem] border border-white/5 hover:border-fuchsia-500/30 text-left transition-all group relative overflow-hidden"
                   >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-600/5 blur-3xl group-hover:bg-fuchsia-600/10 transition-all" />
                     <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">{t.category}</span>
                     <h3 className="text-2xl font-black text-white mt-2 group-hover:text-fuchsia-300 transition-colors">{t.name}</h3>
                     <p className="text-slate-400 text-sm mt-4 leading-relaxed line-clamp-2">{t.description}</p>
                     <div className="mt-8 flex items-center justify-between">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-slate-500">{t.difficulty}</span>
                        <div className="text-fuchsia-500 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <Icons.Sparkles />
                        </div>
                     </div>
                   </button>
                 ))}
               </div>
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
