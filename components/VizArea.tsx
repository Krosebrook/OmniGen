
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { VizTooltip } from './VizTooltip';

interface VizAreaProps {
  data: any[];
  onDrill: (value: string) => void;
  currentLevel: string;
  drillPath: string[];
  canDrill: boolean;
}

export const VizArea: React.FC<VizAreaProps> = ({ data, onDrill, currentLevel, drillPath, canDrill }) => {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const handleLegendClick = (o: any) => {
    const { dataKey } = o;
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(dataKey)) next.delete(dataKey);
      else next.add(dataKey);
      return next;
    });
  };

  const handleClick = (state: any) => {
    if (state && state.activeLabel) {
      onDrill(String(state.activeLabel));
    } else if (state && state.activePayload && state.activePayload[0]) {
      const val = state.activePayload[0].payload[currentLevel];
      if (val) onDrill(String(val));
    }
  };

  const commonAxisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fontSize: 10, fill: '#64748b', fontWeight: 600 }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} onClick={handleClick} cursor="pointer">
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey={currentLevel} {...commonAxisProps} />
        <YAxis {...commonAxisProps} />
        <Tooltip 
          content={<VizTooltip currentLevel={currentLevel} drillPath={drillPath} canDrill={canDrill} />}
          cursor={{ fill: '#6366f1', opacity: 0.1 }}
          allowEscapeViewBox={{ x: true, y: true }}
          wrapperStyle={{ zIndex: 50, outline: 'none' }}
        />
        <Legend 
          onClick={handleLegendClick}
          wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer' }}
        />
        {!hiddenSeries.has('sales') && (
          <Area type="monotone" name="sales" dataKey="sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
        )}
        {!hiddenSeries.has('users') && (
          <Area type="monotone" name="users" dataKey="users" stroke="#818cf8" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};
