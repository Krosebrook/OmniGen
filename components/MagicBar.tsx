
import React, { useState, useRef, useMemo } from 'react';
import { Icons } from '../constants';
import { parsePrompt } from '../services/aiService';
import { WidgetConfig, SemanticModel } from '../types';

interface MagicBarProps {
  onWidgetGenerated: (widget: WidgetConfig) => void;
  semanticModel?: SemanticModel;
  variant?: 'hero' | 'header';
}

export const MagicBar: React.FC<MagicBarProps> = ({ onWidgetGenerated, semanticModel, variant = 'hero' }) => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsGenerating(true);
    setShowSuggestions(false);
    try {
      const widget = await parsePrompt(query, semanticModel);
      onWidgetGenerated(widget);
      setQuery('');
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    const list: { label: string; action: string; type: string }[] = [];

    if (semanticModel) {
      semanticModel.metrics.forEach(m => {
        if (m.name.toLowerCase().includes(lower)) {
          list.push({ label: `Trending ${m.name}`, action: `Show me the trend of ${m.name} over time`, type: 'Metric' });
        }
      });
      semanticModel.dimensions.forEach(d => {
        if (d.name.toLowerCase().includes(lower)) {
          list.push({ label: `By ${d.name}`, action: `Show me a breakdown by ${d.name}`, type: 'Dimension' });
        }
      });
    }
    return list.slice(0, 5);
  }, [query, semanticModel]);

  const isHeader = variant === 'header';

  return (
    <div className={`transition-all duration-500 ${isHeader ? 'w-full max-w-xl' : 'w-full py-12'}`}>
      <form onSubmit={handleSubmit} className="relative group">
        {!isHeader && (
          <div className={`absolute -inset-1 bg-gradient-to-r from-cyan-600/40 to-blue-600/40 rounded-3xl opacity-60 blur-2xl transition duration-500 ${isGenerating ? 'animate-pulse' : 'group-hover:opacity-100'}`}></div>
        )}
        
        <div className={`relative flex items-center bg-slate-900/80 backdrop-blur-3xl border transition-all duration-500 
          ${isHeader 
            ? 'rounded-xl px-3 py-1.5 border-white/5 hover:border-white/10 bg-white/5' 
            : 'rounded-[2rem] p-4 px-8 border-white/10 shadow-2xl group-hover:border-white/20'
          }
          ${isGenerating ? 'border-cyan-500/50' : ''}
        `}>
          <div className={`text-cyan-400 mr-3 transition-transform ${isGenerating ? 'animate-spin' : ''}`}>
             {isHeader ? <Icons.Search /> : <Icons.Sparkles />}
          </div>
          
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={isGenerating ? "Building..." : isHeader ? "Ask AI to build a widget..." : "Hi! What insight can I build for you?"}
            className={`flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 font-bold transition-all ${isHeader ? 'text-xs' : 'text-xl py-4'}`}
            disabled={isGenerating}
          />

          {!isHeader && (
            <button 
              type="submit"
              disabled={!query.trim() || isGenerating}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${query.trim() ? 'bg-cyan-600 text-white shadow-lg transform hover:scale-105' : 'bg-white/5 text-slate-700'}`}
            >
              {isGenerating ? "..." : "Create"}
            </button>
          )}
        </div>

        {showSuggestions && query.length > 0 && suggestions.length > 0 && (
           <div className={`absolute left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-top-4 duration-300 ${isHeader ? 'rounded-xl top-full' : 'rounded-3xl top-full mx-4'}`}>
              <div className="p-2">
                 {suggestions.map((s, idx) => (
                    <button
                       key={idx}
                       type="button"
                       onClick={() => {
                           setQuery(s.action);
                           inputRef.current?.focus();
                       }}
                       className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-white rounded-lg transition-all flex items-center justify-between group/item"
                    >
                       <span className="font-bold tracking-tight">{s.label}</span>
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-30 group-hover/item:opacity-100 transition-opacity">Suggestion</span>
                    </button>
                 ))}
              </div>
           </div>
        )}
      </form>
    </div>
  );
};
