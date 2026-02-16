
export enum Platform {
  Instagram = 'Instagram',
  Facebook = 'Facebook',
  TikTok = 'TikTok',
  YouTube = 'YouTube',
  YouTubeShorts = 'YouTube Shorts',
  LinkedIn = 'LinkedIn'
}

export enum PostFormat {
  Reel = 'Reel',
  FeedPost = 'Feed Post',
  Story = 'Story',
  Carousel = 'Carousel',
  Video = 'Video',
  Text = 'Text',
  Image = 'Image'
}

export enum Goal {
  Awareness = 'Awareness',
  Engagement = 'Engagement',
  Sales = 'Sales',
  Education = 'Education'
}

export type ViewState = 'dashboard' | 'create' | 'engine' | 'workbench' | 'review' | 'drafts' | 'calendar' | 'library' | 'settings' | 'top-posts' | 'social-suite';

export type PostStatus = 'DRAFT' | 'IDEA' | 'CREATED' | 'IN_REVIEW' | 'NEEDS_FIX' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'READY_TO_REVIEW' | 'NEEDS_ASSETS' | 'READY';

export type UserRole = 'admin' | 'editor' | 'reviewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface VersionHistoryItem<T> {
  id: string;
  timestamp: string;
  author: string;
  note?: string;
  data: T;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  url: string;
  imageUrl: string;
  tags: string[];
}

export type PermissionStatus = 'not_needed' | 'required_not_granted' | 'granted';

export interface MediaAsset {
  id: string;
  filename: string;
  description?: string;
  fileType: 'image' | 'video' | 'pack' | 'blueprint' | 'caption' | 'script';
  folderPath: string;
  stage?: 'Raw' | 'Edited' | 'Final';
  url: string;
  createdAt: string;
  tags: string[];
  permissions: {
    status: PermissionStatus;
    creatorCredit?: string;
    proofFiles?: string[];
  };
  productLine?: string;
  detectedProductName?: string;
  detectedSku?: string;
  usageType?: string;
  orientation?: string;
  status: 'draft' | 'scheduled' | 'posted';
  packData?: string;
  versionHistory?: VersionHistoryItem<MediaAsset>[];
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  locked?: boolean;
  subfolders: Folder[];
}

export interface PostOption {
  id: string;
  platform: Platform;
  angle: string;
  hook: string;
  body: string;
  cta: string;
  imageSuggestion?: string;
  videoSuggestion?: string;
  isCompliant: boolean;
  complianceNote?: string;
  whyThisWorks?: string;
}

export interface DraftState {
  id: string;
  creationPath?: 'video' | 'image' | 'copy';
  inputs: {
    url: string;
    text: string;
    files: File[];
    transcript: string;
    scrapedImages: string[];
  };
  settings: {
    platforms: Platform[];
    format: PostFormat;
    goal: Goal;
    audience: string;
    strictMode: boolean;
    voiceEnabled: boolean;
  };
  generatedOptions: PostOption[];
  selectedOptionId?: string;
  finalContent: {
    title: string;
    copy: string;
    hashtags: string[];
    cta: string;
    imagePrompt: string;
    assets: {
      images: string[];
      videos: string[];
      videoPrompts: string[];
      scripts: string[];
    };
    selectedAngle?: string;
  };
  status: PostStatus;
  scheduledDate?: Date;
  versionHistory: VersionHistoryItem<any>[];
  linkedProducts: Product[];
}

export interface DraftListPost {
    id: string;
    title: string;
    hook: string | null;
    platforms: Platform[];
    format: PostFormat;
    content_type_tags: string[];
    status: PostStatus;
    caption: string;
    hashtags: string[];
    cta: string | null;
    media: { type: string, url: string }[];
    readiness: DraftReadiness;
    draft_health: DraftHealth;
    internal_notes: string | null;
    last_edited_at: string;
    created_at: string;
}

export interface DraftReadiness {
    state: 'READY' | 'NEEDS_ATTENTION' | 'BLOCKED';
    missing_elements: string[];
    blockers: string[];
}

export interface DraftHealth {
    label: 'STRONG' | 'AVERAGE' | 'RISKY';
    score: number;
    reasons: string[];
}

export interface CalendarPost {
  id: string;
  title: string;
  date: Date;
  status: PostStatus;
  platforms: Platform[];
  format: PostFormat;
  contentTypeTags: string[];
  caption?: string;
  hashtags?: string[];
  thumbnail?: string;
  stats?: { reach: number; engagement: number };
  whyItWorks?: string;
  notes?: string;
}

export interface ReviewPost {
  id: string;
  source?: string;
  idea_id?: string;
  title: string;
  title_short?: string;
  status: PostStatus;
  platforms: Platform[];
  format: PostFormat;
  scheduled_at?: string;
  caption: string;
  hashtags: string[];
  cta: string;
  media: { type: string, url: string }[];
  platform_connection: { platform: Platform, connected: boolean }[];
  quality: {
      voice: { status: 'PASS' | 'WARN' | 'FAIL', reasons: string[] };
      claims: { status: 'PASS' | 'WARN' | 'FAIL', reasons: string[] };
      platform_fit: { status: 'PASS' | 'WARN' | 'FAIL', reasons: string[] };
      media_attached: { status: 'PASS' | 'WARN' | 'FAIL', reasons: string[] };
  };
  ai_score: { label: 'STRONG' | 'AVERAGE' | 'RISKY', score: number, reasons: string[] };
  internal_notes?: string;
  moderationResult?: ModerationResult;
}

export interface ModerationResult {
    overallStatus: 'PASS' | 'WARN' | 'FAIL';
    score: number;
    checks: {
        id: string;
        label: string;
        status: 'PASS' | 'WARN' | 'FAIL';
        message: string;
    }[];
}

export interface ModerationConfig {
    checkBrandVoice: boolean;
    checkCompliance: boolean;
    checkAudienceFit: boolean;
    checkMediaPresence: boolean;
    checkHashtagLimit: boolean;
}

export interface PlannerConfig {
    period: 'week' | 'month';
    startDate: Date;
    endDate: Date;
    platforms: Platform[];
    frequency: string;
    contentMix: Record<string, number>;
    topicSource: 'dropdown' | 'chat';
    topicInputs: {
        goal: string;
        theme?: string;
        voiceLevel?: string;
        chatPrompt?: string;
    };
}

export interface PlanDay {
    date: Date;
    ideas: PlanIdea[];
}

export interface PlanIdea {
    id: string;
    title: string;
    why: string;
    format: PostFormat;
    platforms: Platform[];
    contentType: string;
    status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SAVED';
    notes?: string;
    // New Rich Fields
    captionDraft?: string;
    visualPrompt?: string;
    productContext?: string; // e.g. "Coreless E-File"
    productUrl?: string;
}

export interface TrendingSuggestion {
    id: string;
    type: 'trend' | 'angle' | 'hashtag';
    text: string;
    reason: string;
}

export interface ReportQueryParseResult {
    intent: string;
    platforms: Platform[];
    dateRange: string;
    explanation: string;
}

export interface ReportDefinition {
    id: string;
    name: string;
    templateId: string;
    description?: string;
    scope: {
        platforms: Platform[];
        dateRange: string;
    };
    createdAt: string;
    lastRunAt?: string;
}

export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    defaultWidgets: string[];
}

export interface ReportRun {
    id: string;
    reportId: string;
    status: 'SUCCESS' | 'FAILED' | 'RUNNING';
    startedAt: string;
    finishedAt: string;
    results: {
        kpis: { label: string; value: string; change: string; trend: 'up' | 'down' | 'neutral' }[];
        insights: string[];
        recommendations: { label: string; action?: { view: ViewState, params?: any } }[];
        tables?: { title: string; columns: string[]; rows: string[][] }[];
    };
}

export interface ProductBrief {
    whatItIs: string;
    whoItsFor: string;
    painPoints: string[];
    proofPoints: string[];
    howToUse: string[];
    objections: { q: string; a: string }[];
}

export interface MarketingAngle {
    id: string;
    name: string;
    hook: string;
    objective: string;
}

export interface VideoBlueprint {
    id: string;
    title: string;
    duration: string;
    scenes: { time: string; action: string; overlay: string }[];
    shotInstructions: string;
    cta: string;
}

export interface CaptionVariant {
    id: string;
    type: string;
    content: string;
}
