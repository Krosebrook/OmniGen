
import React from 'react';
import { AnalysisResult, WidgetConfig } from '../types';
import { Icons } from '../constants';

interface AnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  widget: WidgetConfig | null;
  analysis: AnalysisResult | null;
  isLoading: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ isOpen, onClose, widget, analysis, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-100">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="text-indigo-600"><Icons.Sparkles /></div>
          <h3 className="font-black text-slate-800 uppercase tracking-tight">Omni-Analyst</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
            <div className="h-20 bg-slate-100 rounded"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            <div className="h-32 bg-slate-100 rounded"></div>
          </div>
        ) : analysis ? (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Context</span>
              <h4 className="font-bold text-slate-800 text-lg leading-tight">{widget?.title}</h4>
            </div>

            <section>
              <h5 className="flex items-center gap-2 font-black text-slate-800 uppercase tracking-widest text-xs mb-3">
                <span className={`w-2 h-2 rounded-full ${analysis.sentiment === 'positive' ? 'bg-emerald-500' : analysis.sentiment === 'negative' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                Executive Summary
              </h5>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {analysis.summary}
              </p>
            </section>

            <section>
              <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-3">Key Drivers</h5>
              <ul className="space-y-3">
                {analysis.drivers.map((driver, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700">
                    <span className="text-indigo-400 font-bold">•</span>
                    {driver}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-3">Strategic Actions</h5>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="mt-0.5 text-emerald-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-600 font-medium">{rec}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        ) : (
          <div className="text-center text-slate-400 py-10">
            <p>Select a chart to generate insights.</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center">
        Powered by Google Gemini 2.5 Flash
      </div>
    </div>
  );
};
