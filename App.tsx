import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Synopsis from './pages/Synopsis';
import Create from './pages/Create';
import Workbench from './pages/Workbench';
import Review from './pages/Review';
import Drafts from './pages/Drafts';
import Calendar from './pages/Calendar';
import Library from './pages/Library';
import Settings from './pages/Settings';
import Engine from './pages/Engine';
import SocialSuite from './pages/SocialSuite';
import ChatAssistant from './components/ChatAssistant';
import { ViewState, DraftState, Platform, PostFormat, Goal, CalendarPost, ReviewPost, MediaAsset, DraftListPost, User, AppContext } from './types';
import { Sparkles, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { USER_PROVIDED_ASSETS, getLibraryAssets } from './services/libraryService';
import { userService } from './services/userService';
import { auth, loginWithGoogle } from './services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';

const ConnectionGate: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'auth' | 'apikey'>('auth');

  const handleAuth = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
      alert("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectApiKey = async () => {
    setLoading(true);
    try {
      if ((window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        onComplete();
      } else {
        onComplete();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
            userService.syncWithFirebase(user);
            setStep('apikey');
            setLoading(false);
        }
    });
    return unsub;
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-pink-200 dark:shadow-none">
          {step === 'auth' ? <Lock className="text-white" size={32} /> : <Sparkles className="text-white" size={32} />}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
              {step === 'auth' ? 'Welcome Back!' : 'Connect Google AI'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
              {step === 'auth' ? 'Please sign in to access the Studio.' : 'Connect your API key to enable AI generation.'}
          </p>
        </div>
        
        {step === 'auth' ? (
            <button 
                onClick={handleAuth}
                disabled={loading}
                className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
            >
                {loading ? <Loader2 className="animate-spin" /> : <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="G" />}
                Sign in with Google
            </button>
        ) : (
            <div className="space-y-4">
                <button 
                    onClick={handleConnectApiKey}
                    disabled={loading}
                    className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-pink-700"
                >
                    {loading ? "Connecting..." : "Connect Gemini AI"}
                    {!loading && <ArrowRight size={20} />}
                </button>
                <p className="text-[10px] text-gray-400">
                    A paid GCP project API key is required. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">View billing docs</a>.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

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
    title: '', copy: '', hashtags: [], cta: '', imagePrompt: '',
    assets: { images: [], videos: [], videoPrompts: [], scripts: [] }
  },
  status: 'DRAFT',
  versionHistory: [],
  linkedProducts: []
};

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  
  const [currentDraft, setCurrentDraft] = useState<DraftState>(initialDraft);
  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[]>(() => {
    const saved = localStorage.getItem('cc_calendar_posts');
    return saved ? JSON.parse(saved).map((p: any) => ({ ...p, date: new Date(p.date) })) : [];
  });
  const [reviewPosts, setReviewPosts] = useState<ReviewPost[]>([]);
  const [allDrafts, setAllDrafts] = useState<DraftListPost[]>(() => {
    const saved = localStorage.getItem('cc_all_drafts');
    return saved ? JSON.parse(saved) : [];
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState<User>(userService.getCurrentUser());
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Persist State
  useEffect(() => {
    localStorage.setItem('cc_all_drafts', JSON.stringify(allDrafts));
  }, [allDrafts]);

  useEffect(() => {
    localStorage.setItem('cc_calendar_posts', JSON.stringify(calendarPosts));
  }, [calendarPosts]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
            userService.syncWithFirebase(user);
            setCurrentUser(userService.getCurrentUser());
            try {
                if ((window as any).aistudio?.hasSelectedApiKey) {
                    const has = await (window as any).aistudio.hasSelectedApiKey();
                    if (has) setIsReady(true);
                } else {
                    setIsReady(true);
                }
            } catch (e) {
                setIsReady(true);
            }
        } else {
            setIsReady(false);
        }
        setIsCheckingKey(false);
    });
    return unsubAuth;
  }, []);

  const handleNavigate = (view: ViewState, params?: any) => {
      setCurrentView(view);
      setViewParams(params || null);
      setIsMobileMenuOpen(false);

      if ((view === 'create' || view === 'workbench') && params?.sourcePost) {
          const p = params.sourcePost;
          setCurrentDraft({
              ...initialDraft,
              id: p.id || '',
              creationPath: p.format === PostFormat.Reel ? 'video' : 'copy',
              inputs: { ...initialDraft.inputs, text: p.caption || p.content || '' },
              finalContent: {
                  ...initialDraft.finalContent,
                  title: p.title || '',
                  copy: p.caption || p.content || '',
                  cta: p.cta || '',
                  assets: {
                      ...initialDraft.finalContent.assets,
                      images: p.thumbnail ? [p.thumbnail] : (p.media?.[0]?.url ? [p.media[0].url] : [])
                  }
              },
              settings: {
                  ...initialDraft.settings,
                  platforms: p.platform ? [p.platform] : (p.platforms ? p.platforms : [Platform.Instagram])
              },
              selectedOptionId: 'prefilled'
          });
      } else if (view === 'create' && !params?.sourcePost) {
          setCurrentDraft({ ...initialDraft, id: `draft_${Date.now()}` });
      }
  };

  const handleSaveDraft = async () => {
    const draftId = currentDraft.id || `draft_${Date.now()}`;
    console.log("Persistence: Saving draft", draftId, currentDraft.finalContent.title);

    const newDraftEntry: DraftListPost = {
        id: draftId,
        title: currentDraft.finalContent.title || 'Untitled Post',
        hook: currentDraft.finalContent.title || '',
        platforms: currentDraft.settings.platforms,
        format: currentDraft.settings.format,
        content_type_tags: ['AI Draft'],
        status: 'READY_TO_REVIEW',
        caption: currentDraft.finalContent.copy,
        hashtags: currentDraft.finalContent.hashtags,
        cta: currentDraft.finalContent.cta,
        media: currentDraft.finalContent.assets.images.map(url => ({ type: 'image', url })),
        readiness: {
            state: currentDraft.finalContent.copy ? 'READY' : 'NEEDS_ATTENTION',
            missing_elements: currentDraft.finalContent.copy ? [] : ['CAPTION'],
            blockers: []
        },
        draft_health: {
            label: 'STRONG',
            score: 95,
            reasons: ['Complete generated content']
        },
        last_edited_at: new Date().toISOString(),
        created_at: new Date().toISOString()
    };

    setAllDrafts(prev => {
        const index = prev.findIndex(d => d.id === draftId);
        if (index >= 0) {
            const updated = [...prev];
            updated[index] = { ...newDraftEntry, created_at: prev[index].created_at };
            return updated;
        }
        return [newDraftEntry, ...prev];
    });

    handleNavigate('drafts');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const currentAppContext: AppContext = useMemo(() => ({
    user: currentUser,
    drafts: allDrafts,
    calendar: calendarPosts,
    library: getLibraryAssets()
  }), [currentUser, allDrafts, calendarPosts, libraryVersion]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'synopsis': return <Synopsis data={{
          draftCount: allDrafts.length,
          scheduledCount: calendarPosts.filter(p => p.status === 'SCHEDULED').length,
          reviewCount: reviewPosts.length,
          topPerformers: calendarPosts.filter(p => p.status === 'PUBLISHED').map(p => p.title)
      }} />;
      case 'create': return <Create draft={currentDraft} setDraft={setCurrentDraft} onSuccess={() => handleNavigate('workbench')} />;
      case 'engine': return <Engine onLibraryChanged={() => setLibraryVersion(v => v + 1)} />;
      case 'workbench': return <Workbench draft={currentDraft} setDraft={setCurrentDraft} onSave={handleSaveDraft} onNavigate={handleNavigate} />;
      case 'review': return <Review posts={reviewPosts} onBack={() => handleNavigate('workbench')} onFinish={() => handleNavigate('calendar')} onNavigate={handleNavigate} />;
      case 'drafts': return <Drafts onNavigate={handleNavigate} drafts={allDrafts} onUpdateDrafts={setAllDrafts} onMoveToReview={(d) => handleNavigate('review')} />;
      case 'calendar': return <Calendar posts={calendarPosts} onUpdatePost={(updated) => setCalendarPosts(posts => posts.map(p => p.id === updated.id ? updated : p))} onNavigate={handleNavigate} onAddPost={(p) => setCalendarPosts([...calendarPosts, p])} />;
      case 'library': return <Library onNavigate={handleNavigate} libraryVersion={libraryVersion} />;
      case 'settings': return <Settings initialParams={viewParams} onNavigate={handleNavigate} currentUser={currentUser} onUpdateUser={setCurrentUser} />;
      case 'social-suite': return <SocialSuite />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (isCheckingKey) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading...
    </div>;
  }

  if (!isReady) {
    return <ConnectionGate onComplete={() => setIsReady(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 dark:text-gray-100 font-sans relative transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onChangeView={handleNavigate} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        draftCount={allDrafts.length}
        reviewCount={reviewPosts.length}
        user={currentUser}
      />
      <div className="flex-1 flex flex-col min-w-0 mb-16 md:mb-0 h-full">
        <TopBar 
            currentView={currentView} 
            onNavigate={handleNavigate} 
            onToggleChat={() => setIsChatOpen(!isChatOpen)} 
            onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            theme={theme}
            onToggleTheme={toggleTheme}
            user={currentUser}
        />
        <main className="flex-1 overflow-y-auto scroll-smooth">
            {renderView()}
        </main>
      </div>
      <MobileNav 
        currentView={currentView} 
        onChangeView={handleNavigate} 
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <ChatAssistant 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        appContext={currentAppContext}
      />
    </div>
  );
};

export default App;