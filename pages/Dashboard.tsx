
import React, { useState } from 'react';
import { ViewState, Platform } from '../types';
import { 
  FileText, CheckCircle, Clock, Send, 
  Sparkles, TrendingUp, Heart, MessageCircle, Share2, 
  Instagram, Facebook, Video, ArrowRight, Zap, Eye,
  Calendar as CalendarIcon, UploadCloud, Plus, MessageSquare
} from 'lucide-react';
import { CCTooltip } from '../components/ui/Tooltip';
import { TooltipKey } from '../services/tooltipService';
import PostDetailsModal from '../components/PostDetailsModal';
import { USER_PROVIDED_ASSETS } from '../services/libraryService';
import { userService } from '../services/userService';

interface DashboardProps {
  onNavigate: (view: ViewState, params?: any) => void;
}

// --- Mock Data ---

const topPosts = [
    {
        id: 'tp1',
        title: 'Riaana Leaf Art',
        thumbnail: USER_PROVIDED_ASSETS[0].url,
        platform: Platform.Instagram,
        likes: '2.4k',
        comments: '142',
        shares: '850',
        trend: '+24%',
        caption: "Spring vibes are loading... 🌸✨ Recreate this look using our new Indulgence shades. \n\n#CrystalClawz #NailArt #SpringNails"
    },
    {
        id: 'tp2',
        title: 'New Indulgence Drop',
        thumbnail: USER_PROVIDED_ASSETS[6].url,
        platform: Platform.TikTok,
        likes: '12.5k',
        comments: '405',
        shares: '3.1k',
        trend: '+40%',
        caption: "Indulgence #008 is THE shade of the season! 🍷 Deep, rich, and perfect for autumn. \n\nGrab yours before it sells out! 🛍️"
    },
    {
        id: 'tp3',
        title: 'Stiletto Floral',
        thumbnail: USER_PROVIDED_ASSETS[1].url,
        platform: Platform.Facebook,
        likes: '450',
        comments: '56',
        shares: '24',
        trend: '+12%',
        caption: "Who loves a stiletto shape? 🙋‍♀️ This floral set is giving us life! \n\nProducts used linked in comments. 👇"
    },
    {
        id: 'tp4',
        title: 'Diamond Gel Sparkle',
        thumbnail: USER_PROVIDED_ASSETS[8].url,
        platform: Platform.Instagram,
        likes: '3.2k',
        comments: '210',
        shares: '1.2k',
        trend: '+18%',
        caption: "Blue Diamond Gel #012 doing the most under flash! 📸💎 \n\nTag a client who needs this sparkle."
    },
    {
        id: 'tp5',
        title: 'Matte Ombre Tutorial',
        thumbnail: USER_PROVIDED_ASSETS[4].url,
        platform: Platform.TikTok,
        likes: '28k',
        comments: '850',
        shares: '5.4k',
        trend: '+55%',
        caption: "Matte + Ombre = Magic ✨ Watch how Johanni creates this seamless blend."
    },
    {
        id: 'tp6',
        title: 'Lime Green Summer',
        thumbnail: USER_PROVIDED_ASSETS[9].url,
        platform: Platform.YouTubeShorts,
        likes: '1.8k',
        comments: '90',
        shares: '120',
        trend: '+32%',
        caption: "It's neon season! 💚 Indulgence #017 is the only green you need."
    }
];

// --- Helper Components ---

export const PlatformIcon = ({ p }: { p: Platform }) => {
    switch(p) {
        case Platform.Instagram: return <div className="bg-white p-1 rounded-full shadow-sm"><Instagram size={12} className="text-pink-600"/></div>;
        case Platform.Facebook: return <div className="bg-white p-1 rounded-full shadow-sm"><Facebook size={12} className="text-blue-600"/></div>;
        case Platform.TikTok: return <div className="bg-white p-1 rounded-full shadow-sm flex items-center justify-center w-5 h-5"><span className="text-[8px] font-bold text-black leading-none">Tk</span></div>;
        case Platform.YouTube: return <div className="bg-white p-1 rounded-full shadow-sm"><Video size={12} className="text-red-600"/></div>;
        case Platform.YouTubeShorts: return <div className="bg-white p-1 rounded-full shadow-sm"><Video size={12} className="text-red-600"/></div>;
        default: return <div className="bg-white p-1 rounded-full shadow-sm"><Video size={12} className="text-gray-400"/></div>;
    }
};

interface TopPostCardProps {
  post: typeof topPosts[0];
  onNavigate: (view: ViewState, params?: any) => void;
  onClick?: (post: typeof topPosts[0]) => void;
}

export const TopPostCard: React.FC<TopPostCardProps> = ({ post, onNavigate, onClick }) => (
    <div 
        className="glass-card rounded-2xl overflow-hidden hover:shadow-xl hover:border-pink-300/50 transition-all group flex flex-col cursor-pointer transform hover:-translate-y-1 duration-300"
        onClick={() => onClick && onClick(post)}
    >
        <div className="h-32 relative bg-gray-100 overflow-hidden">
            <img src={post.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={post.title} />
            <div className="absolute top-2 right-2 z-10">
                <PlatformIcon p={post.platform} />
            </div>
            <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md z-10 border border-white/20">
                <TrendingUp size={12} className="text-white" strokeWidth={3}/> {post.trend}
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-0">
                <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-sm">
                    <Eye size={20} className="text-gray-700"/>
                </div>
            </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2 truncate leading-tight tracking-tight">{post.title}</h4>
            <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1"><Heart size={10} className="text-gray-400"/> {post.likes}</div>
                <div className="flex items-center gap-1"><MessageCircle size={10} className="text-gray-400"/> {post.comments}</div>
                <div className="flex items-center gap-1"><Share2 size={10} className="text-gray-400"/> {post.shares}</div>
            </div>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('create', { sourcePost: post });
                }}
                className="mt-auto w-full py-2 bg-white/50 hover:bg-pink-50 dark:bg-gray-700/50 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-600 hover:border-pink-200 transition-all flex items-center justify-center gap-1.5"
            >
                <Sparkles size={12}/> Create similar
            </button>
        </div>
    </div>
);

interface StatCardProps {
    label: string;
    value: string;
    trend: string;
    trendDir: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, trend, trendDir }) => (
    <div className="glass-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-end justify-between">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${
                trendDir === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
                {trendDir === 'up' ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />} 
                {trend}
            </span>
        </div>
    </div>
);

interface StatusCardProps {
    title: string;
    count: string;
    icon: React.ElementType;
    color: string;
    onClick: () => void;
    tooltipKey: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, count, icon: Icon, color, onClick, tooltipKey }) => (
<CCTooltip registryKey={tooltipKey as TooltipKey}>
    <div 
        onClick={onClick}
        className="glass-card p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-pink-300 hover:shadow-lg transition-all group"
    >
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform shadow-sm`}>
            <Icon size={20} />
        </div>
        <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold block uppercase tracking-wide mb-0.5">{title}</span>
            <span className="text-xl font-extrabold text-gray-900 dark:text-white">{count}</span>
        </div>
    </div>
</CCTooltip>
);

interface QuickWinRowProps {
    title: string;
    detail: string;
    actionLabel: string;
    onNavigate: (view: ViewState, params?: any) => void;
}

const QuickWinRow: React.FC<QuickWinRowProps> = ({ title, detail, actionLabel, onNavigate }) => (
<div className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all flex items-center justify-between gap-4 backdrop-blur-sm">
    <div className="min-w-0">
    <h4 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2 mb-1">
        <Zap size={14} className="text-yellow-500 shrink-0 fill-yellow-500" />
        {title}
    </h4>
    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{detail}</p>
    </div>
    <button 
    onClick={() => onNavigate('create')}
    className="text-xs font-bold text-pink-600 hover:text-pink-700 whitespace-nowrap bg-white/80 dark:bg-gray-900/80 border border-pink-100 dark:border-pink-900 px-4 py-2 rounded-lg hover:border-pink-200 shadow-sm"
    >
    {actionLabel}
    </button>
</div>
);

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [dateRange, setDateRange] = useState('7d');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  const currentUser = userService.getCurrentUser();

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleCreateSimilar = (post: any) => {
      onNavigate('create', { sourcePost: post });
      setSelectedPost(null);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 pb-24">
      
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="heading-page text-4xl mb-2">{getGreeting()}, {currentUser.name}! 💅</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Your studio is buzzing. Here's what's happening.</p>
        </div>
        
        <div className="glass-card p-1.5 rounded-xl flex text-sm bg-white/50 backdrop-blur-md">
            {['7d', '30d'].map(d => (
                <button
                    key={d}
                    onClick={() => setDateRange(d)}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${dateRange === d ? 'bg-white dark:bg-gray-700 shadow-md text-pink-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    {d === '7d' ? 'This Week' : 'This Month'}
                </button>
            ))}
        </div>
      </div>

      {/* 2. SNAPSHOT: Performance Metrics */}
      <section>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={16}/> Performance Snapshot
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard label="Total Reach" value="28.4k" trend="12%" trendDir="up" />
              <StatCard label="Engagement" value="1.9k" trend="8%" trendDir="up" />
              <StatCard label="Link Clicks" value="1,240" trend="2%" trendDir="down" />
              <StatCard label="Net Followers" value="+126" trend="4%" trendDir="up" />
          </div>
      </section>

      {/* NEW: Social Engagement Spotlight */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={16}/> Social Inbox
                  <span className="text-[9px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm animate-pulse">Phase 2</span>
              </h2>
              <button 
                  onClick={() => onNavigate('social-suite')}
                  className="text-xs font-bold text-pink-600 hover:text-pink-700 hover:underline transition-all"
              >
                  Go to Inbox
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                  onClick={() => onNavigate('social-suite')}
                  className="glass-card p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-300 hover:shadow-lg transition-all group overflow-hidden relative"
              >
                  <div className="flex items-center gap-4 relative z-10">
                      <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                          <MessageSquare size={20} />
                      </div>
                      <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-bold block uppercase tracking-wide">Unread Messages</span>
                          <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">2</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                      <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">Needs Attention</span>
                      <ArrowRight size={18} className="text-gray-300 group-hover:text-pink-600 transition-colors" />
                  </div>
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
              </div>
              
              <div 
                  onClick={() => onNavigate('social-suite')}
                  className="glass-card p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-300 hover:shadow-lg transition-all group overflow-hidden relative"
              >
                  <div className="flex items-center gap-4 relative z-10">
                      <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                          <MessageCircle size={20} />
                      </div>
                      <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-bold block uppercase tracking-wide">Pending Comments</span>
                          <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">5</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                      <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">Needs Attention</span>
                      <ArrowRight size={18} className="text-gray-300 group-hover:text-pink-600 transition-colors" />
                  </div>
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
              </div>
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* 3. STATUS: Operational Cards */}
          <div className="lg:col-span-2">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Studio Status</h2>
              <div className="grid grid-cols-2 gap-6">
                  <StatusCard 
                      title="Drafts" 
                      count="4" 
                      icon={FileText} 
                      color="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      onClick={() => onNavigate('drafts')}
                      tooltipKey="dashboard.kpi.drafts"
                  />
                  <StatusCard 
                      title="In Review" 
                      count="2" 
                      icon={CheckCircle} 
                      color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                      onClick={() => onNavigate('review')}
                      tooltipKey="dashboard.kpi.in_review"
                  />
                  <StatusCard 
                      title="Scheduled" 
                      count="5" 
                      icon={Clock} 
                      color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      onClick={() => onNavigate('calendar')}
                      tooltipKey="dashboard.kpi.scheduled"
                  />
                  <StatusCard 
                      title="Posted" 
                      count="12" 
                      icon={Send} 
                      color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      onClick={() => onNavigate('calendar')}
                      tooltipKey="dashboard.kpi.posted"
                  />
              </div>
          </div>

          {/* 4. SUGGESTIONS: Quick Wins */}
          <div>
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Quick Wins</h2>
              <div className="glass-card p-6 rounded-2xl space-y-4">
                  <QuickWinRow 
                      title="Gap Tomorrow" 
                      detail="No posts scheduled." 
                      actionLabel="Draft Idea"
                      onNavigate={onNavigate}
                  />
                  <QuickWinRow 
                      title="Trend Alert" 
                      detail="Cat Eye is trending." 
                      actionLabel="Create"
                      onNavigate={onNavigate}
                  />
                  <QuickWinRow 
                      title="Repurpose" 
                      detail="Turn top Reel into Story." 
                      actionLabel="Go"
                      onNavigate={onNavigate}
                  />
              </div>
          </div>
      </div>

      {/* 1. HERO: Top Performing Posts */}
      <section>
          <div className="flex items-center justify-between mb-6">
              <h2 className="heading-section flex items-center gap-2 text-xl">
                  <Sparkles className="text-pink-600" size={20} /> Top Performing Posts
              </h2>
              <button 
                onClick={() => onNavigate('top-posts')} 
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:text-pink-600 hover:border-pink-200 transition-all flex items-center gap-2 shadow-sm"
              >
                  View full report <ArrowRight size={14}/>
              </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {topPosts.map(post => (
                  <TopPostCard 
                    key={post.id} 
                    post={post} 
                    onNavigate={onNavigate} 
                    onClick={setSelectedPost}
                  />
              ))}
          </div>
      </section>

      <PostDetailsModal 
        isOpen={!!selectedPost}
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onCreateSimilar={handleCreateSimilar}
      />
    </div>
  );
};

export default Dashboard;
