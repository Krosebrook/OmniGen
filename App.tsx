
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Icons } from './constants';
import { EditMode, WidgetConfig, AnalysisResult, GRID_SYSTEM } from './types';
import { inferSemanticModel } from './services/semanticEngine';
import { generateTemplates } from './services/templateService';
import { generateAnalysis } from './services/aiService';
import { WidgetContainer } from './components/WidgetContainer';
import { Sidebar } from './components/Sidebar';
import { MagicBar } from './components/MagicBar';
import { AnalysisPanel } from './components/AnalysisPanel';
import { useDataManager } from './hooks/useDataManager';

// Use global html2canvas and jspdf from import map
declare const html2canvas: any;
declare const jspdf: any;

// --- Main Application ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'model' | 'trust'>('dashboard');
  const [mode, setMode] = useState<EditMode>(EditMode.SAFE);
  const [selectedTemplateId, setSelectedTemplateId] = useState('foh-sales-exec');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Mutable state for widgets to allow AI additions and persistence
  const [dashboardWidgets, setDashboardWidgets] = useState<WidgetConfig[]>([]);

  // Analysis Panel State
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analyzingWidget, setAnalyzingWidget] = useState<WidgetConfig | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Generate Templates (Memoized)
  const templates = useMemo(() => generateTemplates(), []);

  const currentTemplate = useMemo(() => 
    templates.find(t => t.id === selectedTemplateId) || templates[0], 
    [templates, selectedTemplateId]
  );

  // Load widgets from LocalStorage or fallback to template
  useEffect(() => {
    const savedLayout = localStorage.getItem(`omnigen_layout_${selectedTemplateId}`);
    if (savedLayout) {
      try {
        setDashboardWidgets(JSON.parse(savedLayout));
      } catch (e) {
        console.error("Failed to load saved layout", e);
        setDashboardWidgets(currentTemplate.widgets);
      }
    } else {
      setDashboardWidgets(currentTemplate.widgets);
    }
  }, [currentTemplate, selectedTemplateId]);

  // Save widgets to LocalStorage whenever they change
  useEffect(() => {
    if (dashboardWidgets.length > 0) {
      localStorage.setItem(`omnigen_layout_${selectedTemplateId}`, JSON.stringify(dashboardWidgets));
    }
  }, [dashboardWidgets, selectedTemplateId]);

  // Data Logic Hook
  const { 
    data, 
    isStreaming, 
    setIsStreaming, 
    handleFileUpload, 
    exportStandalone 
  } = useDataManager(currentTemplate.name);

  const semanticModel = useMemo(() => inferSemanticModel(data), [data]);

  const handleWidgetGenerated = (newWidget: WidgetConfig) => {
    setDashboardWidgets(prev => {
      // Find first available spot using GRID_SYSTEM constants
      let placed = false;
      let y = 0;
      // Search up to 20 rows down for a spot
      while (!placed && y < 20) {
        for (let x = 0; x <= GRID_SYSTEM.COLS - newWidget.w; x++) {
           const collision = prev.some(w => 
             x < w.x + w.w && x + newWidget.w > w.x &&
             y < w.y + w.h && y + newWidget.h > w.y
           );
           if (!collision) {
             newWidget.x = x;
             newWidget.y = y;
             placed = true;
             break;
           }
        }
        y++;
      }
      return [...prev, newWidget];
    });
  };

  const handleWidgetResize = useCallback((id: string, newW: number, newH: number) => {
    setDashboardWidgets(prev => {
        const widget = prev.find(w => w.id === id);
        if (!widget) return prev;

        // Collision Check for Resize
        const collision = prev.some(w => 
            w.id !== id &&
            widget.x < w.x + w.w && widget.x + newW > w.x &&
            widget.y < w.y + w.h && widget.y + newH > w.y
        );

        if (collision) return prev; // Block resize if it hits another widget

        return prev.map(w => w.id === id ? { ...w, w: newW, h: newH } : w);
    });
  }, []);

  const handleWidgetMove = useCallback((id: string, newX: number, newY: number) => {
    setDashboardWidgets(prev => {
        const widget = prev.find(w => w.id === id);
        if (!widget) return prev;

        // Collision Check for Move
        const hasCollision = prev.some(w => {
            if (w.id === id) return false;
            // Intersection test (AABB)
            return newX < w.x + w.w &&
                   newX + widget.w > w.x &&
                   newY < w.y + w.h &&
                   newY + widget.h > w.y;
        });

        if (hasCollision) return prev; // Block move

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

    // Call AI Service
    const result = await generateAnalysis(widget.title, currentData);
    
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    try {
        const canvas = await html2canvas(dashboardRef.current, { scale: 2, backgroundColor: '#020617' });
        const imgData = canvas.toDataURL('image/png');
        // A4 Landscape roughly
        const pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('dashboard.pdf');
    } catch (e) {
        console.error("PDF Export failed", e);
    }
  };

  const handleExportImage = async () => {
      if (!dashboardRef.current) return;
      try {
          const canvas = await html2canvas(dashboardRef.current, { scale: 2, backgroundColor: '#020617' });
          const link = document.createElement('a');
          link.download = 'dashboard.png';
          link.href = canvas.toDataURL();
          link.click();
      } catch (e) {
          console.error("Image Export failed", e);
      }
  };

  return (
    <div className="flex h-screen overflow-hidden text-slate-200">
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        onImport={handleFileUpload}
        onExport={exportStandalone}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-white/10 px-10 flex items-center justify-between shrink-0 glass-panel">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight drop-shadow-lg">{activeTab === 'dashboard' ? currentTemplate.name : activeTab}</h2>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">{currentTemplate.category}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">• {currentTemplate.archetype}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Export Dropdown */}
            <div className="relative group">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 glass-panel rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                    <button onClick={handleExportImage} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white">Save as PNG</button>
                    <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white">Save as PDF</button>
                </div>
            </div>

            <button 
              onClick={() => setIsStreaming(!isStreaming)} 
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isStreaming ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}
            >
              {isStreaming ? "● Simulation" : "Offline"}
            </button>
            
            <div className="flex items-center bg-black/20 rounded-2xl p-1.5 border border-white/10">
              <button 
                onClick={() => setMode(EditMode.SAFE)} 
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === EditMode.SAFE ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Safe
              </button>
              <button 
                onClick={() => setMode(EditMode.PRO)} 
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === EditMode.PRO ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Pro
              </button>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          
          {activeTab === 'dashboard' && (
            <>
              <div 
                ref={dashboardRef} 
                className="grid max-w-screen-2xl mx-auto pb-32 relative transition-all"
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
              <MagicBar onWidgetGenerated={handleWidgetGenerated} semanticModel={semanticModel} />
            </>
          )}

          {activeTab === 'catalog' && (
            <div className="max-w-screen-xl mx-auto space-y-8 pb-20">
              <h3 className="text-4xl font-black uppercase tracking-tighter text-white drop-shadow-md">Blueprint Catalog</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map(t => (
                  <div key={t.id} onClick={() => { setSelectedTemplateId(t.id); setActiveTab('dashboard'); }} className="glass-panel p-8 rounded-[2rem] hover:shadow-2xl hover:shadow-purple-500/10 transition-all cursor-pointer group hover:-translate-y-1 hover:border-purple-500/30">
                    <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">{t.category}</span>
                    <h4 className="text-2xl font-black mt-2 leading-tight text-white group-hover:text-fuchsia-300 transition-colors">{t.name}</h4>
                    <p className="text-slate-400 text-sm font-medium mt-4 leading-relaxed">{t.description}</p>
                    <div className="mt-6 flex gap-2">
                       <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase border border-white/10 text-slate-300">{t.difficulty}</span>
                       <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase border border-white/10 text-slate-300">{t.archetype}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'model' && (
            <div className="max-w-4xl mx-auto glass-panel rounded-[3rem] p-16 shadow-2xl mb-20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-32 bg-purple-600/20 blur-[100px] rounded-full"></div>
              <h3 className="text-4xl font-black uppercase tracking-tighter mb-12 text-white relative z-10">Semantic Layer V1.0</h3>
              <div className="space-y-12 relative z-10">
                <section>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Extracted Entities</h4>
                  <div className="grid gap-4">
                    {semanticModel.entities.map(e => (
                      <div key={e.name} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors">
                        <span className="font-black text-fuchsia-300">{e.name}</span>
                        <p className="text-sm text-slate-400 mt-2">{e.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                   <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Active Metrics</h4>
                   <div className="grid grid-cols-2 gap-4">
                     {semanticModel.metrics.map(m => (
                       <div key={m.name} className="p-6 border border-white/10 bg-white/5 rounded-2xl">
                         <span className="font-black text-cyan-300">{m.name}</span>
                         <span className="block text-[10px] text-slate-500 font-bold mt-1">{m.aggregation} / {m.grain}</span>
                       </div>
                     ))}
                   </div>
                </section>
                <pre className="bg-black/50 text-emerald-400 p-8 rounded-3xl text-[10px] overflow-x-auto shadow-inner border border-white/5">
                  {JSON.stringify(semanticModel, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'trust' && (
            <div className="max-w-4xl mx-auto pb-20">
              <div className="glass-panel rounded-[3.5rem] p-20 text-white shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 p-20 opacity-10 text-fuchsia-500"><Icons.Shield /></div>
                <h3 className="text-5xl font-black uppercase tracking-tighter mb-8">Trust Perimeter</h3>
                <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-xl">Our defense-in-depth approach ensures your BOH financial data and FOH customer data are isolated from prompt injection and exfiltration.</p>
                <div className="mt-12 grid grid-cols-2 gap-8">
                  <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                    <h5 className="font-black text-rose-400 uppercase tracking-widest mb-4">Prompt Injection</h5>
                    <p className="text-sm text-slate-400">Strict schema validation ensures document content is never interpreted as executable logic.</p>
                  </div>
                  <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                    <h5 className="font-black text-cyan-400 uppercase tracking-widest mb-4">XSS Defense</h5>
                    <p className="text-sm text-slate-400">Sanitizing all custom measures through a restricted expression language sandbox.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Analysis Panel Overlay */}
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
