
import { DashboardTemplate, VizType } from '../types';
import { CATEGORIES } from '../constants';

export const generateTemplates = (): DashboardTemplate[] => {
  const list: DashboardTemplate[] = [];
  CATEGORIES.forEach((cat) => {
    for (let i = 0; i < 5; i++) {
      const id = `${cat.toLowerCase().slice(0, 3)}-${i}`;
      list.push({
        id,
        name: `${cat} ${i === 0 ? 'Executive' : 'Ops'} Board`,
        category: cat,
        archetype: i === 0 ? 'Executive' : 'Ops',
        difficulty: i === 0 ? 'Novice' : 'Pro',
        description: `Comprehensive analytics for ${cat} departmental efficiency.`,
        widgets: [
          { id: `${id}-k1`, type: VizType.KPI_CARD, title: 'Primary Metric', x: 0, y: 0, w: 3, h: 1 },
          { id: `${id}-k2`, type: VizType.KPI_CARD, title: 'Efficiency %', x: 3, y: 0, w: 3, h: 1 },
          { id: `${id}-w1`, type: VizType.TIME_SERIES, title: 'Growth Trends', x: 0, y: 1, w: 6, h: 3 },
          { id: `${id}-w2`, type: VizType.BAR, title: 'Regional Split', x: 6, y: 1, w: 6, h: 3 },
        ]
      });
    }
  });
  return list;
};
