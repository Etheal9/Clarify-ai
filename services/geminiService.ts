
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GroundingSource, QuizData } from "../types";

// Helper to get AI instance safely
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates high-quality human-like speech for students using the dedicated TTS model.
 */
export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    return base64Audio;
  } catch (error) {
    console.error("Speech generation error:", error);
    throw error;
  }
};

/**
 * Generates a text explanation using Gemini Pro for complex reasoning.
 */
export const generateExplanation = async (text: string): Promise<string> => {
  if (!text) return "";
  const ai = getAI();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an expert tutor. Analyze the following text and provide a comprehensive yet easy-to-understand explanation. 
      
      IMPORTANT: You must output the response in strictly segmented Markdown sections. 
      Start every new section with a Header 1 (#) or Header 2 (##). 
      Do NOT include a preamble before the first header.

      Required Structure:
      # Executive Summary
      (A brief 2-3 sentence high-level overview of the content)

      ## Key Concepts
      (A bulleted list of the most important terms and ideas)

      ## Detailed Analysis
      (A deeper dive into the mechanics, context, or details)

      ## Conclusion
      (A final wrapping thought or takeaway)
      
      Text to analyze:
      ${text}`,
      config: {
        thinkingConfig: { thinkingBudget: 1024 } 
      }
    });
    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("Explanation error:", error);
    throw error;
  }
};

/**
 * Generates an initial infographic/visual using Gemini Flash Image.
 */
export const generateVisual = async (text: string): Promise<string> => {
  if (!text) return "";
  const ai = getAI();
  
  try {
    const promptResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a detailed image generation prompt for an educational infographic that visualizes the following text. 
      The prompt should describe a clean, modern, flat-design infographic.
      Text: ${text.substring(0, 2000)}`
    });
    
    const imagePrompt = promptResponse.text || "An educational infographic summarizing the text.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Visual generation error:", error);
    throw error;
  }
};

/**
 * Edits an existing image based on user prompt using Gemini Flash Image.
 */
export const editVisual = async (imageBase64: string, instruction: string): Promise<string> => {
  const ai = getAI();
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/png' 
            }
          },
          { text: instruction }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image returned");
  } catch (error) {
    console.error("Image edit error:", error);
    throw error;
  }
};

/**
 * Generates an interactive simulation code using Gemini Pro.
 */
export const generateSimulation = async (text: string): Promise<string> => {
  if (!text) return "";
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an expert frontend developer. Create a single-file HTML/JS interactive simulation to explain the concepts in the following text. Use Vanilla JS and modern CSS. Return ONLY the raw HTML code.`
    });
    
    let code = response.text || "";
    code = code.replace(/```html/g, '').replace(/```/g, '');
    return code;
  } catch (error) {
    console.error("Simulation generation error:", error);
    throw error;
  }
};

/**
 * Edits/Updates an existing simulation code based on user instruction.
 */
export const editSimulation = async (currentCode: string, instruction: string): Promise<string> => {
  if (!currentCode || !instruction) return currentCode;
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an expert frontend developer. Modify the following HTML/JS simulation based on this instruction: ${instruction}. Return ONLY the raw HTML code.`
    });
    
    let code = response.text || "";
    code = code.replace(/```html/g, '').replace(/```/g, '');
    return code;
  } catch (error) {
    console.error("Simulation edit error:", error);
    throw error;
  }
};

/**
 * Verifies facts using Google Search Grounding.
 */
export const verifyText = async (text: string): Promise<{ explanation: string; sources: GroundingSource[] }> => {
  const ai = getAI();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Verify the claims in the following text using Google Search.
      Text: ${text.substring(0, 3000)}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const explanation = response.text || "No verification info returned.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title)
      .map((web: any) => ({ uri: web.uri, title: web.title }));

    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
    return { explanation, sources: uniqueSources };
  } catch (error) {
    console.error("Verification error:", error);
    throw error;
  }
};

/**
 * Generates a comprehensive quiz with 4 types of questions.
 */
export const generateQuiz = async (text: string, difficulty: string = 'Medium', count: number = 5): Promise<QuizData> => {
  if (!text) throw new Error("No context provided");
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a structured quiz based on the following text. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            choose: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING } }, required: ["id", "question", "options", "correctAnswer"] } },
            fillBlank: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, sentence: { type: Type.STRING }, correctAnswer: { type: Type.STRING } }, required: ["id", "question", "sentence", "correctAnswer"] } },
            match: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, pairs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { left: { type: Type.STRING }, right: { type: Type.STRING } }, required: ["left", "right"] } } }, required: ["id", "question", "pairs"] } },
            answer: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, sampleAnswer: { type: Type.STRING } }, required: ["id", "question", "sampleAnswer"] } }
          },
          required: ["topic", "choose", "fillBlank", "match", "answer"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr) as QuizData;
  } catch (error) {
    console.error("Quiz error:", error);
    throw error;
  }
};

export type StudentType = 'normal' | 'argumentative' | 'creative';

/**
 * Creates a specialized Chat session for the Feynman Student Mode.
 */
export const createStudentSession = (topic: string, type: StudentType = 'normal') => {
  const ai = getAI();
  
  let personaInstruction = "";
  if (type === 'normal') {
    personaInstruction = `You are "Alex", a curious student. You ask clear, factual questions. You want to ensure your understanding is accurate.`;
  } else if (type === 'argumentative') {
    personaInstruction = `You are "Blake", a skeptical student. You challenge logic, look for contradictions, and demand proof. You are critical but respectful.`;
  } else if (type === 'creative') {
    personaInstruction = `You are "Charlie", a divergent and critical thinker. You deconstruct ideas from first principles and look for fundamental flaws. You ask provocative "what if" questions that challenge the status quo with logic-bending alternatives. You are NOT just about art; you are a deep critical creative.`;
  }

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `${personaInstruction} 
      The user is your teacher explaining "${topic}".
      
      Your Goal: Completely understand or deeply challenge "${topic}".

      Behavior Guidelines:
      1.  **Language Support**: Respond in the SAME LANGUAGE the user uses (English or Amharic/አማርኛ). If they teach in Amharic, you MUST reply in Amharic.
      2.  **Inquisitive**: Always ask a follow-up question or raise a critical doubt.
      3.  **Brevity**: Keep responses under 40 words.
      4.  **Identity**: Stay true to your student persona (${type}).
      
      Tone: Conversational, sharp, and focused.`
    }
  });
  return chat;
};

/**
 * Sends a message to the student chat session.
 */
export const sendMessageToStudent = async (chat: any, text: string | null, audioBase64: string | null): Promise<string> => {
  if (!chat) throw new Error("Chat not initialized");

  const parts = [];
  if (audioBase64) {
      parts.push({ inlineData: { mimeType: 'audio/webm', data: audioBase64.replace(/^data:audio\/\w+;base64,/, "") } });
  }
  if (text) {
      parts.push({ text });
  }

  try {
      const response = await chat.sendMessage({ message: parts });
      return response.text || "";
  } catch (error) {
      console.error("Student Chat Error:", error);
      throw error;
  }
};
