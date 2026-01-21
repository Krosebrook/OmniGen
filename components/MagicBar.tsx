
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icons } from '../constants';
import { parsePrompt } from '../services/aiService';
import { WidgetConfig, SemanticModel, VizType } from '../types';

interface MagicBarProps {
  onWidgetGenerated: (widget: WidgetConfig) => void;
  semanticModel?: SemanticModel;
}

/**
 * A natural language command interface for generating dashboard widgets.
 * Features:
 * - Autocomplete suggestions based on available metrics/dimensions.
 * - AI-powered prompt parsing to infer visualization type and configuration.
 */
export const MagicBar: React.FC<MagicBarProps> = ({ onWidgetGenerated, semanticModel }) => {
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

  // Intelligent Suggestions based on Semantic Model
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    const list: { label: string; action: string; type: string }[] = [];

    // 1. Check Visualization Types
    Object.values(VizType).forEach(t => {
      if (t.toLowerCase().includes(lower)) {
        list.push({ label: `Create ${t}`, action: `Create a ${t} showing `, type: 'Chart' });
      }
    });

    if (semanticModel) {
      // 2. Check Metrics
      semanticModel.metrics.forEach(m => {
        if (m.name.toLowerCase().includes(lower)) {
          list.push({ label: `Trend: ${m.name}`, action: `Show trend of ${m.name} over time`, type: 'Metric' });
          list.push({ label: `Breakdown: ${m.name}`, action: `Show ${m.name} broken down by `, type: 'Metric' });
        }
      });

      // 3. Check Dimensions
      semanticModel.dimensions.forEach(d => {
        if (d.name.toLowerCase().includes(lower)) {
          list.push({ label: `Group by ${d.name}`, action: `Show sales grouped by ${d.name}`, type: 'Dimension' });
        }
      });
      
      // 4. Check Entities
       semanticModel.entities.forEach(e => {
        if (e.name.toLowerCase().includes(lower)) {
          list.push({ label: `Analyze ${e.name}`, action: `Analyze ${e.name} performance`, type: 'Entity' });
        }
      });
    }

    return list.slice(0, 6);
  }, [query, semanticModel]);

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50">
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-full opacity-75 blur transition duration-500 ${isGenerating ? 'animate-pulse' : 'group-hover:opacity-100'}`}></div>
        <div className="relative flex items-center bg-slate-900/90 backdrop-blur-xl rounded-full p-2 pl-4 shadow-2xl border border-white/20">
          <div className={`text-fuchsia-400 mr-3 ${isGenerating ? 'animate-spin' : ''}`}>
             <Icons.Sparkles />
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
            placeholder={isGenerating ? "Designing your widget..." : "Ask OmniGen... (e.g. 'Trend of sales over time')"}
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 font-medium text-sm"
            disabled={isGenerating}
          />
          <button 
            type="submit"
            disabled={!query.trim() || isGenerating}
            className={`p-2 rounded-full transition-all duration-300 ${query.trim() ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/50 scale-100' : 'bg-slate-800 text-slate-600 scale-90'}`}
          >
            <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && query.length > 0 && suggestions.length > 0 && (
           <div className="absolute bottom-full left-6 right-6 mb-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2">
              <div className="p-2">
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-2">Suggested Actions</div>
                 {suggestions.map((s, idx) => (
                    <button
                       key={idx}
                       type="button"
                       onClick={() => {
                           setQuery(s.action);
                           inputRef.current?.focus();
                       }}
                       className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors flex items-center justify-between group/item"
                    >
                       <span className="font-medium">{s.label}</span>
                       <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border opacity-50 group-hover/item:opacity-100 transition-opacity
                         ${s.type === 'Chart' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 
                           s.type === 'Metric' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                           'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}
                       >
                         {s.type}
                       </span>
                    </button>
                 ))}
              </div>
           </div>
        )}
      </form>
      
      {/* Default Prompt Pills */}
      {!query && !isGenerating && (
         <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 pointer-events-none">
            <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur rounded-xl text-[10px] font-bold text-slate-400 shadow-lg border border-white/10">"Show Sales Trend"</div>
            <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur rounded-xl text-[10px] font-bold text-slate-400 shadow-lg border border-white/10">"Regional Breakdown"</div>
         </div>
      )}
    </div>
  );
};
