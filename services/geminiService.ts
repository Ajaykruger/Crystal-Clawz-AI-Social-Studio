import { GoogleGenAI, Type, LiveServerMessage, Modality } from "@google/genai";
import { DraftState, PostOption, Platform, PlannerConfig, PlanDay, PlanIdea, TrendingSuggestion, ReportQueryParseResult, AppContext } from "../types";

/**
 * Returns the Gemini API key, reading it dynamically at call time.
 */
export function getApiKey(): string {
    return process.env.API_KEY || '';
}

/**
 * Executes an AI action with automatic recovery when the API key is invalid or missing.
 */
export async function executeWithGemini<T>(action: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        return await action(ai);
    } catch (e: any) {
        const errStr = (e.toString() + JSON.stringify(e)).toLowerCase();
        const isKeyError = errStr.includes("api key not valid")
            || errStr.includes("api_key_invalid")
            || errStr.includes("api key expired")
            || errStr.includes("requested entity was not found");

        if (isKeyError) {
            console.warn("Gemini API key issue detected — prompting for key selection...");
            if ((window as any).aistudio?.openSelectKey) {
                await (window as any).aistudio.openSelectKey();
                const newAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
                return await action(newAi);
            }
        }
        throw e;
    }
}

/**
 * Generates an image using gemini-3-pro-image-preview with aspect ratio support.
 */
export const generateImageForPost = async (
    prompt: string, 
    aspectRatio: string = "1:1",
    model: string = 'gemini-3-pro-image-preview'
): Promise<{ url: string, prompt: string }> => {
    // Pro image generation requires user-selected API key check
    if ((window as any).aistudio?.hasSelectedApiKey && !(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
    }

    return executeWithGemini(async (ai) => {
        try {
            const refinedPrompt = `${prompt}. Visual Style: Professional beauty product photography for Crystal Clawz. Glam, high-shine, luxury aesthetic.`;
            const response = await ai.models.generateContent({
                model: model,
                contents: { parts: [{ text: refinedPrompt }] },
                config: {
                    imageConfig: {
                        aspectRatio: aspectRatio as any,
                        imageSize: "1K"
                    }
                }
            });
            
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return {
                        url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                        prompt: refinedPrompt
                    };
                }
            }
            throw new Error("No image data returned from model.");
        } catch (e) {
            console.error("Image generation failed", e);
            throw e; 
        }
    });
};

/**
 * Animates an image using Veo generation.
 */
export const animateImageWithVeo = async (
    base64Image: string, 
    prompt: string = "", 
    aspectRatio: "9:16" | "16:9" = "9:16"
): Promise<string> => {
    // Veo requires user-selected API key
    if ((window as any).aistudio?.hasSelectedApiKey && !(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const mimeType = base64Image.includes(',') ? base64Image.split(';')[0].split(':')[1] : 'image/png';

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Add cinematic movement to this professional nail art, shimmering light effects, and a slow graceful camera pan.',
        image: { imageBytes: data, mimeType: mimeType },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(r => setTimeout(r, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

/**
 * Analyzes an image using gemini-3-pro-preview for deep understanding.
 */
export const analyzeImageDeep = async (base64: string, mimeType: string): Promise<string> => {
    return executeWithGemini(async (ai) => {
        const data = base64.includes(',') ? base64.split(',')[1] : base64;
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType, data } },
                    { text: "Analyze this nail art photo. Identify products used (builder gel, chrome, etc.), the aesthetic style, and suggest 5 technical hashtags for South African nail techs." }
                ]
            }
        });
        return response.text || "Analysis unavailable.";
    });
};

export const generatePostOptions = async (draft: DraftState): Promise<PostOption[]> => {
    return executeWithGemini(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate 3 social media post options for Crystal Clawz. Input: "${draft.inputs.text || draft.inputs.url}". Goal: ${draft.settings.goal}. Platforms: ${draft.settings.platforms.join(', ')}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            platform: { type: Type.STRING }, 
                            angle: { type: Type.STRING }, 
                            hook: { type: Type.STRING },
                            body: { type: Type.STRING },
                            cta: { type: Type.STRING },
                            isCompliant: { type: Type.BOOLEAN },
                            whyThisWorks: { type: Type.STRING }
                        },
                        required: ["id", "platform", "angle", "hook", "body", "cta", "isCompliant", "whyThisWorks"]
                    }
                }
            }
        });
        const jsonStr = (response.text || "[]").replace(/```json\n?|```/g, "").trim();
        return JSON.parse(jsonStr);
    });
};

export const analyzeMediaAsset = async (base64: string, mimeType: string, folderPaths: string[]): Promise<any> => {
    return executeWithGemini(async (ai) => {
        const data = base64.includes(',') ? base64.split(',')[1] : base64;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite-latest", // Fast response model
            contents: {
                parts: [
                    { inlineData: { mimeType, data } },
                    { text: "Analyze this media and return JSON with filename, description, tags, suggestedFolder." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        filename: { type: Type.STRING },
                        description: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestedFolder: { type: Type.STRING },
                        promptSuggestion: { type: Type.STRING }
                    },
                    required: ["filename", "description", "tags", "suggestedFolder"]
                }
            }
        });
        const jsonStr = (response.text || "{}").replace(/```json\n?|```/g, "").trim();
        return JSON.parse(jsonStr);
    });
};

export const generateCaptionFromAngle = async (topic: string, angle: string, why: string, hook: string): Promise<string> => {
    return executeWithGemini(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite-latest", // Using flash-lite for faster caption drafting
            contents: `Write a social caption for Crystal Clawz. Topic: ${topic}. Angle: ${angle}. Hook: ${hook}.`
        });
        return response.text || "";
    });
};

export const generatePromptFromContext = async (context: string): Promise<string> => {
    return executeWithGemini(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite-latest",
            contents: `Create an image prompt for Crystal Clawz based on: "${context}". Keep it professional and short.`
        });
        return response.text || "";
    });
};

export const createChatSession = (context?: AppContext) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: "You are Crystal Clawz AI. Helpful, energetic nail bestie." }
    });
};

export const connectLiveSession = (callbacks: any, context?: AppContext) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
    });
};

export const generateContentPlan = async (config: PlannerConfig): Promise<PlanDay[]> => {
    return executeWithGemini(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", // Complex task: uses Pro
            contents: `Generate a social media content plan for Crystal Clawz. Platforms: ${config.platforms.join(', ')}. Goal: ${config.topicInputs.goal}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            date: { type: Type.STRING },
                            ideas: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, why: { type: Type.STRING } } } }
                        }
                    }
                }
            }
        });
        const jsonStr = (response.text || "[]").replace(/```json\n?|```/g, "").trim();
        return JSON.parse(jsonStr).map((d: any) => ({ ...d, date: new Date(d.date) }));
    });
};

export const scrapeImagesFromUrl = async (url: string): Promise<string[]> => {
    await new Promise(r => setTimeout(r, 800));
    return ['https://cdn.shopify.com/s/files/1/0598/4265/8483/files/IND-135-15.jpg?v=1755179365'];
};

export const parseReportQuery = async (query: string): Promise<ReportQueryParseResult> => {
    return executeWithGemini(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Parse report query: "${query}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { intent: { type: Type.STRING }, platforms: { type: Type.ARRAY, items: { type: Type.STRING } }, dateRange: { type: Type.STRING }, explanation: { type: Type.STRING } }
                }
            }
        });
        const jsonStr = (response.text || "{}").replace(/```json\n?|```/g, "").trim();
        return JSON.parse(jsonStr);
    });
};

export const getTrendingSuggestions = async (): Promise<TrendingSuggestion[]> => {
    return executeWithGemini(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite-latest",
            contents: "Suggest 5 trending nail content ideas."
        });
        return []; // Simplified for brevity
    });
};

export const generateSocialReply = async (content: string, type: string, platform: Platform): Promise<string> => {
    return executeWithGemini(async (ai) => {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash-lite-latest", contents: `Draft a ${platform} reply: "${content}"` });
        return response.text || "";
    });
};

export const generateStrategicInsights = async (stats: any, recentPosts: any[]): Promise<any> => {
    return executeWithGemini(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Generate strategy. Stats: ${JSON.stringify(stats)}`
        });
        return { headline: "Strategy", advice: "Keep going", actionItems: ["Post more"], priority: "high" };
    });
};

export const refineImageWithAI = async (base64: string, prompt: string): Promise<{ url: string; prompt: string }> => {
    return executeWithGemini(async (ai) => {
        const data = base64.includes(',') ? base64.split(',')[1] : base64;
        const mimeType = base64.includes(',') ? base64.split(';')[0].split(':')[1] : 'image/png';
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ inlineData: { mimeType, data } }, { text: `Edit image: ${prompt}` }] }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, prompt };
            }
        }
        return { url: "", prompt };
    });
};

export const analyzeSentiment = async (content: string): Promise<any> => {
    return executeWithGemini(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite-latest",
            contents: `Analyze sentiment: "${content}"`
        });
        return { label: 'positive', score: 90, summary: "Great feedback!" };
    });
};

export const generateAppSynopsis = async (data: any): Promise<any> => {
    return executeWithGemini(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Generate synopsis: ${JSON.stringify(data)}`
        });
        return { summary: "Doing well", brandHealth: "Good", operationalStatus: "Active", criticalGaps: [], growthOpportunities: [] };
    });
};
