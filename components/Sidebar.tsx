
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
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
    >
      <Icon /> {isSidebarOpen && <span>{label}</span>}
    </button>
  );

  return (
    <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
      <div className="p-8 flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black">O</div>
        {isSidebarOpen && <span className="font-black text-2xl tracking-tighter uppercase">OmniGen</span>}
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <NavItem id="dashboard" icon={Icons.Dashboard} label="My Dashboard" />
        <NavItem id="catalog" icon={Icons.Templates} label="Templates" />
        <NavItem id="model" icon={Icons.Model} label="Semantic Model" />
        <NavItem id="trust" icon={Icons.Shield} label="Security Lab" />
      </nav>

      <div className="p-6 border-t border-slate-100 space-y-2">
        <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".csv,.json" />
        
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full bg-slate-900 text-white rounded-2xl py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[0.98] transition-transform"
        >
          <Icons.Upload /> {isSidebarOpen && "Import Data"}
        </button>
        
        <button 
          onClick={onExport} 
          className="w-full border-2 border-slate-200 text-slate-700 rounded-2xl py-3 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
        >
           {isSidebarOpen ? "Export HTML" : "HTML"}
        </button>
      </div>
    </aside>
  );
};
