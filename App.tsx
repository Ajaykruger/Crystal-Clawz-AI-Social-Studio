
import React, { useState, useEffect, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import AuthGate from './components/AuthGate';
import { authService } from './services/authService';
import { firestoreService } from './services/firestoreService';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Create from './pages/Create';
import Workbench from './pages/Workbench';
import Review from './pages/Review';
import Drafts from './pages/Drafts';
import Calendar from './pages/Calendar';
import Library from './pages/Library';
import Settings from './pages/Settings';
import Engine from './pages/Engine';
import TopPostsView from './pages/TopPostsView';
import SocialSuite from './pages/SocialSuite';
import ChatAssistant from './components/ChatAssistant';
import { ViewState, DraftState, Platform, PostFormat, Goal, CalendarPost, ReviewPost, MediaAsset, DraftListPost, User } from './types';
import { Sparkles, ArrowRight } from 'lucide-react';
import { USER_PROVIDED_ASSETS } from './services/libraryService';
import { userService } from './services/userService';

// --- API Key Gate Component ---
const ApiKeyGate: React.FC<{ onConnected: () => void }> = ({ onConnected }) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        onConnected();
      } else {
        alert("AI Studio environment not detected.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-pink-200 dark:shadow-none">
          <Sparkles className="text-white" size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">Welcome to Crystal Clawz</h1>
          <p className="text-gray-500 dark:text-gray-400">To start generating content, please connect your Google Gemini API Key.</p>
        </div>
        
        <button 
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-3 btn-primary rounded-xl font-bold text-lg flex items-center justify-center gap-2"
        >
          {loading ? "Connecting..." : "Connect Google AI"}
          {!loading && <ArrowRight size={20} />}
        </button>
      </div>
    </div>
  );
};

// Initial Data...
const initialCalendarPosts: CalendarPost[] = [
  {
    id: '1',
    title: 'Riaana Leaf Art',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 5, 10, 0),
    status: 'PUBLISHED',
    platforms: [Platform.Instagram, Platform.TikTok],
    format: PostFormat.Reel,
    contentTypeTags: ['Educational', 'Trend'],
    stats: { reach: 12500, engagement: 8.5 },
    thumbnail: USER_PROVIDED_ASSETS[0].url,
    caption: "Get ready for spring with these top trends! ☀️👙 #SpringVibes #Nails"
  },
  {
    id: '2',
    title: 'Indulgence #008 Promo',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 8, 14, 30),
    status: 'SCHEDULED',
    platforms: [Platform.Facebook],
    format: PostFormat.Image,
    contentTypeTags: ['Promo', 'Product'],
    thumbnail: USER_PROVIDED_ASSETS[6].url,
    caption: "Our best-selling Vintage Rose is back in stock! Grab yours now. 💅"
  }
];

const initialDraftsList: DraftListPost[] = [
  {
    id: "draft_001",
    title: "Summer Nail Trends 2025",
    hook: "💅 2025 is HERE and your glow-up is en route!",
    platforms: [Platform.Instagram],
    format: PostFormat.Reel,
    content_type_tags: ["Trend"],
    status: "READY_TO_REVIEW",
    caption: "💅 2025 is HERE and your glow-up is en route! We're spotting neon tips and chrome finishes everywhere. What's your pick? Let the sparkle begin! ✨ #CrystalClawz #SummerNails",
    hashtags: ["#CrystalClawz", "#SummerNails"],
    cta: "Shop the look",
    media: [{ type: "video", url: USER_PROVIDED_ASSETS[8].url }],
    readiness: {
      state: "READY",
      missing_elements: [],
      blockers: []
    },
    draft_health: {
      label: "STRONG",
      score: 90,
      reasons: ["Strong hook", "Media attached", "Clear CTA"]
    },
    internal_notes: null,
    last_edited_at: "2025-01-25T10:00:00",
    created_at: "2025-01-24T09:00:00"
  },
  {
    id: "draft_002",
    title: "How to fix a broken nail",
    hook: null,
    platforms: [Platform.TikTok],
    format: PostFormat.Video,
    content_type_tags: ["Educational"],
    status: "NEEDS_ASSETS",
    caption: "Here is a quick way to fix a broken nail using our builder gel. Step 1 prep. Step 2 apply.",
    hashtags: [],
    cta: null,
    media: [],
    readiness: {
      state: "BLOCKED",
      missing_elements: ["MEDIA", "HOOK", "CTA", "HASHTAGS"],
      blockers: ["No media attached", "Missing hook"]
    },
    draft_health: {
      label: "RISKY",
      score: 30,
      reasons: ["Missing media", "Weak caption", "No CTA"]
    },
    internal_notes: "Need to film this on Monday",
    last_edited_at: "2025-01-24T15:30:00",
    created_at: "2025-01-20T11:00:00"
  },
  {
    id: "draft_003",
    title: "Client Spotlight: Johanni",
    hook: "Johanni showed up and showed OUT! 🔥",
    platforms: [Platform.Facebook, Platform.Instagram],
    format: PostFormat.Image,
    content_type_tags: ["Community"],
    status: "DRAFT",
    caption: "Johanni showed up and showed OUT! 🔥 Look at this set she created using the new Matte collection. We are obsessed! 😍",
    hashtags: ["#NailArt"],
    cta: null,
    media: [{ type: "image", url: USER_PROVIDED_ASSETS[4].url }],
    readiness: {
      state: "NEEDS_ATTENTION",
      missing_elements: ["CTA"],
      blockers: ["Missing clear CTA"]
    },
    draft_health: {
      label: "AVERAGE",
      score: 65,
      reasons: ["Good hook", "Media present", "Missing CTA"]
    },
    internal_notes: null,
    last_edited_at: "2025-01-22T09:15:00",
    created_at: "2025-01-21T14:00:00"
  }
];

const initialReviewPosts: ReviewPost[] = [
  {
    id: "post_001",
    title: "SUPER SILVER CAT EYE ✨",
    title_short: "SUPER SILVER CAT EYE",
    status: "IN_REVIEW",
    platforms: [Platform.Instagram, Platform.Facebook],
    format: PostFormat.Reel,
    scheduled_at: "2026-01-17T19:00:00+02:00",
    caption: "✨ SUPER SILVER CAT EYE ✨\nWatch this one hit different under the light 😍\nWould you wear this? Yes/No 👀\n#CrystalClawz #CatEyeNails",
    hashtags: ["#CrystalClawz", "#CatEyeNails"],
    cta: "Would you wear this? Yes/No 👀",
    media: [{ type: "video", url: USER_PROVIDED_ASSETS[8].url }],
    platform_connection: [
      { platform: Platform.Instagram, connected: true },
      { platform: Platform.Facebook, connected: false }
    ],
    quality: {
      voice: { status: "PASS", reasons: ["Hook + payoff + CTA present."] },
      claims: { status: "PASS", reasons: [] },
      platform_fit: { status: "WARN", reasons: ["Facebook disconnected."] },
      media_attached: { status: "PASS", reasons: [] }
    },
    ai_score: { label: "STRONG", score: 86, reasons: ["Clear hook", "Reel format"] },
    internal_notes: "Needs FB reconnect warning."
  },
  {
    id: "post_002",
    title: "Rubber Base Application Tips",
    title_short: "RB TIPS",
    status: "NEEDS_FIX",
    platforms: [Platform.TikTok],
    format: PostFormat.Video,
    scheduled_at: "2026-01-18T10:00:00+02:00",
    caption: "How to apply rubber base perfectly every time. 💅 #NailTech #Tutorial",
    hashtags: ["#NailTech"],
    cta: "Follow for more",
    media: [],
    platform_connection: [
        { platform: Platform.TikTok, connected: true }
    ],
    quality: {
        voice: { status: 'PASS', reasons: [] },
        claims: { status: 'PASS', reasons: [] },
        platform_fit: { status: 'PASS', reasons: [] },
        media_attached: { status: 'FAIL', reasons: ['No media'] }
    },
    ai_score: { label: "RISKY", score: 45, reasons: ["Missing media"] }
  }
];

const initialDraft: DraftState = {
  id: '',
  inputs: { url: '', text: '', files: [], transcript: '', scrapedImages: [] },
  settings: {
    platforms: [Platform.Instagram],
    format: PostFormat.FeedPost,
    goal: Goal.Awareness,
    audience: 'Nail Tech',
    strictMode: true,
    voiceEnabled: true
  },
  generatedOptions: [],
  finalContent: {
    title: '',
    copy: '',
    hashtags: [],
    cta: '',
    imagePrompt: '',
    assets: { images: [], videos: [], videoPrompts: [], scripts: [] }
  },
  status: 'DRAFT',
  versionHistory: [],
  linkedProducts: []
};

const App: React.FC = () => {
  // Firebase auth state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  // Prevents syncing stale/initial data back to Firestore on first load
  const isDataLoaded = useRef(false);

  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  
  const [currentDraft, setCurrentDraft] = useState<DraftState>(initialDraft);
  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[]>(initialCalendarPosts);
  const [reviewPosts, setReviewPosts] = useState<ReviewPost[]>(initialReviewPosts);
  const [allDrafts, setAllDrafts] = useState<DraftListPost[]>(initialDraftsList);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [libraryVersion, setLibraryVersion] = useState(0);
  
  // App-Level User State
  const [currentUser, setCurrentUser] = useState<User>(userService.getCurrentUser());

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Listen to Firebase auth — load workspace data when signed in
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Update the app user from Firebase profile
        setCurrentUser({
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Team Member',
          email: user.email || '',
          role: 'admin',
          avatarUrl: user.photoURL || '',
        });
        // Load shared workspace data from Firestore
        try {
          const data = await firestoreService.load();
          if (data) {
            setAllDrafts(data.drafts);
            setCalendarPosts(data.calendarPosts);
            setReviewPosts(data.reviewPosts);
          }
        } catch (e) {
          console.error('Failed to load workspace data from Firestore', e);
        }
        // Allow sync writes only after state has settled
        setTimeout(() => { isDataLoaded.current = true; }, 600);
      } else {
        isDataLoaded.current = false;
      }
      setIsAuthChecking(false);
    });
    return unsubscribe;
  }, []);

  // Sync shared workspace state to Firestore whenever it changes
  useEffect(() => {
    if (!isDataLoaded.current || !firebaseUser) return;
    firestoreService
      .save({ drafts: allDrafts, calendarPosts, reviewPosts })
      .catch((e) => console.error('Firestore sync failed', e));
  }, [allDrafts, calendarPosts, reviewPosts, firebaseUser]);

  const handleSignOut = async () => {
    isDataLoaded.current = false;
    await authService.signOut();
  };

  useEffect(() => {
    const checkKey = async () => {
      try {
        if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
          const has = await (window as any).aistudio.hasSelectedApiKey();
          if (has) setHasApiKey(true);
          else setHasApiKey(false);
        } else {
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Failed to check API key", e);
        setHasApiKey(true); 
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleNavigate = (view: ViewState, params?: any) => {
      if (view === 'create' && params?.sourcePost) {
          const post = params.sourcePost;
          const newDraft: DraftState = {
              ...initialDraft,
              id: Date.now().toString(),
              inputs: { ...initialDraft.inputs, text: `Inspired by: ${post.title}` },
              settings: {
                  ...initialDraft.settings,
                  platforms: [post.platform],
                  format: post.platform === Platform.TikTok || post.platform === Platform.YouTubeShorts ? PostFormat.Reel : PostFormat.FeedPost
              },
              finalContent: {
                  ...initialDraft.finalContent,
                  title: `Remix: ${post.title}`,
                  copy: post.caption || '',
                  assets: {
                      ...initialDraft.finalContent.assets,
                      images: post.thumbnail ? [post.thumbnail] : []
                  }
              },
              creationPath: 'copy',
              status: 'DRAFT'
          };
          setCurrentDraft(newDraft);
      } else if (view === 'create' && params?.initialAsset) {
          const asset = params.initialAsset as MediaAsset;
          const newDraft: DraftState = {
              ...initialDraft,
              id: Date.now().toString(),
              inputs: {
                  ...initialDraft.inputs,
                  scrapedImages: asset.fileType === 'image' ? [asset.url] : [],
                  // We also populate inputs.files logic if it were a File object, but here it's an asset URL
              },
              finalContent: {
                  ...initialDraft.finalContent,
                  assets: {
                      ...initialDraft.finalContent.assets,
                      images: asset.fileType === 'image' ? [asset.url] : [],
                      videos: asset.fileType === 'video' ? [asset.url] : [],
                  }
              },
              creationPath: asset.fileType === 'video' ? 'video' : 'image',
              status: 'DRAFT'
          };
          setCurrentDraft(newDraft);
      } else if (view === 'workbench' && params?.idea) {
          // Direct to Workbench from Idea Planner
          const idea = params.idea;
          const syntheticOptionId = `opt_${idea.id}`;
          const newDraft: DraftState = {
              ...initialDraft,
              id: idea.id,
              inputs: { ...initialDraft.inputs, text: idea.title },
              creationPath: idea.format === 'Reel' || idea.format === 'Video' ? 'video' : 'image',
              settings: {
                  ...initialDraft.settings,
                  platforms: idea.platforms,
                  format: idea.format
              },
              selectedOptionId: syntheticOptionId,
              generatedOptions: [{
                  id: syntheticOptionId,
                  platform: idea.platforms[0],
                  angle: 'Planner Idea',
                  hook: idea.title,
                  body: idea.captionDraft || '',
                  cta: 'Check link in bio',
                  isCompliant: true,
                  whyThisWorks: idea.why
              }],
              finalContent: {
                  ...initialDraft.finalContent,
                  title: idea.title,
                  copy: idea.captionDraft || '',
                  imagePrompt: idea.visualPrompt || '',
                  assets: {
                      ...initialDraft.finalContent.assets,
                      images: params.image ? [params.image] : []
                  }
              },
              status: 'DRAFT'
          };
          setCurrentDraft(newDraft);
      } else if (view === 'create' && !params) {
          if (currentView !== 'create') {
              setCurrentDraft(initialDraft);
          }
      }

      setCurrentView(view);
      setViewParams(params || null);
      setIsMobileMenuOpen(false);
  };

  const handleAddCalendarPost = (post: CalendarPost) => {
    setCalendarPosts(prev => [...prev, post]);
  };

  const handleAddReviewPosts = (newPosts: ReviewPost[]) => {
      setReviewPosts(prev => [...newPosts, ...prev]);
  };

  const handleEditPost = (post: CalendarPost) => {
      // ... same logic
      handleNavigate('create');
  };

  const handleSaveDraft = () => {
      const newReviewPost: ReviewPost = {
          id: currentDraft.id || `post_${Date.now()}`,
          title: currentDraft.finalContent.title || "Untitled Post",
          status: 'IN_REVIEW',
          platforms: currentDraft.settings.platforms,
          format: currentDraft.settings.format,
          caption: currentDraft.finalContent.copy,
          hashtags: currentDraft.finalContent.hashtags || [],
          cta: currentDraft.finalContent.cta || "",
          media: currentDraft.finalContent.assets.images.map(url => ({ type: 'image', url })),
          platform_connection: currentDraft.settings.platforms.map(p => ({ platform: p, connected: true })),
          ai_score: { label: 'AVERAGE', score: 85, reasons: ['Manual draft'] },
          quality: {
              voice: { status: 'PASS', reasons: [] },
              claims: { status: 'PASS', reasons: [] },
              platform_fit: { status: 'PASS', reasons: [] },
              media_attached: { status: 'PASS', reasons: [] } // simplified
          }
      };
      handleAddReviewPosts([newReviewPost]);
      handleNavigate('review');
  };

  const handleMoveDraftToReview = (draft: DraftListPost) => {
      // 1. Convert DraftListPost to ReviewPost
      const reviewPost: ReviewPost = {
          id: draft.id,
          title: draft.title,
          status: 'IN_REVIEW',
          platforms: draft.platforms,
          format: draft.format,
          caption: draft.caption,
          hashtags: draft.hashtags,
          cta: draft.cta || "",
          media: draft.media,
          platform_connection: draft.platforms.map(p => ({ platform: p, connected: true })),
          ai_score: { ...draft.draft_health, reasons: draft.draft_health.reasons },
          quality: {
              voice: { status: 'PASS', reasons: [] },
              claims: { status: 'PASS', reasons: [] },
              platform_fit: { status: 'PASS', reasons: [] },
              media_attached: { status: 'PASS', reasons: [] } 
          }
      };

      // 2. Add to reviewPosts
      handleAddReviewPosts([reviewPost]);

      // 3. Remove from allDrafts
      setAllDrafts(prev => prev.filter(d => d.id !== draft.id));

      // 4. Navigate to Review
      handleNavigate('review');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'create': return <Create draft={currentDraft} setDraft={setCurrentDraft} onSuccess={() => handleNavigate('workbench')} />;
      case 'engine': return <Engine onLibraryChanged={() => setLibraryVersion(v => v + 1)} />;
      case 'workbench': return <Workbench draft={currentDraft} setDraft={setCurrentDraft} onSave={handleSaveDraft} onNavigate={handleNavigate} />;
      case 'review': return <Review posts={reviewPosts} onBack={() => handleNavigate('workbench')} onFinish={() => handleNavigate('calendar')} onNavigate={handleNavigate} />;
      case 'drafts': return <Drafts onNavigate={handleNavigate} drafts={allDrafts} onUpdateDrafts={setAllDrafts} onMoveToReview={handleMoveDraftToReview} />;
      case 'calendar': return <Calendar posts={calendarPosts} onUpdatePost={(updated) => setCalendarPosts(posts => posts.map(p => p.id === updated.id ? updated : p))} onNavigate={handleNavigate} onEditPost={handleEditPost} onAddReviewPosts={handleAddReviewPosts} onAddPost={handleAddCalendarPost} />;
      case 'library': return <Library onNavigate={handleNavigate} libraryVersion={libraryVersion} />;
      case 'settings': return <Settings initialParams={viewParams} onNavigate={handleNavigate} currentUser={currentUser} onUpdateUser={setCurrentUser} onSignOut={handleSignOut} />;
      case 'top-posts': return <TopPostsView onNavigate={handleNavigate} />;
      case 'social-suite': return <SocialSuite />;
      default: return <Settings onNavigate={handleNavigate} currentUser={currentUser} onUpdateUser={setCurrentUser} onSignOut={handleSignOut} />;
    }
  };

  if (isAuthChecking) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400">Loading...</div>;
  }

  if (!firebaseUser) {
    return <AuthGate onSignedIn={() => { /* onAuthStateChanged handles state update */ }} />;
  }

  if (isCheckingKey) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400">Loading...</div>;
  }

  if (!hasApiKey) {
    return <ApiKeyGate onConnected={() => setHasApiKey(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 dark:text-gray-100 font-sans relative transition-colors duration-300">
      <Sidebar
        currentView={currentView}
        onChangeView={(v) => handleNavigate(v)}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        draftCount={allDrafts.length}
        reviewCount={reviewPosts.length}
        user={currentUser}
        onSignOut={handleSignOut}
      />
      <div className="flex-1 flex flex-col min-w-0 mb-16 md:mb-0 h-full">
        <TopBar 
            currentView={currentView} 
            onNavigate={handleNavigate} 
            onToggleChat={() => setIsChatOpen(!isChatOpen)} 
            onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            theme={theme}
            onToggleTheme={toggleTheme}
        />
        {/* Main Content Area - Increased Padding Handling handled by Pages themselves mostly, but base wrapper is here */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
            {renderView()}
        </main>
      </div>
      <MobileNav 
        currentView={currentView} 
        onChangeView={(v) => handleNavigate(v)} 
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onAddPost={handleAddCalendarPost} />
    </div>
  );
};

export default App;
