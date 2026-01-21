
/**
 * OmniGen Type Definitions
 * 
 * This file contains all shared interfaces and constants for the application.
 */

/**
 * Grid Layout Configuration
 * Corresponds to Tailwind classes: grid-cols-12, gap-6 (24px), auto-rows-[100px]
 */
export const GRID_SYSTEM = {
  COLS: 12,
  ROW_HEIGHT_PX: 100,
  GAP_PX: 24, // tailwind gap-6
};

export enum EditMode {
  SAFE = 'SAFE', // Prevents overlapping widgets
  PRO = 'PRO'    // Allows advanced editing (resizing, moving)
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

/**
 * Represents the inferred semantic layer of the dataset.
 * Used by the AI to generate relevant visualizations.
 */
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

/**
 * Configuration for a single dashboard widget.
 * x, y, w, h are in Grid Units (not pixels).
 */
export interface WidgetConfig {
  id: string;
  type: VizType;
  title: string;
  metric?: string;             // The primary numeric value to plot
  dimension?: string;          // The primary grouping key (X-Axis)
  secondaryDimension?: string; // The secondary grouping key (Legend/Y-Axis)
  filter?: Record<string, any>;
  w: number; // Width in grid columns (1-12)
  h: number; // Height in grid rows
  x: number; // Column start (0-11)
  y: number; // Row start
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
  marketContext?: string;
  sources?: { title: string; uri: string }[];
}
