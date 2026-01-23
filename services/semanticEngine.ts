
import { SemanticModel } from '../types';

/**
 * Infers a semantic model from raw dataset.
 * Updated to be domain-agnostic for the "Data Observatory" pivot.
 * 
 * @param data - The raw array of data objects.
 * @returns A structured SemanticModel.
 */
export const inferSemanticModel = (data: any[]): SemanticModel => {
  if (data.length === 0) return {
      entities: [], metrics: [], dimensions: [], relationships: [], kpis: [], glossary: [], quality_flags: [], assumptions: []
  };

  const sample = data[0];
  const keys = Object.keys(sample);
  
  // Basic heuristic inference
  const numericKeys = keys.filter(k => typeof sample[k] === 'number');
  const stringKeys = keys.filter(k => typeof sample[k] === 'string');
  const dateKey = stringKeys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time'));
  const categoryKey = stringKeys.find(k => !k.includes('date') && !k.includes('id')) || stringKeys[0];

  const metrics = numericKeys.map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      definition: `Sum of ${key}`,
      aggregation: 'SUM',
      grain: 'Row'
  }));

  const dimensions = stringKeys.map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      type: key.includes('date') ? 'Temporal' : 'Categorical',
      examples: []
  }));

  return {
    entities: [
      { name: 'Record', description: 'Single data point', likely_keys: ['id'], example_fields: keys }
    ],
    metrics: metrics,
    dimensions: dimensions,
    relationships: [],
    kpis: metrics.slice(0, 3).map(m => ({
        name: `Avg ${m.name}`,
        metric: m.name,
        goal_direction: 'up',
        target: 'auto',
        alert_threshold: 'auto'
    })),
    glossary: [
      { term: 'Observation', meaning: 'A single recorded event or measurement', synonyms: ['Row', 'Entry'] }
    ],
    quality_flags: [],
    assumptions: []
  };
};
