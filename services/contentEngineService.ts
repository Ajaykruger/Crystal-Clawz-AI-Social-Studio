
import { GoogleGenAI, Type } from "@google/genai";
import { ProductBrief, MarketingAngle, VideoBlueprint, CaptionVariant } from "../types";
import { executeWithGemini, getApiKey } from "./geminiService";

const CRYSTAL_CLAWZ_ENGINE_PROMPT = `
You are the content engine for Crystal Clawz, the go-to brand for South African nail techs.
Your goal is to create content that is High-energy, Glam, Playful, and Supportive.
Tone: Casual, conversational, "we" and "you". Use light slang (baddies, glow-up, slay).
Visual Style for Descriptions: High-shine, well-lit, professional nail close-ups.
Values: Empowerment, Education, No Gatekeeping.
`;

export const contentEngineService = {
  async extractBrief(text: string): Promise<ProductBrief> {
    return executeWithGemini(async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Build a Crystal Clawz Product Brief from this text. Focus on benefits for nail techs.\n\n${text}`,
        config: {
          systemInstruction: CRYSTAL_CLAWZ_ENGINE_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              whatItIs: { type: Type.STRING },
              whoItsFor: { type: Type.STRING },
              painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              proofPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              howToUse: { type: Type.ARRAY, items: { type: Type.STRING } },
              objections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    q: { type: Type.STRING },
                    a: { type: Type.STRING }
                  },
                  required: ["q", "a"]
                }
              }
            },
            required: ["whatItIs", "whoItsFor", "painPoints", "proofPoints", "howToUse", "objections"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    });
  },

  async generateAngles(brief: ProductBrief): Promise<MarketingAngle[]> {
    return executeWithGemini(async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 3 marketing angles for this product brief.
      1. Educational & Expert (How-to, tips)
      2. Hype & Celebration (Launch, excitement)
      3. Supportive & Career (Empowerment, business growth)

      Ensure hooks use pattern interrupts and emojis.
      \n\nBRIEF:\n${JSON.stringify(brief)}`,
        config: {
          systemInstruction: CRYSTAL_CLAWZ_ENGINE_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                hook: { type: Type.STRING },
                objective: { type: Type.STRING }
              },
              required: ["id", "name", "hook", "objective"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    });
  },

  async generateImage(prompt: string): Promise<string> {
    return executeWithGemini(async (ai) => {
      const fullPrompt = `High quality professional product photography for Crystal Clawz.
    Glam, well-lit nail close-up. Bold, high-shine, on-trend aesthetic.
    Clean, professional composition. No dark or cluttered backgrounds.
    Prompt details: ${prompt}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: fullPrompt }]
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("Failed to generate image");
    });
  },

  async generateBlueprints(brief: ProductBrief, angle: MarketingAngle): Promise<VideoBlueprint[]> {
    return executeWithGemini(async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create 2 CapCut-ready video blueprints (15s) for this angle: ${angle.name}.
      Style: Fast-paced, trending audio feel, engaging text overlays.
      \n\nBRIEF:\n${JSON.stringify(brief)}`,
        config: {
          systemInstruction: CRYSTAL_CLAWZ_ENGINE_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                duration: { type: Type.STRING },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      action: { type: Type.STRING },
                      overlay: { type: Type.STRING }
                    },
                    required: ["time", "action", "overlay"]
                  }
                },
                shotInstructions: { type: Type.STRING },
                cta: { type: Type.STRING }
              },
              required: ["id", "title", "duration", "scenes", "shotInstructions", "cta"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    });
  },

  async generateCaptions(brief: ProductBrief, angle: MarketingAngle): Promise<CaptionVariant[]> {
    return executeWithGemini(async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create 3 social captions for this product. 1 Short, 1 Standard, 1 Hook-led.
      Follow the Crystal Clawz voice: Casual, "we"/"you", emojis, clear CTA.
      \n\nBRIEF:\n${JSON.stringify(brief)}\n\nANGLE:\n${angle.name}`,
        config: {
          systemInstruction: CRYSTAL_CLAWZ_ENGINE_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["id", "type", "content"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    });
  },

  async generateVideoFromPrompt(params: {
    prompt: string;
    aspectRatio?: "9:16" | "16:9";
    durationSeconds?: "4" | "6" | "8";
    resolution?: "720p" | "1080p" | "4k";
    negativePrompt?: string;
    model?: "veo-3.1-generate-preview" | "veo-3.1-fast-generate-preview";
  }): Promise<{ mimeType: string; dataUrl: string }> {
    const {
      prompt,
      aspectRatio = "9:16",
      durationSeconds = "8",
      resolution = "720p",
      model = "veo-3.1-fast-generate-preview",
    } = params;

    // Inject visual style into video prompt
    const styledPrompt = `
      ${prompt}.
      Style: Professional, high-end beauty commercial, bright lighting, sharp focus on nails.
      Aesthetic: Glam, Crystal Clawz brand style.
    `;

    // Video generation uses a long polling loop, so we manage the AI instance manually
    // and read the key fresh via getApiKey() at the start of the call.
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    // 1) Start async operation
    let operation: any = await ai.models.generateVideos({
      model,
      prompt: styledPrompt,
      config: {
        aspectRatio,
        numberOfVideos: 1,
        resolution,
      } as any,
    });

    // 2) Poll until done (Veo is async)
    while (!operation.done) {
      await new Promise((r) => setTimeout(r, 2000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    // 3) Extract the video
    const generated = operation?.response?.generatedVideos?.[0];
    const video = generated?.video;

    // A) videoBytes available
    if (video?.videoBytes) {
      const mimeType = video?.mimeType || "video/mp4";
      return { mimeType, dataUrl: `data:${mimeType};base64,${video.videoBytes}` };
    }

    // B) URI available (REST-style); fetch it with API key
    if (video?.uri) {
      const downloadLink = video.uri;
      const res = await fetch(`${downloadLink}&key=${getApiKey()}`);
      if (!res.ok) throw new Error(`Video download failed (${res.status})`);

      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Browser-safe base64 conversion
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const mimeType = blob.type || "video/mp4";
      return { mimeType, dataUrl: `data:${mimeType};base64,${base64}` };
    }

    throw new Error("Video generated but no bytes/uri returned (check Veo access / billing)");
  }
};
