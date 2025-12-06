import { GoogleGenAI, SchemaType, Type } from "@google/genai";
import { GroundingSource, QuizData } from "../types";

// Helper to get AI instance safely
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // First, ask for a prompt optimized for image generation
    const promptResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a detailed image generation prompt for an educational infographic that visualizes the following text. 
      The prompt should describe a clean, modern, flat-design infographic.
      Text: ${text.substring(0, 2000)}` // Limit text length for prompt generation
    });
    
    const imagePrompt = promptResponse.text || "An educational infographic summarizing the text.";

    // Generate the image
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

    // Extract image
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
 * Edits an existing image based on user prompt using Gemini Flash Image (Nano banana).
 */
export const editVisual = async (imageBase64: string, instruction: string): Promise<string> => {
  const ai = getAI();
  // Strip prefix if present for API call
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
      contents: `You are an expert frontend developer. Create a single-file HTML/JS interactive simulation or visualization to explain the concepts in the following text.
      
      Requirements:
      - Use HTML5, CSS3, and Vanilla JavaScript.
      - The code must be completely self-contained (no external CSS/JS links, no external images).
      - Make it visually appealing, modern, and educational.
      - Add interactivity (buttons, sliders, hover effects, or inputs) to help the user understand the concept dynamically.
      - Ensure the layout is responsive and fits in a small container.
      - Use a light background color (white or very light gray) for the simulation canvas.
      - Do not include any markdown formatting or backticks in the response. Return ONLY the raw HTML code.
      
      Text to visualize:
      ${text.substring(0, 3000)}`
    });
    
    let code = response.text || "";
    // Clean up markdown formatting if present despite instructions
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
      contents: `You are an expert frontend developer. You are given an existing HTML/JS simulation code and a user instruction to modify it.
      
      User Instruction: ${instruction}
      
      Existing Code:
      ${currentCode.substring(0, 10000)}

      Requirements:
      - Apply the user's requested changes to the code.
      - Maintain the self-contained single-file HTML/JS structure.
      - Ensure the code remains functional and error-free.
      - Do not include any markdown formatting or backticks. Return ONLY the raw HTML code.
      `
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
      model: 'gemini-2.5-flash',
      contents: `Verify the key claims in the following text using Google Search. Provide a report on accuracy and add up-to-date context if needed.
      
      Text: ${text.substring(0, 3000)}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const explanation = response.text || "No verification info returned.";
    
    // Parse grounding chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title)
      .map((web: any) => ({ uri: web.uri, title: web.title }));

    // Deduplicate sources
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
export const generateQuiz = async (text: string): Promise<QuizData> => {
  if (!text) throw new Error("No context provided for quiz generation");
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a structured quiz based on the following text. 
      The quiz MUST have 4 sections: 'choose' (Multiple Choice), 'fillBlank' (Fill in the blank), 'match' (Matching pairs), and 'answer' (Short Answer).
      Each section MUST have exactly 5 questions.
      
      Text context: ${text.substring(0, 4000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: "A short 2-3 word topic title" },
            choose: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctAnswer"]
              }
            },
            fillBlank: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING, description: "Instruction like 'Fill in the blank'" },
                  sentence: { type: Type.STRING, description: "Sentence with '___' as placeholder" },
                  correctAnswer: { type: Type.STRING }
                },
                required: ["id", "question", "sentence", "correctAnswer"]
              }
            },
            match: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING, description: "Instruction e.g. 'Match the terms'" },
                  pairs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        left: { type: Type.STRING },
                        right: { type: Type.STRING }
                      },
                      required: ["left", "right"]
                    }
                  }
                },
                required: ["id", "question", "pairs"]
              }
            },
            answer: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  sampleAnswer: { type: Type.STRING }
                },
                required: ["id", "question", "sampleAnswer"]
              }
            }
          },
          required: ["topic", "choose", "fillBlank", "match", "answer"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr) as QuizData;
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw error;
  }
};

/**
 * Creates a specialized Chat session for the Feynman Student Mode.
 */
export const createStudentSession = (topic: string) => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a curious, university-level student named "Alex". The user is your teacher who is explaining the topic "${topic}" to you.
      
      Your Goal: Completely understand the topic "${topic}" by asking questions.

      Behavior Guidelines:
      1.  **Be inquisitive**: Listen carefully. If the user explains something, ask a follow-up question to clarify or deepen your understanding.
      2.  **Be honest about confusion**: If the user uses jargon or complex terms without defining them, ask "What does that mean?" or "Can you give me an analogy?".
      3.  **Active Listening**: Periodically summarize what you've heard to check if you got it right (e.g., "So, if I understand correctly...").
      4.  **Student Persona**: You are polite, eager to learn, but strictly a student. Do NOT lecture the user. Do NOT act as an expert. Do NOT start explaining the topic yourself unless summarizing.
      5.  **Brevity**: Keep your responses conversational and short (under 50 words) to allow the user to keep teaching.
      6.  **Initiation**: Start the conversation by confirming you are ready to learn about ${topic}.
      
      Tone: Friendly, casual, attentive.`
    }
  });
  return chat;
};

/**
 * Sends a message (text or audio) to the student chat session.
 */
export const sendMessageToStudent = async (chat: any, text: string | null, audioBase64: string | null): Promise<string> => {
  if (!chat) throw new Error("Chat session not initialized");

  const parts = [];
  
  if (audioBase64) {
      // Clean base64 if needed (remove data URL prefix)
      const cleanAudio = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
      parts.push({ 
          inlineData: { 
              mimeType: 'audio/webm', // WebM is standard for browser MediaRecorder
              data: cleanAudio 
          } 
      });
  }
  
  if (text) {
      parts.push({ text });
  }

  if (parts.length === 0) return "";

  try {
      // Pass the parts array directly as the message
      const response = await chat.sendMessage({ message: parts });
      return response.text || "";
  } catch (error) {
      console.error("Student Chat Error:", error);
      throw error;
  }
};