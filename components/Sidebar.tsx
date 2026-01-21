
import React, { useRef } from 'react';
import { Icons } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'catalog' | 'model' | 'trust') => void;
  isSidebarOpen: boolean;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  onImport, 
  onExport 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all border ${activeTab === id ? 'bg-fuchsia-600/20 border-fuchsia-500/30 text-white shadow-[0_0_15px_rgba(192,38,211,0.2)]' : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
    >
      <Icon /> {isSidebarOpen && <span>{label}</span>}
    </button>
  );

  return (
    <aside className={`glass-panel border-r border-white/10 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
      <div className="p-8 flex items-center gap-4">
        {/* Stylized 'F' Logo */}
        <div className="relative w-10 h-10 flex-shrink-0">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 80C20 80 35 70 35 50C35 30 60 10 85 10" stroke="url(#paint0_linear)" strokeWidth="12" strokeLinecap="round"/>
                <path d="M35 50H70" stroke="url(#paint1_linear)" strokeWidth="12" strokeLinecap="round"/>
                <defs>
                    <linearGradient id="paint0_linear" x1="20" y1="80" x2="85" y2="10" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#8B5CF6"/>
                        <stop offset="1" stopColor="#EC4899"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear" x1="35" y1="50" x2="70" y2="50" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#EC4899"/>
                        <stop offset="1" stopColor="#F472B6"/>
                    </linearGradient>
                </defs>
            </svg>
             <div className="absolute inset-0 bg-fuchsia-500/20 blur-lg rounded-full"></div>
        </div>
        {isSidebarOpen && <span className="font-black text-2xl tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">OmniGen</span>}
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <NavItem id="dashboard" icon={Icons.Dashboard} label="My Dashboard" />
        <NavItem id="catalog" icon={Icons.Templates} label="Templates" />
        <NavItem id="model" icon={Icons.Model} label="Semantic Model" />
        <NavItem id="trust" icon={Icons.Shield} label="Security Lab" />
      </nav>

      <div className="p-6 border-t border-white/5 space-y-2">
        <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".csv,.json" />
        
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full bg-slate-100 text-slate-900 rounded-2xl py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[0.98] transition-transform shadow-lg shadow-white/5"
        >
          <Icons.Upload /> {isSidebarOpen && "Import Data"}
        </button>
        
        <button 
          onClick={onExport} 
          className="w-full border border-white/10 text-slate-400 rounded-2xl py-3 text-xs font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-colors"
        >
           {isSidebarOpen ? "Export HTML" : "HTML"}
        </button>
      </div>
    </aside>
  );
};
