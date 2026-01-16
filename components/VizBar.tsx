
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { VizTooltip } from './VizTooltip';

interface VizBarProps {
  data: any[];
  onDrill: (value: string) => void;
  currentLevel: string;
  drillPath: string[];
  canDrill: boolean;
}

export const VizBar: React.FC<VizBarProps> = ({ data, onDrill, currentLevel, drillPath, canDrill }) => {
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
      <BarChart data={data} onClick={handleClick} cursor="pointer">
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
          <Bar name="sales" dataKey="sales" fill="#6366f1" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-sales-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#4f46e5'} className="hover:opacity-80 transition-opacity" />
            ))}
          </Bar>
        )}
        {!hiddenSeries.has('users') && (
          <Bar name="users" dataKey="users" fill="#818cf8" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-users-${index}`} fill={index % 2 === 0 ? '#818cf8' : '#6366f1'} className="hover:opacity-80 transition-opacity" />
            ))}
          </Bar>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};
