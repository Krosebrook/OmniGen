
import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';

export interface ExportConfig {
  format: 'PNG' | 'JPG' | 'PDF';
  includeTitle: boolean;
  includeDate: boolean;
  dpi: number;
  quality: number;
  orientation: 'landscape' | 'portrait';
  paperSize: 'a4' | 'letter' | 'legal';
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: ExportConfig) => void;
  contentDimensions?: { width: number; height: number };
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onConfirm, contentDimensions }) => {
  const [config, setConfig] = useState<ExportConfig>({ 
    format: 'PNG', 
    includeTitle: true, 
    includeDate: true,
    dpi: 144, // Default to High Res / Retina
    quality: 0.9,
    orientation: 'landscape',
    paperSize: 'a4'
  });
  
  const [useCustomDpi, setUseCustomDpi] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    if (!contentDimensions) return null;
    const scale = config.dpi / 96;
    const width = Math.round(contentDimensions.width * scale);
    const height = Math.round(contentDimensions.height * scale);
    const mp = (width * height) / 1000000;
    return { width, height, mp: mp.toFixed(1) };
  }, [contentDimensions, config.dpi]);

  // Visual Preview Logic
  const previewStyle = useMemo(() => {
    let ratio = 16 / 9;
    if (config.format === 'PDF') {
      const sizes: Record<string, [number, number]> = {
        a4: [210, 297],
        letter: [216, 279],
        legal: [216, 356]
      };
      const [w, h] = sizes[config.paperSize] || sizes.a4;
      ratio = config.orientation === 'portrait' ? w / h : h / w;
    } else if (contentDimensions) {
      ratio = contentDimensions.width / contentDimensions.height;
    }
    return { aspectRatio: ratio };
  }, [config.format, config.paperSize, config.orientation, contentDimensions]);

  if (!isOpen) return null;

  const handlePreset = (type: 'screen' | 'presentation' | 'print') => {
    setUseCustomDpi(false);
    switch (type) {
        case 'screen':
            setConfig({ ...config, dpi: 72, quality: 0.8, format: 'JPG' });
            break;
        case 'presentation':
            setConfig({ ...config, dpi: 144, quality: 0.9, format: 'PNG' });
            break;
        case 'print':
            setConfig({ ...config, dpi: 300, quality: 1.0, format: 'PDF' });
            break;
    }
  };

  const handleDpiSelect = (val: number | 'custom') => {
    if (val === 'custom') {
      setUseCustomDpi(true);
    } else {
      setUseCustomDpi(false);
      setConfig({ ...config, dpi: val });
    }
  };

  const getQualityLabel = (q: number) => {
    if (q >= 1.0) return 'Lossless / Max';
    if (q >= 0.9) return 'High';
    if (q >= 0.7) return 'Balanced';
    if (q >= 0.5) return 'Medium';
    return 'Low (Draft)';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-[40rem] bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col max-h-[95vh]">
         {/* Header */}
         <div className="flex items-start justify-between mb-6 shrink-0">
             <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Export Snapshot</h3>
                <p className="text-slate-400 text-xs mt-1">Configure format and resolution settings.</p>
             </div>
             {stats && (
                 <div className="text-right">
                     <div className="text-2xl font-black text-white tracking-tight">{stats.width} <span className="text-slate-500">x</span> {stats.height}</div>
                     <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{stats.mp} Megapixels</div>
                 </div>
             )}
         </div>
         
         {/* Content */}
         <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
            
            {/* Live Preview */}
            <div className="w-full bg-slate-950/50 rounded-2xl border border-white/5 p-6 flex justify-center items-center">
              <div 
                 className="relative bg-white shadow-2xl transition-all duration-300 flex flex-col overflow-hidden ring-1 ring-white/10"
                 style={{
                   aspectRatio: previewStyle.aspectRatio,
                   height: config.orientation === 'portrait' ? '240px' : 'auto',
                   width: config.orientation === 'landscape' ? '280px' : 'auto',
                   maxWidth: '100%'
                 }}
              >
                 <div className="flex-1 bg-slate-900 p-3 flex flex-col">
                    {/* Metadata Preview */}
                    {(config.includeTitle || config.includeDate) && (
                      <div className="mb-2 space-y-1">
                        {config.includeTitle && <div className="h-2 w-2/3 bg-white/20 rounded-sm" />}
                        {config.includeDate && <div className="h-1.5 w-1/3 bg-white/10 rounded-sm" />}
                      </div>
                    )}
                    {/* Dashboard Placeholder */}
                    <div className="flex-1 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-dashed border-white/10 rounded-lg flex items-center justify-center">
                       <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Dashboard Content</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handlePreset('screen')} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 group transition-all">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white">Screen</span>
                </button>
                <button onClick={() => handlePreset('presentation')} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 group transition-all">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white">Presentation</span>
                </button>
                <button onClick={() => handlePreset('print')} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 group transition-all">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white">Print</span>
                </button>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">File Format</label>
               <div className="flex gap-2">
                  {(['PNG', 'JPG', 'PDF'] as const).map(f => (
                    <button 
                      key={f}
                      onClick={() => setConfig({ ...config, format: f })}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${config.format === f ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/20' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}
                    >
                      {f}
                    </button>
                  ))}
               </div>
            </div>

            {/* PDF Specific Settings */}
            {config.format === 'PDF' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orientation</label>
                   <div className="flex bg-white/5 p-1 rounded-xl">
                      {(['landscape', 'portrait'] as const).map(o => (
                        <button 
                          key={o}
                          onClick={() => setConfig({ ...config, orientation: o })}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${config.orientation === o ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                          {o}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paper Size</label>
                   <div className="flex bg-white/5 p-1 rounded-xl">
                      {(['a4', 'letter', 'legal'] as const).map(s => (
                        <button 
                          key={s}
                          onClick={() => setConfig({ ...config, paperSize: s })}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${config.paperSize === s ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                          {s}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {/* Resolution Control */}
            <div className="space-y-3">
               <div className="flex justify-between items-end">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resolution (DPI)</label>
                 {useCustomDpi && <span className="text-[10px] font-bold text-cyan-400">{config.dpi} DPI</span>}
               </div>
               
               <div className="flex gap-2">
                  {[72, 144, 300].map(d => (
                    <button 
                      key={d}
                      onClick={() => handleDpiSelect(d)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${!useCustomDpi && config.dpi === d ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}
                    >
                      {d} <span className="opacity-50 text-[9px] ml-1">{d === 72 ? 'Screen' : d === 144 ? 'Retina' : 'Print'}</span>
                    </button>
                  ))}
                  <button 
                    onClick={() => handleDpiSelect('custom')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${useCustomDpi ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}
                  >
                    Custom
                  </button>
               </div>

               {useCustomDpi && (
                 <div className="animate-in fade-in slide-in-from-top-2 duration-200 pt-2">
                   <input 
                      type="range" 
                      min="72" 
                      max="600" 
                      step="12"
                      value={config.dpi} 
                      onChange={(e) => setConfig({ ...config, dpi: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                   />
                   <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase mt-1">
                      <span>72 DPI</span>
                      <span>600 DPI</span>
                   </div>
                 </div>
               )}
            </div>

            {/* Quality & Metadata Split */}
            <div className="grid grid-cols-2 gap-6">
                
                {/* Metadata */}
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Metadata</label>
                   <div className="space-y-2">
                     <button 
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${config.includeTitle ? 'bg-cyan-600/10 border-cyan-500/50' : 'bg-white/5 border-white/5'}`}
                        onClick={() => setConfig({...config, includeTitle: !config.includeTitle})}
                     >
                        <span className={`text-xs font-bold ${config.includeTitle ? 'text-cyan-300' : 'text-slate-400'}`}>Include Title</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${config.includeTitle ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                          {config.includeTitle && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                     </button>
                     <button 
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${config.includeDate ? 'bg-cyan-600/10 border-cyan-500/50' : 'bg-white/5 border-white/5'}`}
                        onClick={() => setConfig({...config, includeDate: !config.includeDate})}
                     >
                        <span className={`text-xs font-bold ${config.includeDate ? 'text-cyan-300' : 'text-slate-400'}`}>Timestamp</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${config.includeDate ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                          {config.includeDate && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                     </button>
                   </div>
                </div>

                {/* Quality Slider (Context Aware) */}
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quality</label>
                   
                   {config.format === 'PNG' ? (
                       <div className="h-full bg-white/5 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center p-3">
                          <span className="text-emerald-400 mb-1"><Icons.Sparkles /></span>
                          <span className="text-[10px] font-bold text-white">Lossless</span>
                          <span className="text-[9px] text-slate-500 mt-1">Max Quality (100%)</span>
                       </div>
                   ) : (
                       <div className="h-full bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col justify-center space-y-2">
                           <div className="flex justify-between items-center">
                               <span className="text-[9px] font-bold text-slate-400">Compression</span>
                               <span className="text-[10px] font-black text-cyan-400">{Math.round(config.quality * 100)}%</span>
                           </div>
                           <input 
                                type="range" 
                                min="10" 
                                max="100" 
                                value={config.quality * 100} 
                                onChange={(e) => setConfig({ ...config, quality: Number(e.target.value) / 100 })}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                           />
                           <div className="text-center">
                               <span className="text-[9px] font-bold text-white uppercase tracking-wider">{getQualityLabel(config.quality)}</span>
                           </div>
                       </div>
                   )}
                </div>
            </div>

         </div>

         <div className="flex gap-3 pt-6 border-t border-white/10 mt-2 shrink-0">
            <button onClick={onClose} className="flex-1 py-3.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl">Cancel</button>
            <button onClick={() => onConfirm(config)} className="flex-[2] py-3.5 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2">
                <span>Download Snapshot</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
         </div>
      </div>
    </div>
  );
};
