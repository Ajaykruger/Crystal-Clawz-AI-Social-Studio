
import { CalendarPost, ReviewPost, Platform, PostFormat, PostStatus } from '../types';

// Mock function to simulate the bulk creation engine
export const simulateBulkCreate = async (
  ideas: CalendarPost[], 
  config: any, 
  onProgress: (progress: number, stage: string) => void
): Promise<ReviewPost[]> => {
    
    // Stage 1: Collect
    onProgress(10, "Resolving ideas and platform targets...");
    await new Promise(r => setTimeout(r, 800));

    const generatedPosts: ReviewPost[] = [];
    const totalSteps = ideas.length * 3; // roughly 3 steps per idea
    let currentStep = 0;

    for (const idea of ideas) {
        // Stage 2: Generate Variants
        onProgress(20 + (currentStep / totalSteps) * 40, `Generating variants for ${idea.title}...`);
        await new Promise(r => setTimeout(r, 600)); // Simulate AI Gen

        // Generate per platform logic (simplified mock)
        const platformsToGen = config.platform_selection && config.platform_selection.length > 0 
            ? config.platform_selection 
            : idea.platforms;

        for (const platform of platformsToGen) {
             const variantId = `${idea.id}_${platform}`;
             
             // Different formatting per platform mock
             let caption = idea.caption || `Get ready for ${idea.title}! 💅✨`;
             let hashtags = idea.hashtags || ["#CrystalClawz"];

             if (platform === Platform.Instagram) {
                 caption = `✨ ${idea.title.toUpperCase()} ✨\n\n${caption}\n\nDrop a comment if you love this! 👇`;
                 hashtags = [...hashtags, "#NailInspo", "#InstaNails"];
             } else if (platform === Platform.TikTok) {
                 caption = `${idea.title} | Wait for it... 🔥 ${hashtags.join(' ')}`;
             } else if (platform === Platform.YouTubeShorts) {
                 caption = `${idea.title} #Shorts #CrystalClawz`;
             } else if (platform === Platform.YouTube) {
                 caption = `${idea.title}\n\nIn this video, we break down ${idea.title} step-by-step. Don't forget to subscribe!`;
             }

             // Stage 3: Media Resolution
             // Simulate finding media or flagging missing
             const hasMedia = idea.thumbnail;
             const mediaStatus = hasMedia ? "PASS" : config.media_mode === 'LeaveEmpty' ? "FAIL" : "WARN";
             
             // Stage 4: Quality Check
             const score = Math.floor(Math.random() * 30) + 70; // 70-100 random score
             
             const reviewPost: ReviewPost = {
                 id: `rev_${variantId}_${Date.now()}`,
                 source: 'BulkCreate',
                 idea_id: idea.id,
                 title: idea.title,
                 title_short: `${platform} - ${idea.title}`,
                 status: mediaStatus === 'FAIL' ? 'NEEDS_FIX' : 'IN_REVIEW',
                 platforms: [platform],
                 format: idea.format,
                 scheduled_at: idea.date.toISOString(),
                 caption: caption,
                 hashtags: hashtags,
                 cta: "Shop Link in Bio",
                 media: hasMedia ? [{ type: 'image', url: idea.thumbnail! }] : [],
                 platform_connection: [{ platform, connected: true }],
                 quality: {
                     voice: { status: 'PASS', reasons: [] },
                     claims: { status: 'PASS', reasons: [] },
                     platform_fit: { status: 'PASS', reasons: [] },
                     media_attached: { 
                         status: mediaStatus as any, 
                         reasons: mediaStatus === 'FAIL' ? ['No media attached'] : [] 
                     }
                 },
                 ai_score: {
                     label: score > 85 ? 'STRONG' : score > 70 ? 'AVERAGE' : 'RISKY',
                     score: score,
                     reasons: score > 85 ? ['Strong hook', 'On brand'] : ['Caption could be punchier']
                 }
             };
             generatedPosts.push(reviewPost);
        }
        currentStep++;
    }

    // Stage 5: Finalize
    onProgress(90, "Finalizing quality scores...");
    await new Promise(r => setTimeout(r, 600));

    onProgress(100, "Done");
    return generatedPosts;
};
