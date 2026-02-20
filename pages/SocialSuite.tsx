
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Platform } from '../types';
import { 
  MessageSquare, MessageCircle, Send, Sparkles, 
  Search, Filter, CheckCircle, Clock, Trash2, 
  MoreVertical, Instagram, Facebook, Layout, Loader2,
  ChevronRight, Reply, ThumbsUp, Heart, Share2, 
  User, Check, X, AlertCircle, ExternalLink, BarChart3, TrendingUp
} from 'lucide-react';
import { generateSocialReply, analyzeSentiment } from '../services/geminiService';
import { CCTextArea } from '../components/ui/Inputs';
import { USER_PROVIDED_ASSETS } from '../services/libraryService';

interface SocialItem {
    id: string;
    type: 'message' | 'comment';
    platform: Platform;
    user: {
        name: string;
        handle: string;
        avatar?: string;
    };
    content: string;
    timestamp: string;
    unread: boolean;
    postThumbnail?: string; // For comments
    postUrl?: string;
    sentiment?: { label: 'positive' | 'neutral' | 'negative'; score: number; summary: string };
    thread?: { role: 'user' | 'brand'; content: string; timestamp: string }[];
}

const MOCK_DATA: SocialItem[] = [
    {
        id: 'msg_1',
        type: 'message',
        platform: Platform.Instagram,
        user: { name: 'Lindiwe M.', handle: '@lindynails_sa' },
        content: "Hey Crystal! I'm struggling with the Rubber Base lifting. Any tips for a beginner?",
        timestamp: '10 mins ago',
        unread: true,
        sentiment: { label: 'neutral', score: 45, summary: 'User is requesting technical product support for Rubber Base.' },
        thread: [
            { role: 'user', content: "Hey Crystal! I'm struggling with the Rubber Base lifting. Any tips for a beginner?", timestamp: '10 mins ago' }
        ]
    },
    {
        id: 'com_1',
        type: 'comment',
        platform: Platform.TikTok,
        user: { name: 'Beauty Tech', handle: '@techbeauty99' },
        content: "Wow, that pigment is INSANE! Is this the new Indulgence #008?",
        timestamp: '1 hour ago',
        unread: true,
        sentiment: { label: 'positive', score: 92, summary: 'User is showing excitement about Indulgence #008 pigment.' },
        postThumbnail: USER_PROVIDED_ASSETS[6].url,
        postUrl: 'https://www.tiktok.com/@crystalclawz/video/73289123',
    },
    {
        id: 'msg_2',
        type: 'message',
        platform: Platform.Facebook,
        user: { name: 'Sarah Botha', handle: 'Sarah B.' },
        content: "Do you have any training dates available for Cape Town next month?",
        timestamp: '3 hours ago',
        unread: false,
        sentiment: { label: 'neutral', score: 50, summary: 'User inquiring about training schedules in Cape Town.' },
    },
    {
        id: 'com_2',
        type: 'comment',
        platform: Platform.Instagram,
        user: { name: 'Nomsa G.', handle: '@noms_nails' },
        content: "Love this look! 🔥🔥🔥",
        timestamp: '5 hours ago',
        unread: false,
        sentiment: { label: 'positive', score: 98, summary: 'Pure praise and excitement for the nail set.' },
        postThumbnail: USER_PROVIDED_ASSETS[2].url,
        postUrl: 'https://www.instagram.com/p/C2f9v8_L/',
    }
];

const SocialSuite: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'message' | 'comment'>('all');
    const [selectedId, setSelectedId] = useState<string | null>(MOCK_DATA[0].id);
    const [replyText, setReplyText] = useState('');
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const selectedItem = useMemo(() => MOCK_DATA.find(i => i.id === selectedId), [selectedId]);

    const filteredItems = useMemo(() => {
        return MOCK_DATA.filter(item => {
            const matchesTab = activeTab === 'all' || item.type === activeTab;
            const matchesSearch = item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 item.content.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [activeTab, searchQuery]);

    const globalSentiment = useMemo(() => {
        const count = MOCK_DATA.length;
        const positive = MOCK_DATA.filter(i => i.sentiment?.label === 'positive').length;
        const neutral = MOCK_DATA.filter(i => i.sentiment?.label === 'neutral').length;
        const negative = MOCK_DATA.filter(i => i.sentiment?.label === 'negative').length;
        return { positive: (positive/count)*100, neutral: (neutral/count)*100, negative: (negative/count)*100 };
    }, []);

    const handleAIReply = async () => {
        if (!selectedItem) return;
        setIsAIGenerating(true);
        try {
            const reply = await generateSocialReply(selectedItem.content, selectedItem.type, selectedItem.platform);
            setReplyText(reply);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAIGenerating(false);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedItem) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeSentiment(selectedItem.content);
            // Update local mock data for demo
            const item = MOCK_DATA.find(i => i.id === selectedId);
            if (item) item.sentiment = result;
            setSelectedId(selectedId); // trigger re-render
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSend = () => {
        if (!replyText.trim()) return;
        // In a real app, send to API
        alert(`Reply sent to ${selectedItem?.user.handle}`);
        setReplyText('');
    };

    const PlatformBadge = ({ platform }: { platform: Platform }) => {
        switch(platform) {
            case Platform.Instagram: return <Instagram size={12} className="text-pink-600" />;
            case Platform.TikTok: return <span className="text-[10px] font-extrabold">Tk</span>;
            case Platform.Facebook: return <Facebook size={12} className="text-blue-600" />;
            default: return <Layout size={12} />;
        }
    };

    const SentimentTag = ({ sentiment }: { sentiment: SocialItem['sentiment'] }) => {
        if (!sentiment) return null;
        const colors = {
            positive: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
            negative: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
        return (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${colors[sentiment.label]}`}>
                {sentiment.label} {sentiment.score}
            </span>
        );
    };

    return (
        <div className="flex h-full bg-slate-50 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
            
            {/* Sidebar List */}
            <div className="w-80 md:w-96 border-r border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full shrink-0">
                <div className="p-6 border-b border-slate-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Inbox
                            <span className="text-[10px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Phase 2</span>
                        </h2>
                        <button className="p-2 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-full text-slate-400"><Filter size={18}/></button>
                    </div>

                    {/* Community Health Bar */}
                    <div className="mb-6 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><TrendingUp size={10}/> Community Sentiment</span>
                            <span className="text-green-600">{Math.round(globalSentiment.positive)}% Positive</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                            <div className="h-full bg-green-500" style={{ width: `${globalSentiment.positive}%` }} />
                            <div className="h-full bg-slate-300 dark:bg-slate-500" style={{ width: `${globalSentiment.neutral}%` }} />
                            <div className="h-full bg-red-500" style={{ width: `${globalSentiment.negative}%` }} />
                        </div>
                    </div>

                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search inbox..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-1 bg-slate-100 dark:bg-gray-900 p-1 rounded-lg">
                        {(['all', 'message', 'comment'] as const).map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                            >
                                {tab === 'all' ? 'all' : `${tab}s`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-gray-700">
                    {filteredItems.map(item => (
                        <div 
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className={`p-4 cursor-pointer transition-colors relative hover:bg-slate-50 dark:hover:bg-gray-700/50 ${selectedId === item.id ? 'bg-pink-50/50 dark:bg-pink-900/10 border-l-4 border-l-pink-600' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex gap-3">
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-gray-600 flex items-center justify-center font-bold text-slate-500">
                                        {item.user.name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm border border-slate-100 dark:border-gray-700">
                                        <PlatformBadge platform={item.platform} />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <div className="flex flex-col">
                                            <h4 className={`text-sm font-bold truncate ${item.unread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {item.user.name}
                                            </h4>
                                            <SentimentTag sentiment={item.sentiment} />
                                        </div>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{item.timestamp}</span>
                                    </div>
                                    <p className={`text-xs truncate ${item.unread ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-500'}`}>
                                        {item.content}
                                    </p>
                                </div>
                                {item.postThumbnail && (
                                    <div className="w-10 h-10 rounded overflow-hidden shrink-0 border border-slate-100 dark:border-gray-700 shadow-sm">
                                        <img src={item.postThumbnail} className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                            {item.unread && <div className="absolute top-4 right-4 w-2 h-2 bg-pink-600 rounded-full shadow-sm shadow-pink-200" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Pane */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full">
                {selectedItem ? (
                    <>
                        {/* Thread Header */}
                        <div className="h-16 border-b border-slate-100 dark:border-gray-700 px-6 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center font-bold text-slate-400">
                                    {selectedItem.user.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedItem.user.name}</h3>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <PlatformBadge platform={selectedItem.platform} />
                                        {selectedItem.user.handle}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg text-slate-400 hover:text-pink-600 transition-all"
                                    title="AI Analyze"
                                >
                                    {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <BarChart3 size={18}/>}
                                </button>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full text-slate-400"><Heart size={18}/></button>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full text-slate-400"><MoreVertical size={18}/></button>
                            </div>
                        </div>

                        {/* Thread Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-gray-900">
                            {/* Sentiment/Insight Banner */}
                            {selectedItem.sentiment && (
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-l-4 border-l-purple-500 border border-slate-100 dark:border-gray-700 shadow-sm flex items-start gap-3">
                                    <Sparkles size={18} className="text-purple-500 shrink-0 mt-1"/>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI Context Analysis</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{selectedItem.sentiment.summary}</p>
                                    </div>
                                </div>
                            )}

                            {selectedItem.type === 'comment' && selectedItem.postThumbnail && (
                                <div className="flex justify-center">
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm flex items-center gap-4 max-w-md w-full">
                                        <img src={selectedItem.postThumbnail} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Post Context</p>
                                                {selectedItem.postUrl && (
                                                    <a 
                                                        href={selectedItem.postUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] font-bold text-pink-600 hover:text-pink-700 hover:underline flex items-center gap-1"
                                                    >
                                                        View Post <ExternalLink size={10}/>
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">New Summer Collection Reveal! ✨ Check out these chrome shades...</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col space-y-4">
                                {/* The User Item */}
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl rounded-bl-none p-4 shadow-sm">
                                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                            {selectedItem.content}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-2 text-right">{selectedItem.timestamp}</p>
                                    </div>
                                </div>

                                {selectedItem.thread?.map((chat, idx) => chat.role === 'brand' && (
                                    <div key={idx} className="flex justify-end animate-in fade-in slide-in-from-bottom-2">
                                        <div className="max-w-[80%] bg-pink-600 text-white rounded-2xl rounded-br-none p-4 shadow-md">
                                            <p className="text-sm leading-relaxed">{chat.content}</p>
                                            <p className="text-[10px] text-pink-200 mt-2 text-right">{chat.timestamp}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reply Input */}
                        <div className="p-6 border-t border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            
                            {/* AI Suggestion Bar */}
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Reply size={14}/> Reply
                                </label>
                                <button 
                                    onClick={handleAIReply}
                                    disabled={isAIGenerating}
                                    className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-100 dark:border-purple-800 flex items-center gap-2 hover:bg-purple-100 transition-all shadow-sm"
                                >
                                    {isAIGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} className="text-purple-500"/>}
                                    Draft with Crystal AI
                                </button>
                            </div>

                            <div className="relative">
                                <CCTextArea 
                                    className="min-h-[100px] text-sm pr-12"
                                    placeholder={`Write a ${selectedItem.type === 'comment' ? 'comment' : 'message'}...`}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <button 
                                    onClick={handleSend}
                                    disabled={!replyText.trim()}
                                    className="absolute bottom-3 right-3 p-2 bg-pink-600 text-white rounded-xl shadow-lg shadow-pink-200 dark:shadow-none hover:bg-pink-700 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            
                            <div className="mt-3 flex items-center gap-4">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Voice: Crystal Clawz Bestie</p>
                                <div className="flex gap-2">
                                    <button className="text-[10px] bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded text-slate-500 font-bold hover:bg-slate-200">Refine</button>
                                    <button className="text-[10px] bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded text-slate-500 font-bold hover:bg-slate-200">Shorten</button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare size={32} className="opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400">Select a conversation</h3>
                        <p className="text-sm max-w-xs mt-2">Pick a message or comment from the left to start engaging with your community.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialSuite;
