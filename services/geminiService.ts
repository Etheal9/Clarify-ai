
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GroundingSource, QuizData, ExplanationData, StudentType, VisualType, LanguagePreference } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an intelligent title for a source based on its content or URL context.
 */
export const generateSourceTitle = async (context: string): Promise<string> => {
  if (!context) return "Untitled Source";
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following context (it might be a URL, a snippet of text, or a filename) and generate a concise, professional, and highly descriptive title (max 6 words). 
      
      CONTEXT:
      ${context.substring(0, 2000)}
      
      Return ONLY the plain text title.`,
    });
    return response.text?.trim() || "Refined Source";
  } catch (error) {
    console.error("Title generation error:", error);
    return "New Source";
  }
};

/**
 * AI Coaching for Metrics
 */
export const getMetricCoaching = async (
  metrics: any[], 
  userQuery: string, 
  lang: LanguagePreference = 'en'
): Promise<{ text: string; audioBase64?: string }> => {
  const ai = getAI();
  const metricContext = JSON.stringify(metrics);
  
  const langInstruction = {
    en: "The entire response must be in English.",
    am: "The entire response must be in Amharic (አማርኛ).",
    both: "Provide a bilingual response in both English and Amharic."
  }[lang];

  const systemInstruction = `You are a world-class cognitive scientist and learning coach. 
  Analyze the user's learning metrics: ${metricContext}. 
  Provide a deep, scientific explanation of their current cognitive state. 
  Offer actionable advice, including "Brain-Focused Games" (mental exercises) and professional scientific strategies (like the Feynman Technique) to improve specific weaknesses.
  ${langInstruction}`;

  try {
    // 1. Generate Text Response
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userQuery,
      config: { systemInstruction }
    });
    
    const textResult = response.text || "I'm analyzing your progress now.";

    // 2. Generate TTS if needed
    let audioBase64 = undefined;
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: textResult.substring(0, 500) }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: lang === 'am' ? 'Puck' : 'Kore' } }
          }
        }
      });
      audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) { console.error("TTS Error", e); }

    return { text: textResult, audioBase64 };
  } catch (error) {
    console.error("Coaching Error", error);
    return { text: "Error connecting to AI Coach." };
  }
};

/**
 * Generates a deep-dive, brain-first explanation using the 7-part framework.
 * Respects the language preference (English, Amharic, or Both).
 */
export const generateExplanation = async (text: string, lang: LanguagePreference = 'en'): Promise<ExplanationData | null> => {
  if (!text) return null;
  const ai = getAI();

  const langInstruction = {
    en: "The entire response must be in English.",
    am: "The entire response must be in Amharic (አማርኛ). Ensure technical terms are translated or explained phonetically in Amharic.",
    both: "Provide a bilingual experience. Explanations should be in English, but for every definition, formula explanation, and step in the formal logic, provide a clear Amharic translation. The 'Intuition' and 'Summary' sections should be provided in both English and Amharic."
  }[lang];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class educational psychologist. Explain the following concept using how the human brain actually learns.
      
      LANGUAGE SETTING: ${langInstruction}
      
      Goal: Deeply explain so the learner understands, remembers, and can apply it. 
      The explanation must be LONG and DETAILED.

      STRUCTURE (Strict Order):
      1. Intuition First: A story/scenario making them care. Use Ethiopian context (e.g. Merkato, Blue Nile, coffee ceremony). End with a curiosity gap.
      2. Simple Idea: ELI12. Short sentences, no jargon.
      3. Visual & Analogy: Describe a powerful mental model comparing it to everyday objects.
      4. Formal: Terminology, definitions, formulas, and step-by-step logic for exams.
      5. Mistakes: ❌ Common mistake vs ✅ Correct explanation. (CRITICAL).
      6. Active Recall: A creative question to test understanding, with answer and feedback.
      7. Summary: 3-5 high-impact bullet points.

      Return strictly valid JSON.
      Context: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            intuition: {
              type: Type.OBJECT,
              properties: {
                problem: { type: Type.STRING },
                hook: { type: Type.STRING },
                localContext: { type: Type.STRING },
                curiosityGap: { type: Type.STRING }
              },
              required: ["problem", "hook", "localContext", "curiosityGap"]
            },
            simpleIdea: { type: Type.STRING },
            analogy: {
              type: Type.OBJECT,
              properties: {
                comparison: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["comparison", "explanation"]
            },
            formal: {
              type: Type.OBJECT,
              properties: {
                definitions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } } } },
                formulas: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { formula: { type: Type.STRING }, explanation: { type: Type.STRING } } } },
                stepByStep: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["definitions", "stepByStep"]
            },
            mistakes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { wrong: { type: Type.STRING }, right: { type: Type.STRING }, reason: { type: Type.STRING } } } },
            activeRecall: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING }, feedback: { type: Type.STRING } }, required: ["question", "answer", "feedback"] },
            summary: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["topic", "intuition", "simpleIdea", "analogy", "formal", "mistakes", "activeRecall", "summary"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Explanation error:", error);
    throw error;
  }
};

/**
 * Specialized visual generation based on cognitive need.
 */
export const generateVisual = async (text: string, type: VisualType = 'diagram'): Promise<string> => {
  if (!text) return "";
  const ai = getAI();
  
  const typePrompts: Record<VisualType, string> = {
    diagram: "Visual: Diagram. Need: 'What is this?'. Detailed educational diagram with labels. Modern style.",
    flow: "Visual: Flow. Need: 'How does it work?'. Process map/flow chart showing steps and logic movement.",
    compare: "Visual: Compare. Need: 'Why is this different?'. Side-by-side comparison infographic contrasting key elements.",
    analogy: "Visual: Analogy. Need: 'I don't get it'. Creative metaphor visualization translating complexity into simplicity."
  };

  try {
    const promptResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Draft an image prompt for: ${text.substring(0, 1000)}. Style: ${typePrompts[type]}. Clean, educational, flat design.`
    });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: promptResponse.text || text }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return "";
  } catch (error) {
    return "";
  }
};

/**
 * Generates or modifies interactive HTML simulations.
 */
export const generateSimulation = async (text: string, lang: LanguagePreference = 'en', existingCode?: string): Promise<string> => {
  const ai = getAI();
  const langText = lang === 'am' ? "The UI, labels, and descriptions in the simulation must be in Amharic (አማርኛ)." : 
                   lang === 'both' ? "The UI should have English labels, but provide Amharic translations/subtitles for key controls." : 
                   "All text in the simulation must be in English.";

  const prompt = existingCode 
    ? `Modify this HTML/JS simulation code: ${existingCode}\nInstruction: ${text}\nLanguage Setting: ${langText}\nReturn ONLY the updated FULL code.`
    : `Create a standalone interactive HTML/JS simulation for this concept: ${text}. ${langText} Include CSS/JS. Make it high-quality and visual. Return ONLY the code.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt
  });
  return (response.text || "").replace(/```html/g, '').replace(/```/g, '').trim();
};

export const verifyText = async (text: string): Promise<{ explanation: string; sources: GroundingSource[] }> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Verify claims: ${text.substring(0, 2000)}`,
      config: { tools: [{ googleSearch: {} }] }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || [];
    return { explanation: response.text || "", sources };
  } catch (error) {
    return { explanation: "Verification failed.", sources: [] };
  }
};

export const editVisual = async (img: string, instr: string) => img;
export const editSimulation = generateSimulation; // Re-use the same logic for editing
export const generateQuiz = async (t: string, d: string, c: number): Promise<QuizData> => ({ topic: t, choose: [], fillBlank: [], match: [], answer: [] });
export const generateSpeech = async (t: string, v: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: t }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: v } }
      }
    }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};
export const createStudentSession = (t: string, ty: any) => null;
export const sendMessageToStudent = async (c: any, t: any, a: any) => "";
