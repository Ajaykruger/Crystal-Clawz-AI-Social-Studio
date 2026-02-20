import React, { useState, useEffect, useMemo } from 'react';
import { ReviewPost, Platform, PostFormat, PostStatus, ModerationResult } from '../types';
import { 
  Check, CalendarClock, Send, ArrowLeft, Filter, Search, MoreHorizontal, 
  ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Edit2, 
  Trash2, Copy, Eye, Zap, Sparkles, CheckCircle, X, Maximize2, 
  MessageSquare, Sliders, Layout, Facebook, Instagram, Youtube, Image as ImageIcon, BarChart, Shield,
  PenTool, ExternalLink, Loader2
} from 'lucide-react';
import { CCTextArea, CCTextField } from '../components/ui/Inputs';
import { CCTooltip } from '../components/ui/Tooltip';
import { CCCheckbox } from '../components/ui/Checkbox';
import { userService } from '../services/userService';
import { moderationService } from '../services/moderationService';
import { USER_PROVIDED_ASSETS } from '../services/libraryService';

interface ReviewProps {
  posts?: ReviewPost[]; 
  onBack?: () => void;
  onFinish?: (view: any, params?: any) => void;
  onNavigate?: (view: any, params?: any) => void;
}

const generateMockPosts = (): ReviewPost[] => [
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
  },
  {
    id: "post_003",
    title: "Red Floral Inspo 🌹",
    title_short: "FLORAL INSPO",
    status: "APPROVED",
    platforms: [Platform.Instagram],
    format: PostFormat.Image,
    scheduled_at: "2026-01-19T10:00:00+02:00",
    caption: "Floral details are timeless. 🌹 Hand painted using our Gel Paint kit. \n\n#NailArt #CrystalClawz",
    hashtags: ["#NailArt", "#CrystalClawz"],
    cta: "Save for inspo",
    media: [{ type: "image", url: USER_PROVIDED_ASSETS[2].url }],
    platform_connection: [
        { platform: Platform.Instagram, connected: true }
    ],
    quality: {
        voice: { status: 'PASS', reasons: [] },
        claims: { status: 'PASS', reasons: [] },
        platform_fit: { status: 'PASS', reasons: [] },
        media_attached: { status: 'PASS', reasons: [] }
    },
    ai_score: { label: "STRONG", score: 92, reasons: ["High quality image", "Relevant tags"] }
  }
];

const PlatformIcon: React.FC<{ p: Platform; size?: number; className?: string }> = ({ p, size = 14, className="" }) => {
    switch(p) {
        case Platform.Instagram: return <Instagram size={size} className={`text-pink-600 ${className}`} />;
        case Platform.Facebook: return <Facebook size={size} className={`text-blue-600 ${className}`} />;
        case Platform.TikTok: return <span className={className} style={{fontSize: size, fontWeight: 'bold'}}>Tk</span>;
        case Platform.YouTube: return <Youtube size={size} className={`text-red-600 ${className}`} />;
        case Platform.YouTubeShorts: return <Youtube size={size} className={`text-red-600 ${className}`} />;
        default: return <Layout size={size} className={`text-gray-400 ${className}`} />;
    }
};

const StatusBadge = ({ status }: { status: PostStatus }) => {
    const styles = {
        'PUBLISHED': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        'APPROVED': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        'READY': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        'SCHEDULED': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        'IN_REVIEW': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
        'NEEDS_FIX': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
        'DRAFT': 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
        'FAILED': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${styles[status] || styles['DRAFT']}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

const AIScoreBadge = ({ score }: { score: { label: string, score: number } }) => {
    const styles = {
        'STRONG': 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        'AVERAGE': 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
        'RISKY': 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    };
    return (
        <CCTooltip content={`Quality Score: ${score.score} - ${score.label}`}>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${styles[score.label]}`}>
                <Zap size={10} className={score.label === 'STRONG' ? 'fill-green-700' : ''} />
                {score.score}
            </div>
        </CCTooltip>
    );
};

const Review: React.FC<ReviewProps> = ({ posts: externalPosts, onBack, onFinish, onNavigate }) => {
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<Platform | null>(null);
  const currentUser = userService.getCurrentUser();
  const canApprove = userService.canApprove();

  // Initialize and run checks
  useEffect(() => {
      const initialPosts = externalPosts && externalPosts.length > 0 ? externalPosts : generateMockPosts();
      const config = userService.getModerationConfig();
      
      const processedPosts = initialPosts.map(p => {
          if (!p.moderationResult) {
              return { ...p, moderationResult: moderationService.evaluatePost(p, config) };
          }
          return p;
      });
      setPosts(processedPosts);
      
      // Auto-select first post
      if (processedPosts.length > 0 && !selectedId) {
          const first = processedPosts[0];
          setSelectedId(first.id);
          setActivePlatformTab(first.platforms[0]);
      }
  }, [externalPosts]);

  // Handle post selection changes to update active platform tab default
  useEffect(() => {
      if (selectedId) {
          const post = posts.find(p => p.id === selectedId);
          if (post && (!activePlatformTab || !post.platforms.includes(activePlatformTab))) {
              setActivePlatformTab(post.platforms[0]);
          }
      }
  }, [selectedId]);

  const selectedPost = useMemo(() => posts.find(p => p.id === selectedId), [posts, selectedId]);

  const handleUpdateStatus = (id: string, newStatus: PostStatus) => {
      setPosts(posts.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const handleUpdatePostContent = (id: string, updates: Partial<ReviewPost>) => {
      setPosts(posts.map(p => {
          if (p.id === id) {
              // Re-evaluate quality on content change
              const updated = { ...p, ...updates };
              const config = userService.getModerationConfig();
              updated.moderationResult = moderationService.evaluatePost(updated, config);
              return updated;
          }
          return p;
      }));
  };

  const handleApprove = () => {
      if (selectedId) handleUpdateStatus(selectedId, 'APPROVED');
  };

  const handleApproveAll = () => {
      if (!canApprove) return;
      setPosts(posts.map(p => p.status === 'IN_REVIEW' ? { ...p, status: 'APPROVED' } : p));
  };

  const handleNeedsFix = () => {
      if (selectedId) handleUpdateStatus(selectedId, 'NEEDS_FIX');
  };

  const handleEditInStudio = () => {
      if (selectedPost && onNavigate) {
          // Map ReviewPost to navigation params to prefill the Create/Workbench view
          onNavigate('create', { sourcePost: { 
              id: selectedPost.id,
              title: selectedPost.title, 
              platform: activePlatformTab || selectedPost.platforms[0],
              caption: selectedPost.caption,
              thumbnail: selectedPost.media[0]?.url,
              cta: selectedPost.cta,
              format: selectedPost.format
          }});
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        
      {/* Header */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             {onBack && <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"><ArrowLeft size={20} /></button>}
             <h1 className="heading-page text-xl text-gray-900 dark:text-white">Review Queue</h1>
             <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-bold">{posts.length}</span>
          </div>
          <div className="flex items-center gap-3">
             {canApprove && posts.some(p => p.status === 'IN_REVIEW') && (
                 <button 
                    onClick={handleApproveAll}
                    className="px-4 py-2 bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 rounded-lg text-sm font-bold border border-pink-100 dark:border-pink-800 flex items-center gap-2"
                 >
                    <CheckCircle size={16}/> Approve All Pending
                 </button>
             )}
             <button 
                onClick={() => onFinish && onFinish('calendar')}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
             >
                 Exit Review
             </button>
          </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
          
          {/* Left Pane: Post List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col shrink-0">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posts</span>
                  <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400"><Filter size={14}/></button>
                      <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400"><Search size={14}/></button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                  {posts.map(post => (
                      <div 
                        key={post.id}
                        onClick={() => setSelectedId(post.id)}
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedId === post.id ? 'bg-pink-50 dark:bg-pink-900/20 border-l-4 border-l-pink-600' : 'border-l-4 border-l-transparent'}`}
                      >
                          <div className="flex justify-between items-start mb-1">
                              <StatusBadge status={post.status}/>
                              <span className="text-[10px] text-gray-400 font-medium">
                                  {new Date(post.scheduled_at || Date.now()).toLocaleDateString()}
                              </span>
                          </div>
                          <h4 className={`font-bold text-sm mb-1 line-clamp-1 ${selectedId === post.id ? 'text-pink-900 dark:text-pink-300' : 'text-gray-900 dark:text-white'}`}>{post.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{post.caption}</p>
                          <div className="flex items-center justify-between">
                              <div className="flex -space-x-1">
                                  {post.platforms.map(p => <div key={p} className="bg-white dark:bg-gray-700 rounded-full p-0.5 shadow-sm"><PlatformIcon p={p}/></div>)}
                              </div>
                              <AIScoreBadge score={post.ai_score}/>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Right Pane: Preview & Actions */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex flex-col min-w-0">
              {selectedPost ? (
                  <div className="flex-1 overflow-y-auto p-4 md:p-8">
                      <div className="flex flex-col xl:flex-row gap-8 max-w-6xl mx-auto h-full">
                          
                          {/* EDITING Column */}
                          <div className="flex-1 flex flex-col space-y-6 min-w-0">
                              
                              {/* Platform Tabs Header */}
                              <div className="flex items-center justify-between">
                                  <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-slate-200 dark:border-gray-700">
                                      {selectedPost.platforms.map(p => (
                                          <button
                                              key={p}
                                              onClick={() => setActivePlatformTab(p)}
                                              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                                  activePlatformTab === p 
                                                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' 
                                                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                              }`}
                                          >
                                              <PlatformIcon p={p} className={activePlatformTab === p ? 'text-white dark:text-slate-900' : ''} />
                                              {p}
                                          </button>
                                      ))}
                                  </div>
                                  <button 
                                      onClick={handleEditInStudio}
                                      className="text-xs font-bold text-pink-600 hover:underline flex items-center gap-1 bg-pink-50 dark:bg-pink-900/30 px-3 py-1.5 rounded-lg border border-pink-100 dark:border-pink-800"
                                  >
                                      <PenTool size={12}/> Edit Full in Studio
                                  </button>
                              </div>

                              {/* Content Editor */}
                              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                                  <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">Content Details</h3>
                                  
                                  <CCTextField 
                                      label="Title / Hook"
                                      value={selectedPost.title}
                                      onChange={(e) => handleUpdatePostContent(selectedPost.id, { title: e.target.value })}
                                  />

                                  <CCTextArea 
                                      label="Caption"
                                      className="min-h-[160px]"
                                      value={selectedPost.caption}
                                      onChange={(e) => handleUpdatePostContent(selectedPost.id, { caption: e.target.value })}
                                  />

                                  <div>
                                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block">Hashtags</label>
                                      <div className="p-3 bg-slate-50 dark:bg-gray-700/50 rounded-xl border border-slate-200 dark:border-gray-600">
                                          <div className="flex flex-wrap gap-2 mb-2">
                                              {selectedPost.hashtags.map((tag, idx) => (
                                                  <span key={idx} className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                                                      {tag}
                                                      <button 
                                                          onClick={() => handleUpdatePostContent(selectedPost.id, { hashtags: selectedPost.hashtags.filter((_, i) => i !== idx) })}
                                                          className="hover:text-red-500"
                                                      >
                                                          <X size={10} />
                                                      </button>
                                                  </span>
                                              ))}
                                          </div>
                                          <input 
                                              type="text" 
                                              placeholder="Add hashtag + Enter"
                                              className="w-full bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                                              onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                      const val = e.currentTarget.value.trim();
                                                      if (val) {
                                                          const newTag = val.startsWith('#') ? val : `#${val}`;
                                                          handleUpdatePostContent(selectedPost.id, { hashtags: [...selectedPost.hashtags, newTag] });
                                                          e.currentTarget.value = '';
                                                      }
                                                  }
                                              }}
                                          />
                                      </div>
                                  </div>
                              </div>

                              {/* Moderation Feedback */}
                              {selectedPost.moderationResult && (
                                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                      <div className="flex justify-between items-center mb-4">
                                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                              <Shield size={18} className={selectedPost.moderationResult.overallStatus === 'PASS' ? 'text-green-500' : 'text-amber-500'}/>
                                              Quality Check
                                          </h3>
                                          <span className={`text-xs font-bold px-2 py-1 rounded ${selectedPost.moderationResult.overallStatus === 'PASS' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                              {selectedPost.moderationResult.score}/100
                                          </span>
                                      </div>
                                      <div className="space-y-3">
                                          {selectedPost.moderationResult.checks.map(check => (
                                              <div key={check.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                                  <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${check.status === 'PASS' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                      {check.status === 'PASS' ? <Check size={10} /> : <AlertTriangle size={10} />}
                                                  </div>
                                                  <div>
                                                      <p className="text-sm font-bold text-gray-900 dark:text-white">{check.label}</p>
                                                      <p className="text-xs text-gray-500 dark:text-gray-400">{check.message}</p>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>

                          {/* PREVIEW Column */}
                          <div className="w-full xl:w-[360px] shrink-0 flex flex-col items-center">
                              <div className="sticky top-0 w-full flex flex-col items-center">
                                  <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                      <Eye size={16}/> {activePlatformTab} Preview
                                  </h3>
                                  
                                  <div className="bg-white rounded-[32px] border-[8px] border-gray-900 shadow-2xl overflow-hidden h-[680px] w-[340px] flex flex-col relative shrink-0">
                                      {/* Mock Phone UI Header */}
                                      <div className="h-7 bg-gray-900 w-full absolute top-0 left-0 z-20 flex justify-center">
                                          <div className="h-4 w-24 bg-black rounded-b-xl"></div>
                                      </div>
                                      
                                      {/* Dynamic Platform Header */}
                                      <div className="h-14 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 gap-2 mt-4 z-10 w-full">
                                          <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white text-xs font-bold">C</div>
                                          <div className="flex-1">
                                              <div className="text-xs font-bold text-gray-900">Crystal Clawz</div>
                                              <div className="text-[10px] text-gray-500">Sponsored • {activePlatformTab}</div>
                                          </div>
                                          <MoreHorizontal size={16} className="text-gray-400"/>
                                      </div>

                                      {/* Media */}
                                      <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden group">
                                          {selectedPost.media.length > 0 ? (
                                              <>
                                                <img src={selectedPost.media[0].url} className="w-full h-full object-cover opacity-90" />
                                                <button className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pink-600">
                                                    <Edit2 size={14}/>
                                                </button>
                                              </>
                                          ) : (
                                              <div className="text-gray-500 text-xs flex flex-col items-center">
                                                  <ImageIcon size={32} className="mb-2 opacity-50"/>
                                                  No Media
                                              </div>
                                          )}
                                          
                                          {/* Mock TikTok/Reels UI Overlay */}
                                          {(activePlatformTab === Platform.TikTok || activePlatformTab === Platform.Instagram) && (
                                              <div className="absolute bottom-4 right-2 flex flex-col gap-4 items-center text-white">
                                                  <div className="flex flex-col items-center gap-1"><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Check size={16}/></div><span className="text-[10px]">1.2k</span></div>
                                                  <div className="flex flex-col items-center gap-1"><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><MessageSquare size={16}/></div><span className="text-[10px]">45</span></div>
                                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><ExternalLink size={16}/></div>
                                              </div>
                                          )}

                                          {/* Overlay Text for Video Formats */}
                                          {(selectedPost.format === PostFormat.Reel || selectedPost.format === PostFormat.Video) && (
                                              <div className="absolute bottom-16 left-4 right-12 text-white text-shadow-sm">
                                                  <p className="text-sm font-bold drop-shadow-md line-clamp-2 mb-1">{selectedPost.title}</p>
                                                  <p className="text-xs opacity-90 line-clamp-2">{selectedPost.caption.substring(0, 60)}...</p>
                                              </div>
                                          )}
                                      </div>

                                      {/* Footer / Caption Area for Feed Posts */}
                                      {selectedPost.format !== PostFormat.Reel && (
                                          <div className="p-4 bg-white text-xs">
                                              <div className="flex gap-3 mb-2">
                                                  <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                                                  <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                                              </div>
                                              <p className="text-gray-900 mb-1"><span className="font-bold">Crystal Clawz</span> {selectedPost.title}</p>
                                              <p className="text-gray-600 line-clamp-2">{selectedPost.caption}</p>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>

                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                          <CheckCircle size={40} className="opacity-20" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400">Review Queue Empty</h3>
                      <p className="text-sm max-w-xs text-center mt-2">Select a post from the list or check back later.</p>
                  </div>
              )}

              {/* Action Bar */}
              {selectedPost && (
                  <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0 shadow-xl z-20">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                          Status: <span className="font-bold text-gray-900 dark:text-white ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">{selectedPost.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex gap-4">
                          <button 
                            onClick={handleNeedsFix}
                            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                              <AlertCircle size={18}/> Request Fixes
                          </button>
                          {canApprove && (
                              <button 
                                onClick={handleApprove}
                                disabled={selectedPost.status === 'APPROVED'}
                                className="px-8 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 shadow-lg shadow-pink-200 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                              >
                                  <CheckCircle size={20}/> Approve Post
                              </button>
                          )}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Review;
