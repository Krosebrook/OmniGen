
import React, { useState } from 'react';
import { Icons } from '../constants';
import { parsePrompt } from '../services/aiService';
import { WidgetConfig, SemanticModel } from '../types';

interface MagicBarProps {
  onWidgetGenerated: (widget: WidgetConfig) => void;
  semanticModel?: SemanticModel;
}

export const MagicBar: React.FC<MagicBarProps> = ({ onWidgetGenerated, semanticModel }) => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsGenerating(true);
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

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50">
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-75 blur transition duration-500 ${isGenerating ? 'animate-pulse' : 'group-hover:opacity-100'}`}></div>
        <div className="relative flex items-center bg-white/90 backdrop-blur-xl rounded-full p-2 pl-4 shadow-2xl border border-white/50">
          <div className={`text-indigo-600 mr-3 ${isGenerating ? 'animate-spin' : ''}`}>
             <Icons.Sparkles />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isGenerating ? "Designing your widget..." : "Ask OmniGen... (e.g. 'Trend of sales over time')"}
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 font-medium text-sm"
            disabled={isGenerating}
          />
          <button 
            type="submit"
            disabled={!query.trim() || isGenerating}
            className={`p-2 rounded-full transition-all duration-300 ${query.trim() ? 'bg-indigo-600 text-white shadow-lg scale-100' : 'bg-slate-100 text-slate-300 scale-90'}`}
          >
            <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
      {/* Suggestions */}
      {!query && !isGenerating && (
         <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 pointer-events-none">
            <div className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-xl text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100">"Show Sales Trend"</div>
            <div className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-xl text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100">"Regional Breakdown"</div>
         </div>
      )}
    </div>
  );
};
