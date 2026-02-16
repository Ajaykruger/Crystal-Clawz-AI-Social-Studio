
import React, { useState } from 'react';
import { ViewState, Platform } from '../types';
import { ArrowLeft, Instagram, Facebook, Youtube, Video, Grid, List as ListIcon } from 'lucide-react';
import { TopPostCard } from './Dashboard';
import PostDetailsModal from '../components/PostDetailsModal';
import { USER_PROVIDED_ASSETS } from '../services/libraryService';

interface TopPostsViewProps {
  onNavigate: (view: ViewState, params?: any) => void;
}

// Extensive mock data for filtering demonstration
const allTopPosts = [
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
    },
    {
        id: 'tp7',
        title: 'Natural Prep Guide',
        thumbnail: USER_PROVIDED_ASSETS[5].url,
        platform: Platform.Instagram,
        likes: '5.6k',
        comments: '340',
        shares: '2.1k',
        trend: '+15%',
        caption: "The ultimate guide to prep. 😊\n\nKey takeaway: Clean cuticle work is 90% of the retention."
    },
    {
        id: 'tp8',
        title: 'Nude Speckle Inspo',
        thumbnail: USER_PROVIDED_ASSETS[3].url,
        platform: Platform.YouTube,
        likes: '900',
        comments: '120',
        shares: '80',
        trend: '+10%',
        caption: "Minimalist dreams. ☁️ How to create the perfect nude speckle look."
    },
    {
        id: 'tp9',
        title: 'Red Floral Art',
        thumbnail: USER_PROVIDED_ASSETS[2].url,
        platform: Platform.TikTok,
        likes: '45k',
        comments: '1.2k',
        shares: '8.5k',
        trend: '+85%',
        caption: "Hand-painted floral details that pop! 🌹 Watch the full process."
    },
    {
        id: 'tp10',
        title: 'Orange is the New Black',
        thumbnail: USER_PROVIDED_ASSETS[10].url,
        platform: Platform.Facebook,
        likes: '320',
        comments: '88',
        shares: '15',
        trend: '+8%',
        caption: "Indulgence #018 is vibrant, creamy, and one-coat coverage. 🍊"
    },
    {
        id: 'tp11',
        title: 'Diamond Gel Reveal',
        thumbnail: USER_PROVIDED_ASSETS[7].url,
        platform: Platform.YouTube,
        likes: '2.2k',
        comments: '400',
        shares: '350',
        trend: '+22%',
        caption: "Unboxing the Diamond Gel #009 - look at that ruby sparkle! 💎"
    },
    {
        id: 'tp12',
        title: 'Pink Bubblegum Fun',
        thumbnail: USER_PROVIDED_ASSETS[11].url,
        platform: Platform.Instagram,
        likes: '4.1k',
        comments: '230',
        shares: '1.5k',
        trend: '+19%',
        caption: "Indulgence #019 is the perfect Barbie pink. 💕 Who wants a swatch video?"
    }
];

const TopPostsView: React.FC<TopPostsViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<Platform | 'ALL'>('ALL');
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const filteredPosts = activeTab === 'ALL' 
    ? allTopPosts 
    : allTopPosts.filter(post => {
        if (activeTab === Platform.YouTube) return post.platform === Platform.YouTube || post.platform === Platform.YouTubeShorts;
        return post.platform === activeTab;
    });

  const handleCreateSimilar = (post: any) => {
      onNavigate('create', { sourcePost: post });
      setSelectedPost(null);
  };

  const TabButton = ({ label, value, icon: Icon }: { label: string, value: Platform | 'ALL', icon?: React.ElementType }) => (
      <button
          onClick={() => setActiveTab(value)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === value 
              ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-100 dark:border-pink-800 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-700 border border-transparent'
          }`}
      >
          {Icon && <Icon size={14} className={activeTab === value ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400 dark:text-slate-500'} />}
          {label}
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={() => onNavigate('dashboard')} 
                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Top Performing Posts</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Analyze your best content across all channels.</p>
                </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <TabButton label="All Platforms" value="ALL" icon={Grid} />
                <TabButton label="Instagram" value={Platform.Instagram} icon={Instagram} />
                <TabButton label="TikTok" value={Platform.TikTok} />
                <TabButton label="Facebook" value={Platform.Facebook} icon={Facebook} />
                <TabButton label="YouTube" value={Platform.YouTube} icon={Youtube} />
            </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredPosts.map(post => (
                        <TopPostCard 
                            key={post.id} 
                            post={post} 
                            onNavigate={onNavigate} 
                            onClick={setSelectedPost}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <p className="font-medium">No posts found for this platform.</p>
                </div>
            )}
        </div>

        <PostDetailsModal 
            isOpen={!!selectedPost}
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onCreateSimilar={handleCreateSimilar}
        />
    </div>
  );
};

export default TopPostsView;
