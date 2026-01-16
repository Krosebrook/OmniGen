
export enum EditMode {
  SAFE = 'SAFE',
  PRO = 'PRO'
}

export enum VizType {
  TABLE = 'table',
  PIVOT = 'pivot',
  TIME_SERIES = 'time-series',
  FUNNEL = 'funnel',
  COHORT = 'cohort',
  GEO_MAP = 'geo-map',
  SANKEY = 'sankey',
  NETWORK = 'network',
  BAR = 'bar',
  COLUMN = 'column',
  STACKED_BAR = 'stacked-bar',
  SCATTER = 'scatter',
  HISTOGRAM = 'histogram',
  HEATMAP = 'heatmap',
  TREEMAP = 'treemap',
  BOX_PLOT = 'box-plot',
  GAUGE = 'gauge',
  WATERFALL = 'waterfall',
  KPI_CARD = 'kpi-card'
}

export interface SemanticModel {
  entities: { name: string; description: string; likely_keys: string[]; example_fields: string[] }[];
  metrics: { name: string; definition: string; aggregation: string; grain: string; caveats?: string }[];
  dimensions: { name: string; type: string; examples: string[] }[];
  relationships: { from_entity: string; to_entity: string; join_keys: string[]; join_type: string; confidence: number }[];
  kpis: { name: string; metric: string; goal_direction: 'up' | 'down'; target: string; alert_threshold: string }[];
  glossary: { term: string; meaning: string; synonyms: string[] }[];
  quality_flags: { issue: string; impacted_fields: string[]; severity: 'low' | 'medium' | 'high'; suggested_fix: string }[];
  assumptions: { assumption: string; impact: string; confirm_by: string }[];
}

export interface WidgetConfig {
  id: string;
  type: VizType;
  title: string;
  metric?: string;
  dimension?: string;
  secondaryDimension?: string;
  filter?: Record<string, any>;
  w: number;
  h: number;
  x: number;
  y: number;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  category: string;
  archetype: 'Executive' | 'Ops' | 'Analyst';
  description: string;
  widgets: WidgetConfig[];
  difficulty: 'Novice' | 'Intermediate' | 'Pro';
}

export interface AnalysisResult {
  summary: string;
  drivers: string[];
  recommendations: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}
