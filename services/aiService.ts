
import { GoogleGenAI, Type } from "@google/genai";
import { VizType, WidgetConfig, SemanticModel } from '../types';

// Fallback heuristic logic for when API key is missing or offline
const heuristicParse = (prompt: string): WidgetConfig => {
  const lower = prompt.toLowerCase();
  const id = `ai-${Date.now()}`;
  
  let type = VizType.KPI_CARD;
  let w = 3;
  let h = 1;

  if (lower.includes('trend') || lower.includes('growth') || lower.includes('over time')) {
    type = VizType.TIME_SERIES;
    w = 6;
    h = 3;
  } else if (lower.includes('breakdown') || lower.includes('compare') || lower.includes('vs') || lower.includes('distribution')) {
    type = VizType.BAR;
    w = 6;
    h = 3;
  } else if (lower.includes('map') || lower.includes('geo')) {
    type = VizType.GEO_MAP;
    w = 6;
    h = 4;
  }

  const title = prompt.length > 5 ? prompt.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'AI Insight';

  return {
    id,
    type,
    title,
    x: 0,
    y: 0,
    w,
    h,
  };
};

export const parsePrompt = async (prompt: string, semanticModel?: SemanticModel): Promise<WidgetConfig> => {
  // 1. Check for API Key availability
  if (!process.env.API_KEY) {
    console.warn("[OmniGen] No API_KEY found. Using heuristic fallback.");
    return new Promise((resolve) => {
      setTimeout(() => resolve(heuristicParse(prompt)), 800);
    });
  }

  try {
    // 2. Initialize Gemini Client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 3. Construct Context
    const availableMetrics = semanticModel?.metrics.map(m => m.name).join(', ') || 'Sales, Users, Conversion';
    const availableDimensions = semanticModel?.dimensions.map(d => d.name).join(', ') || 'Date, Region, Category';
    
    // 4. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are an expert data visualization architect.
        User Request: "${prompt}"
        
        Available Data Fields:
        - Metrics: ${availableMetrics}
        - Dimensions: ${availableDimensions}
        
        Task: Generate a JSON configuration for a dashboard widget that best visualizes this request.
        
        Rules:
        - Choose the best 'type' from the allowed enum values.
        - 'w' (width) should be between 3 and 12. 
        - 'h' (height) should be between 1 and 4.
        - KPI cards should be small (3x1). Complex charts should be larger (6x3 or 6x4).
        - 'id' should be unique (use a random string suffix).
        - 'x' and 'y' should be 0 (the grid layout handles placement).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { 
              type: Type.STRING, 
              enum: Object.values(VizType) 
            },
            title: { type: Type.STRING },
            w: { type: Type.INTEGER },
            h: { type: Type.INTEGER },
            x: { type: Type.INTEGER },
            y: { type: Type.INTEGER }
          },
          required: ["id", "type", "title", "w", "h", "x", "y"]
        }
      }
    });

    // 5. Parse and Return
    const text = response.text;
    if (text) {
      const config = JSON.parse(text) as WidgetConfig;
      // Ensure ID is unique if the model returned a static one
      config.id = config.id || `gen-${Date.now()}`;
      return config;
    }
    
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("[OmniGen] AI Generation failed, falling back to heuristics:", error);
    return heuristicParse(prompt);
  }
};
