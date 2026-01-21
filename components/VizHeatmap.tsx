
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';

interface VizHeatmapProps {
  data: any[];
  xKey: string;
  yKey: string;
  valKey: string;
}

export const VizHeatmap: React.FC<VizHeatmapProps> = ({ data, xKey, yKey, valKey }) => {
  // Normalize value for opacity/color
  const maxVal = Math.max(...data.map(d => d[valKey] || 0));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
        <XAxis 
            dataKey={xKey} 
            type="category" 
            name={xKey} 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
            tickLine={false}
            axisLine={false}
            interval={0}
        />
        <YAxis 
            dataKey={yKey} 
            type="category" 
            name={yKey} 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
            tickLine={false}
            axisLine={false}
        />
        <ZAxis type="number" dataKey={valKey} range={[0, 500]} />
        <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }}
            itemStyle={{ color: '#f8fafc' }}
        />
        <Scatter data={data} shape="square">
          {data.map((entry, index) => {
            const opacity = 0.3 + (0.7 * (entry[valKey] / maxVal));
            return <Cell key={`cell-${index}`} fill={`rgba(236, 72, 153, ${opacity})`} stroke="#db2777" strokeWidth={1} />;
          })}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};
