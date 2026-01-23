
import { GoogleGenAI, Type } from "@google/genai";
import { VizType, WidgetConfig, SemanticModel, AnalysisResult } from '../types';

// Fallback heuristic logic for when API key is missing or offline
const heuristicParse = (prompt: string): WidgetConfig => {
  const lower = prompt.toLowerCase();
  const id = `ai-${Date.now()}`;
  
  let type = VizType.KPI_CARD;
  let w = 3;
  let h = 1;

  if (lower.includes('scatter') || lower.includes('correlation') || lower.includes('relationship')) {
    type = VizType.SCATTER;
    w = 6;
    h = 4;
  } else if (lower.includes('heat') || lower.includes('matrix') || lower.includes('density')) {
    type = VizType.HEATMAP;
    w = 6;
    h = 4;
  } else if (lower.includes('tree') || lower.includes('hierarchy') || lower.includes('composition')) {
    type = VizType.TREEMAP;
    w = 8;
    h = 4;
  } else if (lower.includes('flow') || lower.includes('journey') || lower.includes('sankey')) {
    type = VizType.SANKEY;
    w = 12;
    h = 4;
  } else if (lower.includes('trend') || lower.includes('growth') || lower.includes('over time')) {
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
  } else if (lower.includes('funnel') || lower.includes('conversion') || lower.includes('pipeline')) {
      type = VizType.FUNNEL;
      w = 6;
      h = 3;
  }

  const title = prompt.length > 5 ? prompt.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Insight Generated';

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

const smartSampleData = (data: any[]): any[] => {
  if (data.length <= 50) return data;
  const sample = data[0];
  const numericKeys = Object.keys(sample).filter(k => typeof sample[k] === 'number');
  const stringKeys = Object.keys(sample).filter(k => typeof sample[k] === 'string');
  const groupKey = stringKeys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('category') || k.toLowerCase().includes('region')) || stringKeys[0] || 'id';

  const grouped: Record<string, any> = {};
  data.forEach(row => {
    const key = row[groupKey];
    if (!grouped[key]) {
      grouped[key] = { ...row };
      numericKeys.forEach(nk => grouped[key][nk] = 0);
    }
    numericKeys.forEach(nk => grouped[key][nk] += (row[nk] || 0));
  });

  let result = Object.values(grouped);
  if (result.length > 30 && numericKeys.length > 0) {
      const sortKey = numericKeys[0];
      result.sort((a, b) => b[sortKey] - a[sortKey]);
      result = result.slice(0, 30);
  }
  return result.slice(0, 30);
};

export const parsePrompt = async (prompt: string, semanticModel?: SemanticModel): Promise<WidgetConfig> => {
  if (!process.env.API_KEY) {
    console.warn("[FlashFusion] No API_KEY found. Using heuristic fallback.");
    return new Promise((resolve) => {
      setTimeout(() => resolve(heuristicParse(prompt)), 800);
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const availableMetrics = semanticModel?.metrics.map(m => m.name).join(', ') || 'Sales, Users, Conversion';
    const availableDimensions = semanticModel?.dimensions.map(d => d.name).join(', ') || 'Date, Region, Category';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a friendly, expert data visualization guide for FlashFusion.
        The user wants to see: "${prompt}"
        
        Available Data:
        - Metrics: ${availableMetrics}
        - Dimensions: ${availableDimensions}
        
        Task: Create a JSON widget config that tells the best story for this data.
        
        Rules:
        - Choose the best 'type' from: ${Object.values(VizType).join(', ')}.
        - Create a friendly, descriptive 'title'.
        - Set 'w' (width 3-12) and 'h' (height 1-4) based on complexity.
        - Set 'x' and 'y' to 0.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: Object.values(VizType) },
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

    const text = response.text;
    if (text) {
      const config = JSON.parse(text) as WidgetConfig;
      config.id = config.id || `gen-${Date.now()}`;
      return config;
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("[FlashFusion] AI Generation failed, falling back to heuristics:", error);
    return heuristicParse(prompt);
  }
};

export const generateAnalysis = async (title: string, data: any[]): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({
        summary: `Hey there! Looking at "${title}", I can see things are running pretty steadily. There's a solid baseline performance here with just the usual fluctuations you'd expect.`,
        drivers: ["Consistent engagement from your core users", "Seasonal patterns holding steady"],
        recommendations: ["Keep an eye on that upcoming seasonal spike", "Maybe dig a bit deeper into those lower-performing segments?"],
        sentiment: "neutral",
        marketContext: "Similar businesses typically see a 5-10% variance right now.",
        sources: [{ title: "Industry Pulse 2024", uri: "#" }]
      }), 1500);
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const aggregatedData = smartSampleData(data);
    const dataSample = JSON.stringify(aggregatedData);

    const [internalResponse, externalResponse] = await Promise.all([
        ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
              Role: You are FlashFusion's friendly, conversational data analyst.
              Tone: Professional but approachable, like a helpful colleague. Avoid robotic jargon.
              Task: Analyze this data for "${title}".
              Data: ${dataSample}
              
              Provide:
              1. A friendly summary (max 2 sentences).
              2. Key drivers (bullet points).
              3. Helpful recommendations.
              4. Sentiment.
            `,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  drivers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sentiment: { type: Type.STRING, enum: ["positive", "negative", "neutral"] }
                }
              }
            }
        }),
        ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find one recent, interesting fact or benchmark about: "${title}". Keep it friendly and short (under 40 words).`,
            config: {
                tools: [{googleSearch: {}}]
            }
        })
    ]);

    const result = JSON.parse(internalResponse.text!) as AnalysisResult;

    if (externalResponse.text) {
        result.marketContext = externalResponse.text;
    }

    const chunks = externalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        result.sources = chunks
            .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
            .filter((c: any) => c !== null);
    }

    return result;

  } catch (error) {
    console.error("Analysis failed", error);
    return {
       summary: "Oops! I couldn't quite analyze that data right now.",
       drivers: [],
       recommendations: [],
       sentiment: "neutral"
    };
  }
};
