
import { GoogleGenAI, Type, LiveServerMessage, Modality } from "@google/genai";
import { DraftState, PostOption, Platform, PlannerConfig, PlanDay, PlanIdea, TrendingSuggestion, ReportQueryParseResult } from "../types";

// Wrapper to handle API key errors and retry with user selection
async function executeWithGemini<T>(action: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        return await action(ai);
    } catch (e: any) {
        const errStr = (e.toString() + JSON.stringify(e)).toLowerCase();
        // Check for common API key or permission errors
        if (errStr.includes("api key not valid") || errStr.includes("api_key_invalid") || errStr.includes("requested entity was not found")) {
            console.warn("API Key invalid or missing. Prompting for selection...");
            if ((window as any).aistudio?.openSelectKey) {
                await (window as any).aistudio.openSelectKey();
                // Re-initialize client with the new key which is now in process.env
                const newAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
                return await action(newAi);
            }
        }
        throw e;
    }
}

export const generateImageForPost = async (prompt: string, model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
    return executeWithGemini(async (ai) => {
        try {
            const refinedPrompt = `
                ${prompt}.
                Visual Style: High-quality professional product photography for Crystal Clawz. 
                Glam, well-lit nail close-up. Bold, high-shine, on-trend aesthetic.
                Clean, professional composition. No dark or cluttered backgrounds.
                Context: Social media content for nail technicians.
            `;

            const imageConfig: any = { aspectRatio: "1:1" };
            // imageSize is only supported by Pro model
            if (model === 'gemini-3-pro-image-preview') {
                imageConfig.imageSize = "1K";
            }

            const response = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: [{ text: refinedPrompt }]
                },
                config: {
                    imageConfig
                }
            });
            
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            return "";
        } catch (e) {
            console.error("Image generation failed", e);
            throw e; 
        }
    });
};

export const generatePostOptions = async (draft: DraftState): Promise<PostOption[]> => {
    return executeWithGemini(async (ai) => {
        const prompt = `
        Generate 3 distinct social media post options based on this input: "${draft.inputs.text || draft.inputs.url}".
        Target Audience: ${draft.settings.audience}.
        Goal: ${draft.settings.goal}.
        Platforms: ${draft.settings.platforms.join(', ')}.
        Brand Voice: South African Friendly, Professional yet fun ("Crystal Clawz Bestie").
        
        For each option, provide a hook, body, CTA, and explain why it works.
        Check for compliance: No medical claims (cure, heal), no guaranteed income claims.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
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
                            imageSuggestion: { type: Type.STRING },
                            videoSuggestion: { type: Type.STRING },
                            isCompliant: { type: Type.BOOLEAN },
                            complianceNote: { type: Type.STRING },
                            whyThisWorks: { type: Type.STRING }
                        },
                        required: ["id", "platform", "angle", "hook", "body", "cta", "isCompliant", "whyThisWorks"]
                    }
                }
            }
        });

        return JSON.parse(response.text || "[]");
    });
};

export const scrapeImagesFromUrl = async (url: string): Promise<string[]> => {
    // Placeholder: In a real app, this would require a backend proxy or function tool.
    return [];
};

export const analyzeMediaAsset = async (base64: string, mimeType: string, folderPaths: string[]): Promise<{
    filename: string;
    description: string;
    tags: string[];
    suggestedFolder: string;
    promptSuggestion?: string;
}> => {
    return executeWithGemini(async (ai) => {
        const prompt = `
        Analyze this media for a library.
        1. Generate a descriptive filename (no extension).
        2. Write a short description.
        3. Suggest 3-5 tags.
        4. Suggest the best folder from this list: ${folderPaths.join(', ')}.
        5. Create a generative AI prompt that could recreate a similar image.
        `;

        // Strip data url prefix if present
        const data = base64.includes(',') ? base64.split(',')[1] : base64;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: {
                parts: [
                    { inlineData: { mimeType, data } },
                    { text: prompt }
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

        return JSON.parse(response.text || "{}");
    });
};

export const generateCaptionFromAngle = async (topic: string, angle: string, why: string, hook: string): Promise<string> => {
    return executeWithGemini(async (ai) => {
        const prompt = `
        Write a full social media caption for Crystal Clawz (Nail Brand).
        Topic: ${topic}
        Angle: ${angle}
        Why it works: ${why}
        Hook: ${hook}
        
        Tone: Engaging, professional, friendly. Use emojis.
        Include hashtags.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        return response.text || "";
    });
};

export const generatePromptFromContext = async (context: string): Promise<string> => {
    return executeWithGemini(async (ai) => {
        const prompt = `
        Create a detailed image generation prompt based on this social media context:
        "${context}"
        
        The prompt should be descriptive, specifying lighting, style (professional, high-quality), and subject (nails, gel, bottles).
        Style: Crystal Clawz aesthetic - bright, clean, high-shine.
        Keep it under 40 words.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        
        return response.text || "";
    });
};

export const createChatSession = () => {
    // Create new instance directly. If API key is invalid, sendMessage will fail. 
    // Ideally chat interface handles retry, but for now we rely on initial setup.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: "You are a helpful social media assistant for Crystal Clawz. You help with captions, strategy, and scheduling. You can output JSON for calendar events."
        }
    });
};

export const connectLiveSession = (callbacks: {
    onOpen?: () => void;
    onMessage?: (msg: LiveServerMessage) => void;
    onError?: (err: any) => void;
    onClose?: () => void;
}) => {
    // We cannot easily wrap the live connection promise with retry logic in the same way 
    // because it involves event callbacks. We assume key is valid or user handles error via UI.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
            onopen: () => callbacks.onOpen?.(),
            onmessage: (msg) => callbacks.onMessage?.(msg),
            onerror: (err) => callbacks.onError?.(err),
            onclose: () => callbacks.onClose?.()
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: "You are a creative partner for a nail beauty brand. Brainstorm ideas."
        }
    });
};

export const generateContentPlan = async (config: PlannerConfig): Promise<PlanDay[]> => {
    return executeWithGemini(async (ai) => {
        const prompt = `
        Generate a content plan for: ${config.startDate} to ${config.endDate}.
        Goal: ${config.topicInputs.goal}.
        Theme: ${config.topicInputs.theme}.
        Platforms: ${config.platforms.join(', ')}.
        
        Return a list of days, each with a list of ideas.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            date: { type: Type.STRING },
                            ideas: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        title: { type: Type.STRING },
                                        why: { type: Type.STRING },
                                        format: { type: Type.STRING },
                                        platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        contentType: { type: Type.STRING },
                                        status: { type: Type.STRING },
                                        captionDraft: { type: Type.STRING },
                                        visualPrompt: { type: Type.STRING },
                                        productContext: { type: Type.STRING }
                                    },
                                    required: ["id", "title", "why", "format", "platforms", "contentType", "status"]
                                }
                            }
                        },
                        required: ["date", "ideas"]
                    }
                }
            }
        });

        const rawData = JSON.parse(response.text || "[]");
        return rawData.map((d: any) => ({
            ...d,
            date: new Date(d.date)
        }));
    });
};

export const generateVideoScripts = async () => {
    return [];
};

export const parseReportQuery = async (query: string): Promise<ReportQueryParseResult> => {
    return executeWithGemini(async (ai) => {
        const prompt = `
        Parse this user query for an analytics report: "${query}".
        Determine the user's intent, which platforms (if specified, otherwise all), and the date range (e.g. 'last_30_days').
        Intent can be: 'find_top_posts', 'performance_overview', 'calendar_gaps', 'review_throughput', 'draft_health'.
        If unknown, return 'unknown'.
        Provide a short explanation.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        intent: { type: Type.STRING },
                        platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
                        dateRange: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ["intent", "platforms", "dateRange", "explanation"]
                }
            }
        });

        return JSON.parse(response.text || "{}");
    });
};

export const getTrendingSuggestions = async (): Promise<TrendingSuggestion[]> => {
    return executeWithGemini(async (ai) => {
        const prompt = `
        Suggest 5 trending content ideas/hooks for a Nail Tech audience right now.
        Mix of visual trends, audio trends, and business tips.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            type: { type: Type.STRING },
                            text: { type: Type.STRING },
                            reason: { type: Type.STRING }
                        },
                        required: ["id", "type", "text", "reason"]
                    }
                }
            }
        });

        return JSON.parse(response.text || "[]");
    });
};

export const generateSocialReply = async (content: string, type: string, platform: Platform): Promise<string> => {
    return executeWithGemini(async (ai) => {
        const prompt = `
        Draft a reply to this ${platform} ${type}: "${content}".
        Brand Voice: Friendly, helpful, "Bestie" persona.
        If it's a complaint, be empathetic and ask to DM.
        If it's praise, use emojis.
        Keep it short.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        return response.text || "";
    });
};
