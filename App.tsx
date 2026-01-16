
import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from './constants';
import { EditMode, WidgetConfig } from './types';
import { inferSemanticModel } from './services/semanticEngine';
import { generateTemplates } from './services/templateService';
import { WidgetContainer } from './components/WidgetContainer';
import { Sidebar } from './components/Sidebar';
import { MagicBar } from './components/MagicBar';
import { useDataManager } from './hooks/useDataManager';

// --- Main Application ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'model' | 'trust'>('dashboard');
  const [mode, setMode] = useState<EditMode>(EditMode.SAFE);
  const [selectedTemplateId, setSelectedTemplateId] = useState('exec-0');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Mutable state for widgets to allow AI additions
  const [dashboardWidgets, setDashboardWidgets] = useState<WidgetConfig[]>([]);

  // Generate Templates (Memoized)
  const templates = useMemo(() => generateTemplates(), []);

  const currentTemplate = useMemo(() => 
    templates.find(t => t.id === selectedTemplateId) || templates[0], 
    [templates, selectedTemplateId]
  );

  // Sync dashboard widgets when template changes
  useEffect(() => {
    setDashboardWidgets(currentTemplate.widgets);
  }, [currentTemplate]);

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
    setDashboardWidgets(prev => [...prev, newWidget]);
    // Optionally scroll to bottom or highlight new widget
  };

  return (
    <div className="flex h-screen bg-[#fcfcfd] overflow-hidden">
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        onImport={handleFileUpload}
        onExport={exportStandalone}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeTab === 'dashboard' ? currentTemplate.name : activeTab}</h2>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{currentTemplate.category}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {currentTemplate.archetype}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsStreaming(!isStreaming)} 
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isStreaming ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}
            >
              {isStreaming ? "● Live Simulation" : "Offline Mode"}
            </button>
            
            <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 border border-slate-200">
              <button 
                onClick={() => setMode(EditMode.SAFE)} 
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === EditMode.SAFE ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Safe
              </button>
              <button 
                onClick={() => setMode(EditMode.PRO)} 
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === EditMode.PRO ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
              >
                Pro
              </button>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#fdfdfd] custom-scrollbar relative">
          
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-12 gap-8 max-w-screen-2xl mx-auto pb-32">
                {dashboardWidgets.map(w => (
                  <WidgetContainer key={w.id} widget={w} mode={mode} data={data} />
                ))}
              </div>
              <MagicBar onWidgetGenerated={handleWidgetGenerated} semanticModel={semanticModel} />
            </>
          )}

          {activeTab === 'catalog' && (
            <div className="max-w-screen-xl mx-auto space-y-8 pb-20">
              <h3 className="text-4xl font-black uppercase tracking-tighter">Blueprint Catalog</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.slice(0, 15).map(t => (
                  <div key={t.id} onClick={() => { setSelectedTemplateId(t.id); setActiveTab('dashboard'); }} className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{t.category}</span>
                    <h4 className="text-2xl font-black mt-2 leading-tight group-hover:text-indigo-600 transition-colors">{t.name}</h4>
                    <p className="text-slate-500 text-sm font-medium mt-4 leading-relaxed">{t.description}</p>
                    <div className="mt-6 flex gap-2">
                       <span className="px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black uppercase border border-slate-100">{t.difficulty}</span>
                       <span className="px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black uppercase border border-slate-100">{t.archetype}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'model' && (
            <div className="max-w-4xl mx-auto bg-white rounded-[3rem] border border-slate-200 p-16 shadow-xl mb-20">
              <h3 className="text-4xl font-black uppercase tracking-tighter mb-12">Semantic Layer V1.0</h3>
              <div className="space-y-12">
                <section>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Extracted Entities</h4>
                  <div className="grid gap-4">
                    {semanticModel.entities.map(e => (
                      <div key={e.name} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-black text-slate-900">{e.name}</span>
                        <p className="text-sm text-slate-500 mt-2">{e.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Active Metrics</h4>
                   <div className="grid grid-cols-2 gap-4">
                     {semanticModel.metrics.map(m => (
                       <div key={m.name} className="p-6 border-2 border-indigo-50 rounded-2xl">
                         <span className="font-black text-slate-900">{m.name}</span>
                         <span className="block text-[10px] text-indigo-600 font-bold mt-1">{m.aggregation} / {m.grain}</span>
                       </div>
                     ))}
                   </div>
                </section>
                <pre className="bg-slate-900 text-emerald-400 p-8 rounded-3xl text-[10px] overflow-x-auto shadow-inner">
                  {JSON.stringify(semanticModel, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'trust' && (
            <div className="max-w-4xl mx-auto pb-20">
              <div className="bg-slate-900 rounded-[3.5rem] p-20 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-20 opacity-5"><Icons.Shield /></div>
                <h3 className="text-5xl font-black uppercase tracking-tighter mb-8">Trust Perimeter</h3>
                <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-xl">Our defense-in-depth approach ensures your BOH financial data and FOH customer data are isolated from prompt injection and exfiltration.</p>
                <div className="mt-12 grid grid-cols-2 gap-8">
                  <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                    <h5 className="font-black text-rose-400 uppercase tracking-widest mb-4">Prompt Injection</h5>
                    <p className="text-sm text-slate-400">Strict schema validation ensures document content is never interpreted as executable logic.</p>
                  </div>
                  <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                    <h5 className="font-black text-indigo-400 uppercase tracking-widest mb-4">XSS Defense</h5>
                    <p className="text-sm text-slate-400">Sanitizing all custom measures through a restricted expression language sandbox.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
