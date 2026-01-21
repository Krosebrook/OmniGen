
import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface VizTreemapProps {
  data: any[];
}

const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, payload, colors, name } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth < 2 ? colors[index % colors.length] : 'none',
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {depth === 1 ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 7}
          textAnchor="middle"
          fill="#fff"
          fontSize={10}
          fontWeight="bold"
        >
          {name}
        </text>
      ) : null}
    </g>
  );
};

export const VizTreemap: React.FC<VizTreemapProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={data}
        dataKey="size"
        aspectRatio={4 / 3}
        stroke="#fff"
        fill="#8884d8"
        content={<CustomizedContent colors={['#8b5cf6', '#ec4899', '#a855f7', '#d946ef', '#6366f1', '#06b6d4']} />}
      >
        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }} />
      </Treemap>
    </ResponsiveContainer>
  );
};
