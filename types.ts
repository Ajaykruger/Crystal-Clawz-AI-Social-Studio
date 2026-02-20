export enum Platform {
  Instagram = 'Instagram',
  Facebook = 'Facebook',
  TikTok = 'TikTok',
  YouTubeShorts = 'YouTube Shorts',
  YouTube = 'YouTube'
}

export enum PostFormat {
  Reel = 'Reel',
  FeedPost = 'Feed Post',
  Story = 'Story',
  Carousel = 'Carousel',
  Text = 'Text',
  Video = 'Video',
  Image = 'Image'
}

export enum Goal {
  Awareness = 'Awareness',
  Engagement = 'Engagement',
  Sales = 'Sales',
  Education = 'Education'
}

export type ViewState = 
  | 'dashboard' 
  | 'synopsis' 
  | 'create' 
  | 'workbench' 
  | 'review' 
  | 'drafts' 
  | 'calendar' 
  | 'library' 
  | 'settings' 
  | 'engine' 
  | 'social-suite' 
  | 'top-posts';

export type PostStatus = 
  | 'DRAFT' 
  | 'IN_REVIEW' 
  | 'SCHEDULED' 
  | 'PUBLISHED' 
  | 'FAILED'
  | 'APPROVED'
  | 'NEEDS_FIX'
  | 'READY'
  | 'READY_TO_REVIEW'
  | 'IDEA'
  | 'CREATED';

export type UserRole = 'admin' | 'editor' | 'reviewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AppContext {
  user: User;
  drafts: DraftListPost[];
  calendar: CalendarPost[];
  library: MediaAsset[];
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
  inputs: {
    url: string;
    text: string;
    files: File[];
    transcript?: string;
    scrapedImages?: string[];
  };
  settings: {
    platforms: Platform[];
    format: PostFormat;
    goal: Goal;
    audience: string;
    strictMode?: boolean;
    voiceEnabled?: boolean;
  };
  generatedOptions: PostOption[];
  selectedOptionId?: string;
  creationPath?: 'video' | 'image' | 'copy';
  finalContent: {
    title: string;
    copy: string;
    hashtags: string[];
    cta: string;
    imagePrompt: string;
    assets: {
      images: string[];
      videos: string[];
      videoPrompts?: string[];
      scripts?: string[];
    };
    selectedAngle?: string;
  };
  status: PostStatus;
  scheduledDate?: Date;
  versionHistory?: VersionHistoryItem<any>[];
  linkedProducts?: Product[];
}

export interface CalendarPost {
  id: string;
  title: string;
  date: Date;
  status: PostStatus;
  platforms: Platform[];
  thumbnail?: string;
  format?: PostFormat;
  contentTypeTags?: string[];
  stats?: { reach: number; engagement: number };
  caption?: string;
  hashtags?: string[];
  whyItWorks?: string;
  notes?: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  fileType: 'image' | 'video' | 'blueprint' | 'caption' | 'pack';
  url: string;
  createdAt: string;
  tags: string[];
  folderPath?: string;
  stage?: 'Raw' | 'Final';
  permissions?: { status: 'not_needed' | 'granted' | 'requested' };
  status?: string;
  usageType?: string;
  orientation?: string;
  packData?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
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
    theme: string;
    voiceLevel?: string;
    chatPrompt?: string;
  };
}

export interface PlanIdeaContent {
  caption: string;
  visualPrompt: string;
}

export interface PlanIdea {
  id: string;
  title: string;
  why: string;
  format: PostFormat;
  platforms: Platform[];
  contentType: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SAVED' | 'CREATED';
  captionDraft?: string;
  visualPrompt?: string;
  platformContent?: Partial<Record<Platform, PlanIdeaContent>>;
  productContext?: string;
  productUrl?: string;
  notes?: string;
}

export interface PlanDay {
  date: Date;
  ideas: PlanIdea[];
}

export interface TrendingSuggestion {
  id: string;
  type: string;
  text: string;
  reason: string;
}

export interface ReportQueryParseResult {
  intent: string;
  platforms: Platform[];
  dateRange: string;
  explanation: string;
}

export interface ReviewPost {
  id: string;
  source?: string;
  idea_id?: string;
  title: string;
  title_short: string;
  status: PostStatus;
  platforms: Platform[];
  format: PostFormat;
  scheduled_at?: string;
  caption: string;
  hashtags: string[];
  cta: string;
  media: { type: 'image' | 'video'; url: string }[];
  platform_connection: { platform: Platform; connected: boolean }[];
  quality: {
    voice: { status: string; reasons: string[] };
    claims: { status: string; reasons: string[] };
    platform_fit: { status: string; reasons: string[] };
    media_attached: { status: string; reasons: string[] };
  };
  ai_score: { label: string; score: number; reasons: string[] };
  internal_notes?: string | null;
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

export interface DraftListPost {
  id: string;
  title: string;
  hook: string;
  platforms: Platform[];
  format: PostFormat;
  content_type_tags: string[];
  status: string;
  caption: string;
  hashtags: string[];
  cta: string;
  media: { type: 'image' | 'video'; url: string }[];
  readiness: DraftReadiness;
  draft_health: DraftHealth;
  internal_notes?: string | null;
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

export interface Folder {
  id: string;
  name: string;
  path: string;
  locked: boolean;
  subfolders: Folder[];
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

export interface ReportRun {
  id: string;
  reportId: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  startedAt: string;
  finishedAt: string;
  results: {
    kpis: { label: string; value: string; change: string; trend: 'up' | 'down' | 'neutral' }[];
    insights: string[];
    recommendations: { label: string; action?: { view: string } }[];
    tables: { title: string; columns: string[]; rows: string[][] }[];
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  defaultWidgets: string[];
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

export interface VersionHistoryItem<T> {
  id: string;
  timestamp: string;
  author: string;
  data: T;
  note?: string;
}

export interface ModerationConfig {
  checkBrandVoice: boolean;
  checkCompliance: boolean;
  checkAudienceFit: boolean;
  checkMediaPresence: boolean;
  checkHashtagLimit: boolean;
}