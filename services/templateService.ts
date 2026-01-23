
import { DashboardTemplate, VizType, WidgetConfig } from '../types';

const mkWidget = (tId: string, idx: number, type: VizType, title: string, x: number, y: number, w: number, h: number, metric?: string, dim?: string, secDim?: string): WidgetConfig => ({
  id: `${tId}-w${idx}`,
  type,
  title,
  x,
  y,
  w,
  h,
  metric,
  dimension: dim,
  secondaryDimension: secDim
});

export const generateTemplates = (): DashboardTemplate[] => {
  return [
    {
      id: 'personal-health',
      name: 'Vitality Tracker',
      category: 'Health',
      difficulty: 'Basic',
      description: 'Monitor your daily movement, sleep patterns, and caloric burn.',
      widgets: [
        mkWidget('health', 1, VizType.KPI_CARD, 'Avg Daily Steps', 0, 0, 3, 1, 'steps'),
        mkWidget('health', 2, VizType.KPI_CARD, 'Total Calories Burned', 3, 0, 3, 1, 'calories'),
        mkWidget('health', 3, VizType.KPI_CARD, 'Avg Sleep Hours', 6, 0, 3, 1, 'sleep_hours'),
        mkWidget('health', 4, VizType.KPI_CARD, 'Avg Mood Score', 9, 0, 3, 1, 'mood'),
        mkWidget('health', 5, VizType.TIME_SERIES, 'Activity Trends Over Time', 0, 1, 8, 3, 'steps', 'date'),
        mkWidget('health', 6, VizType.SCATTER, 'Sleep vs Mood', 8, 1, 4, 3, 'mood', 'sleep_hours'),
        mkWidget('health', 7, VizType.BAR, 'Activity by Location', 0, 4, 6, 3, 'steps', 'location'),
        mkWidget('health', 8, VizType.HEATMAP, 'Intensity Matrix', 6, 4, 6, 3, 'calories', 'activity', 'location')
      ]
    },
    {
      id: 'gaming-stats',
      name: 'Pro Gamer HUD',
      category: 'Gaming',
      difficulty: 'Advanced',
      description: 'Analyze match performance, K/D ratios, and win streaks.',
      widgets: [
        mkWidget('game', 1, VizType.KPI_CARD, 'K/D Ratio', 0, 0, 4, 1),
        mkWidget('game', 2, VizType.KPI_CARD, 'Win Rate %', 4, 0, 4, 1),
        mkWidget('game', 3, VizType.KPI_CARD, 'Headshot %', 8, 0, 4, 1),
        {
          id: 'game-video',
          type: VizType.VIDEO,
          title: 'Recent Highlight',
          x: 0, y: 1, w: 6, h: 4,
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          aspectRatio: "16/9",
          autoPlay: false
        },
        mkWidget('game', 5, VizType.BAR, 'Hero Performance', 6, 1, 6, 2),
        mkWidget('game', 4, VizType.TIME_SERIES, 'Score History', 6, 3, 6, 2),
      ]
    },
    {
      id: 'climate-watch',
      name: 'Local Climate Watch',
      category: 'Climate',
      difficulty: 'Basic',
      description: 'Track temperature fluctuations, rainfall, and air quality.',
      widgets: [
        mkWidget('clim', 1, VizType.KPI_CARD, 'Avg Temp (C)', 0, 0, 3, 1),
        mkWidget('clim', 2, VizType.KPI_CARD, 'CO2 (ppm)', 3, 0, 3, 1),
        mkWidget('clim', 3, VizType.KPI_CARD, 'Humidity %', 6, 0, 3, 1),
        mkWidget('clim', 4, VizType.KPI_CARD, 'UV Index', 9, 0, 3, 1),
        mkWidget('clim', 5, VizType.TIME_SERIES, 'Temperature Anomaly', 0, 1, 12, 3),
        mkWidget('clim', 6, VizType.HEATMAP, 'Rainfall Intensity', 0, 4, 12, 3)
      ]
    },
    {
      id: 'personal-finance',
      name: 'Budget & Savings',
      category: 'Finance',
      difficulty: 'Basic',
      description: 'Track monthly expenses, savings goals, and category breakdown.',
      widgets: [
        mkWidget('fin', 1, VizType.KPI_CARD, 'Total Spent', 0, 0, 4, 1),
        mkWidget('fin', 2, VizType.KPI_CARD, 'Savings Rate', 4, 0, 4, 1),
        mkWidget('fin', 3, VizType.KPI_CARD, 'Largest Expense', 8, 0, 4, 1),
        mkWidget('fin', 4, VizType.STACKED_BAR, 'Spend by Category', 0, 1, 8, 4),
        mkWidget('fin', 5, VizType.TABLE, 'Recent Transactions', 8, 1, 4, 4)
      ]
    }
  ];
};
