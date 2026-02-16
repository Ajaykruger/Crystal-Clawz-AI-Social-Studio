
export const TOOLTIP_REGISTRY = {
  "dashboard.kpi.drafts": { text: "Drafts are posts you’re still working on. They’re not in the approval queue yet.", placement: "bottom" },
  "dashboard.kpi.in_review": { text: "These posts are waiting for approval before they can be scheduled or posted.", placement: "bottom" },
  "dashboard.kpi.scheduled": { text: "Scheduled posts are planned and ready to publish at their set time.", placement: "bottom" },
  "dashboard.kpi.posted": { text: "Posted shows content already published (based on the date range shown).", placement: "bottom" },
  "dashboard.chart.engagement_score": { text: "Engagement score is a quick health check based on likes, comments, shares and saves.", placement: "right" },
  "dashboard.view_report": { text: "Open a detailed report for this card or chart (with export options).", placement: "left" },
  "calendar.tabs.schedule": { text: "See scheduled and posted content on the calendar.", placement: "bottom" },
  "calendar.tabs.ideas": { text: "Plan content ideas first, then bulk create posts from them.", placement: "bottom" },
  "calendar.bulk_create": { text: "Turn approved ideas into platform-ready posts and send them to Review.", placement: "left" },
  "ideas.ai_planner.generate": { text: "Generate a full plan for your chosen week/month: titles + why + platform formats.", placement: "top" },
  "ideas.ai_planner.regenerate": { text: "Want different ideas? Regenerate keeps your settings but refreshes the plan.", placement: "top" },
  "ideas.ai_planner.approve_all": { text: "Approve everything and add it to your calendar as Ideas (you can still edit later).", placement: "top" },
  "review.quality.voice_check": { text: "Checks if the caption matches Crystal Clawz tone: hype, fun and clear CTA.", placement: "right" },
  "review.quality.risky_claims": { text: "Flags claims that could get the post reported or rejected. Keeps you safe.", placement: "right" },
  "review.quality.platform_fit": { text: "Ensures the content format matches the chosen platform (e.g. aspect ratio, length).", placement: "right" },
  "review.quality.media_attached": { text: "Verifies that media is attached and permissions are cleared.", placement: "right" },
  "library.folder_structure": { text: "Folders keep your media organised by campaigns, products, and formats.", placement: "right" },
  "create.from_url": { text: "Paste a link and we’ll pull key points to create captions and ideas.", placement: "bottom" },
  "create.from_text": { text: "Type a brief and we’ll generate post options in Crystal Clawz voice.", placement: "bottom" },
  "global.mic_button": { text: "Tap to dictate. Tap again to stop.", placement: "top" }
} as const;

export type TooltipKey = keyof typeof TOOLTIP_REGISTRY;
