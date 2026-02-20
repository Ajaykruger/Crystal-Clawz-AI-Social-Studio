import React, { useState, useMemo, useEffect } from 'react';
import { PlannerConfig, PlanDay, PlanIdea, Platform, PostFormat, ViewState, MediaAsset, PlanIdeaContent } from '../types';
import { generateContentPlan, generateImageForPost, getTrendingSuggestions, generateCaptionFromAngle, generatePromptFromContext } from '../services/geminiService';
import { contentEngineService } from '../services/contentEngineService'; 
import { 
  Calendar, Wand2, RefreshCw, CheckCircle, 
  MessageSquare, Sliders, ChevronDown, Check, X,
  AlertCircle, Loader2, Sparkles, CalendarPlus, 
  ArrowLeft, Plus, ChevronRight, Smartphone, Layout,
  Copy, Image as ImageIcon, Video, ExternalLink, Edit, Info,
  Instagram, Facebook, Youtube, Zap, Lightbulb,
  TrendingUp, PenTool
} from 'lucide-react';
import { CCTextArea } from './ui/Inputs';
import { CCTooltip } from './ui/Tooltip';

interface IdeasPlannerProps {
  onApproveIdea: (idea: PlanIdea, date: Date) => void;
  onSaveComplete?: (targetDate: Date) => void;
  onNavigate?: (view: ViewState, params?: any) => void;
}

type PlannerStep = 'configure' | 'generating' | 'results';

const getPlatformStyle = (p: Platform) => {
    switch(p) {
        case Platform.Instagram: return "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/30 dark:border-pink-800 dark:text-pink-300";
        case Platform.Facebook: return "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300";
        case Platform.TikTok: return "bg-slate-900 border-slate-700 text-white dark:bg-white dark:text-slate-900";
        case Platform.YouTube: 
        case Platform.YouTubeShorts: return "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-pink-300";
        default: return "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
};

const PlatformIcon = ({ p, size = 12 }: { p: Platform, size?: number }) => {
    switch(p) {
        case Platform.Instagram: return <Instagram size={size}/>;
        case Platform.Facebook: return <Facebook size={size}/>;
        case Platform.YouTube:
        case Platform.YouTubeShorts: return <Youtube size={size}/>;
        case Platform.TikTok: return <span className="font-bold text-[8px] leading-none">Tk</span>;
        default: return <Layout size={size}/>;
    }
};

const PlatformPickerModal = ({ 
    show, 
    onClose, 
    platforms, 
    onToggle 
}: { 
    show: boolean; 
    onClose: () => void; 
    platforms: Platform[]; 
    onToggle: (p: Platform) => void; 
}) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
                <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choose Platforms</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full"><X size={20} className="text-slate-400"/></button>
                </div>
                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {Object.values(Platform).map(p => (
                        <button 
                            key={p}
                            onClick={() => onToggle(p)}
                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${platforms.includes(p) ? 'border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700'}`}
                        >
                            <span className="font-semibold">{p}</span>
                            {platforms.includes(p) && <Check size={20} />}
                        </button>
                    ))}
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        Apply Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

const ConfigureView = ({ 
    config, 
    setConfig, 
    onGenerate, 
    onShowPlatformPicker 
}: { 
    config: PlannerConfig; 
    setConfig: (c: PlannerConfig) => void; 
    onGenerate: () => void; 
    onShowPlatformPicker: () => void; 
}) => {
    const [isWizardLoading, setIsWizardLoading] = useState(false);

    const handleTrendWizard = async () => {
        setIsWizardLoading(true);
        try {
            const trends = await getTrendingSuggestions();
            const topTrend = trends[0];
            setConfig({
                ...config,
                topicInputs: {
                    ...config.topicInputs,
                    chatPrompt: `Focus on the current trend: ${topTrend.text}. Reason: ${topTrend.reason}`
                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsWizardLoading(false);
        }
    };

    const handleMagicBrief = () => {
        setConfig({
            ...config,
            topicSource: 'chat',
            topicInputs: {
                ...config.topicInputs,
                chatPrompt: "Create a mix of educational tips about cuticle care and promotional hype for our new builder gel range. Aim for a 'Bestie' vibe."
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 md:bg-transparent">
            <div className="p-6 border-b border-slate-100 dark:border-gray-700 md:border-none">
                 <h2 className="text-2xl md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <Sparkles className="text-pink-600" size={20}/> AI Planner
                 </h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set your preferences, then generate your plan.</p>
             </div>

             <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                 {/* AI Wizards Section */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Zap size={10}/> AI Wizards
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={handleTrendWizard}
                            disabled={isWizardLoading}
                            className="p-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 rounded-xl text-left hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <TrendingUp size={14} className="text-pink-600"/>
                                {isWizardLoading && <Loader2 size={10} className="animate-spin text-pink-400"/>}
                            </div>
                            <span className="text-[10px] font-bold text-pink-900 dark:text-pink-200 block">Trend Injector</span>
                        </button>
                        <button 
                            onClick={handleMagicBrief}
                            className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl text-left hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <Lightbulb size={14} className="text-purple-600"/>
                            </div>
                            <span className="text-[10px] font-bold text-purple-900 dark:text-purple-200 block">Magic Brief</span>
                        </button>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Input Source</label>
                    <div className="flex bg-slate-100 dark:bg-gray-900 p-1 rounded-xl mb-3">
                        <button 
                            onClick={() => setConfig({...config, topicSource: 'dropdown'})}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${config.topicSource === 'dropdown' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <Sliders size={12}/> Config
                        </button>
                        <button 
                            onClick={() => setConfig({...config, topicSource: 'chat'})}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${config.topicSource === 'chat' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <MessageSquare size={12}/> Chat
                        </button>
                    </div>
                 </div>

                 <div className="space-y-4">
                     <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700">
                         <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-widest">Plan Period</label>
                         <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1 rounded-xl">
                             {['week', 'month'].map((p) => (
                                 <button 
                                    key={p}
                                    onClick={() => setConfig({...config, period: p as any})}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${config.period === p ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                                 >
                                     {p}
                                 </button>
                             ))}
                         </div>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-widest">Target Platforms</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {config.platforms.map(p => (
                                <div key={p} className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 shadow-sm border ${getPlatformStyle(p)}`}>
                                    <PlatformIcon p={p}/>
                                    {p}
                                </div>
                            ))}
                            {config.platforms.length === 0 && <span className="text-[10px] text-red-500 font-bold uppercase italic">No platforms selected</span>}
                        </div>
                        <button 
                            onClick={onShowPlatformPicker}
                            className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Plus size={12}/> {config.platforms.length > 0 ? 'Edit Platforms' : 'Add Platforms'}
                        </button>
                    </div>
                 </div>

                 {config.topicSource === 'dropdown' ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Primary Goal</label>
                            <select 
                                className="w-full p-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 outline-none"
                                value={config.topicInputs.goal}
                                onChange={(e) => setConfig({...config, topicInputs: {...config.topicInputs, goal: e.target.value}})}
                            >
                                <option>Drive engagement</option>
                                <option>Grow followers</option>
                                <option>Sell products</option>
                                <option>Educate community</option>
                            </select>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-widest">Content Mix</label>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>Educational</span>
                                        <span>{config.contentMix.educational}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        className="w-full accent-pink-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        min="0" max="100" step="10"
                                        value={config.contentMix.educational}
                                        onChange={(e) => setConfig({...config, contentMix: {...config.contentMix, educational: parseInt(e.target.value)}})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>Promotional</span>
                                        <span>{100 - config.contentMix.educational}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-200 rounded-lg overflow-hidden">
                                        <div className="h-full bg-pink-400" style={{ width: `${100 - config.contentMix.educational}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 ) : (
                    <div className="animate-in fade-in duration-300">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Chat Instructions</label>
                            <CCTextArea 
                                className="h-32 text-sm"
                                placeholder="e.g. Focus on the new French Rubber Base. Include a mix of Reels and static posts."
                                value={config.topicInputs.chatPrompt || ''}
                                onChange={(e) => setConfig({...config, topicInputs: {...config.topicInputs, chatPrompt: e.target.value}})}
                            />
                            <div className="mt-3 flex items-center gap-2 text-slate-400">
                                <Info size={12} className="shrink-0"/>
                                <span className="text-[10px] font-medium leading-tight">AI will prioritize these instructions over global settings.</span>
                            </div>
                        </div>
                    </div>
                 )}
             </div>

             <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-gray-700">
                 <button 
                    onClick={onGenerate}
                    disabled={config.platforms.length === 0}
                    className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg hover:bg-pink-700 flex items-center justify-center gap-2 shadow-xl shadow-pink-100 dark:shadow-none disabled:opacity-50 transition-all"
                 >
                    <Wand2 size={20}/> Generate Plan
                 </button>
                 <p className="text-[10px] text-slate-400 mt-3 text-center uppercase font-bold tracking-widest">Crystal AI Strategy Engine</p>
             </div>
        </div>
    );
};

const GeneratingView = ({ onCancel }: { onCancel: () => void }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 h-full">
        <div className="w-24 h-24 mb-8 relative">
            <div className="absolute inset-0 border-4 border-slate-50 dark:border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pink-600 rounded-full border-t-transparent animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto text-pink-600 animate-pulse" size={32} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Architecting your plan...</h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-xs mb-8 text-sm leading-relaxed">
            Selecting optimal platforms, researching current South African nail trends, and drafting compliant hooks.
        </p>
        <button 
            onClick={onCancel}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
            Cancel
        </button>
    </div>
);

const IdeaDetailDrawer = ({ 
    idea, 
    onClose, 
    onUpdateIdea, 
    onApprove, 
    onNavigate 
}: { 
    idea: PlanIdea; 
    onClose: () => void; 
    onUpdateIdea: (updated: PlanIdea) => void; 
    onApprove: (idea: PlanIdea) => void; 
    onNavigate?: (view: ViewState, params?: any) => void;
}) => {
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [isMagicRewriting, setIsMagicRewriting] = useState(false);
    const [isMagicExpandingPrompt, setIsMagicExpandingPrompt] = useState(false);
    const [genImage, setGenImage] = useState<string | null>(null);
    const [genVideoUrl, setGenVideoUrl] = useState<string | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>(idea.platforms[0]);

    // Active content based on toggle
    const activeContent: PlanIdeaContent = useMemo(() => {
        if (idea.platformContent && idea.platformContent[selectedPlatform]) {
            return idea.platformContent[selectedPlatform]!;
        }
        return { caption: idea.captionDraft || '', visualPrompt: idea.visualPrompt || '' };
    }, [idea, selectedPlatform]);

    const handleUpdateCaption = (val: string) => {
        const nextPlatformContent = { ...idea.platformContent };
        nextPlatformContent[selectedPlatform] = { ...activeContent, caption: val };
        onUpdateIdea({ ...idea, platformContent: nextPlatformContent, captionDraft: val });
    };

    const handleUpdatePrompt = (val: string) => {
        const nextPlatformContent = { ...idea.platformContent };
        nextPlatformContent[selectedPlatform] = { ...activeContent, visualPrompt: val };
        onUpdateIdea({ ...idea, platformContent: nextPlatformContent, visualPrompt: val });
    };

    const handleGenerateImage = async () => {
        if (!activeContent.visualPrompt) return;
        setIsGeneratingImg(true);
        try {
            const result = await generateImageForPost(activeContent.visualPrompt);
            setGenImage(result.url);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingImg(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!activeContent.visualPrompt) return;
        setIsGeneratingVideo(true);
        try {
            const result = await contentEngineService.generateVideoFromPrompt({
                prompt: activeContent.visualPrompt,
                durationSeconds: "8",
                aspectRatio: "9:16",
                model: "veo-3.1-fast-generate-preview"
            });
            setGenVideoUrl(result.dataUrl);
        } catch (e) {
            console.error(e);
            alert("Video generation unavailable.");
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    const handleCaptionMagic = async () => {
        setIsMagicRewriting(true);
        try {
            // Specialized refinement for the selected platform
            const refined = await generateCaptionFromAngle(idea.title, `Refine and optimize this caption specifically for ${selectedPlatform}`, idea.why, activeContent.caption);
            handleUpdateCaption(refined);
        } catch (e) {
            console.error(e);
        } finally {
            setIsMagicRewriting(false);
        }
    };

    const handlePromptMagic = async () => {
        setIsMagicExpandingPrompt(true);
        try {
            const expanded = await generatePromptFromContext(`Expand this visual concept into a highly detailed, professional AI image prompt for a nail brand: ${activeContent.visualPrompt}`);
            handleUpdatePrompt(expanded);
        } catch (e) {
            console.error(e);
        } finally {
            setIsMagicExpandingPrompt(false);
        }
    };

    const handleEditInStudio = () => {
        if (onNavigate) {
            onNavigate('create', {
                sourcePost: {
                    id: idea.id,
                    title: idea.title,
                    caption: activeContent.caption,
                    thumbnail: genImage,
                    format: idea.format,
                    platforms: [selectedPlatform]
                }
            });
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white dark:bg-slate-800 shadow-2xl z-50 transform transition-transform border-l border-slate-200 dark:border-gray-700 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-start">
                <div className="w-full">
                    <div className="flex items-center gap-1 mb-4 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-gray-700 w-fit">
                        {idea.platforms.map(p => (
                            <button 
                                key={p} 
                                onClick={() => setSelectedPlatform(p)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 ${selectedPlatform === p ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <PlatformIcon p={p}/>
                                {p}
                            </button>
                        ))}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{idea.title}</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-500 dark:text-slate-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-24">
                {idea.productContext && (
                    <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-900 p-4 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-pink-100 dark:bg-pink-800 rounded-lg text-pink-600 dark:text-pink-100"><Sparkles size={18} /></div>
                        <div>
                            <h4 className="font-bold text-pink-900 dark:text-pink-200 text-sm">Product Focus</h4>
                            <p className="text-xs text-pink-800 dark:text-pink-300 mt-1 line-clamp-2">{idea.productContext}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-3 relative group">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                            <MessageSquare size={14}/> {selectedPlatform} Caption
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-pink-600 font-bold bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded">Variation {selectedPlatform}</span>
                            <button 
                                onClick={handleCaptionMagic}
                                disabled={isMagicRewriting}
                                className="p-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-lg hover:scale-110 active:scale-95 transition-all shadow-sm border border-purple-200 dark:border-purple-800"
                                title="Optimize for Platform"
                            >
                                {isMagicRewriting ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14}/>}
                            </button>
                        </div>
                    </div>
                    <CCTextArea 
                        className="min-h-[140px] text-sm leading-relaxed"
                        value={activeContent.caption}
                        onChange={(e) => handleUpdateCaption(e.target.value)}
                    />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                            <ImageIcon size={14}/> Visual Concept
                        </h4>
                        <button 
                            onClick={handlePromptMagic}
                            disabled={isMagicExpandingPrompt}
                            className="p-1.5 bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 rounded-lg hover:scale-110 active:scale-95 transition-all shadow-sm border border-pink-200 dark:border-pink-800"
                            title="Expand to Full AI Prompt"
                        >
                            {isMagicExpandingPrompt ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                        </button>
                    </div>
                    
                    <textarea 
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-gray-600 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-300 italic mb-4 focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                        rows={3}
                        value={activeContent.visualPrompt}
                        onChange={(e) => handleUpdatePrompt(e.target.value)}
                    />
                    
                    <div className="flex gap-3 mb-4">
                        <button 
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImg}
                            className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                            {isGeneratingImg ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>}
                            Generate Image
                        </button>
                        <button 
                            onClick={handleGenerateVideo}
                            disabled={isGeneratingVideo}
                            className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                            {isGeneratingVideo ? <Loader2 size={14} className="animate-spin"/> : <Video size={14}/>}
                            Create 8s Video
                        </button>
                    </div>

                    {genImage && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-600 relative group animate-in zoom-in-95">
                            <img src={genImage} className="w-full h-48 object-cover" alt="Gen preview" />
                        </div>
                    )}
                    {genVideoUrl && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-600 relative animate-in zoom-in-95">
                            <video src={genVideoUrl} controls className="w-full h-48 object-cover" />
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3 shrink-0">
                <button 
                    onClick={handleEditInStudio}
                    className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-gray-600 flex items-center gap-2 transition-all shadow-sm"
                >
                    <Edit size={16}/> Edit in Studio
                </button>
                <button 
                    onClick={() => { onApprove(idea); onClose(); }}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-100 dark:shadow-none flex items-center gap-2 transition-all"
                >
                    <CalendarPlus size={16}/> Save as Idea
                </button>
            </div>
        </div>
    );
};

const ResultsView = ({ 
    plan, 
    stats, 
    onGenerate, 
    onApprove, 
    onReject, 
    onApproveAll, 
    onSaveToCalendar, 
    onBack, 
    isMobile,
    onOpenIdeaDrawer
}: { 
    plan: PlanDay[]; 
    stats: { proposed: number; approved: number; saved: number }; 
    onGenerate: () => void; 
    onApprove: (d: number, i: number) => void; 
    onReject: (d: number, i: number) => void; 
    onApproveAll: () => void; 
    onSaveToCalendar: () => void; 
    onBack: () => void; 
    isMobile: boolean; 
    onOpenIdeaDrawer: (idea: PlanIdea) => void;
}) => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-900 overflow-hidden">
        <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-full text-slate-400 transition-colors"><ArrowLeft size={20}/></button>
                <h3 className="font-bold text-slate-800 dark:text-white">Generated Strategy</h3>
            </div>
            <div className="flex gap-2">
                <button onClick={onGenerate} className="p-2 text-slate-400 hover:text-pink-600 rounded-lg transition-colors" title="Regenerate">
                    <RefreshCw size={18}/>
                </button>
                {stats.proposed > 0 && (
                    <button 
                        onClick={onApproveAll}
                        className="px-4 py-2 text-xs font-bold bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg shadow-sm"
                    >
                        Approve All ({stats.proposed})
                    </button>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 no-scrollbar">
            {plan.map((day, dIdx) => (
                <div key={dIdx} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">
                        <Calendar size={12} />
                        {day.date.toLocaleDateString('en-ZA', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {day.ideas.map((idea, iIdx) => (
                            <div 
                                key={idea.id} 
                                onClick={() => onOpenIdeaDrawer(idea)}
                                className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer hover:shadow-lg transition-all group ${idea.status === 'SAVED' ? 'border-green-100 dark:border-green-900/50 bg-green-50/10' : idea.status === 'APPROVED' ? 'border-green-500 ring-2 ring-green-50 dark:ring-green-900/30' : 'border-slate-100 dark:border-slate-700'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-1">
                                        {idea.platforms.map(p => (
                                            <span key={p} className={`text-[10px] font-bold border px-2 py-1 rounded uppercase ${getPlatformStyle(p)}`}>
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                    {idea.status === 'SAVED' ? <div className="text-green-600"><Check size={18}/></div> : 
                                     idea.status === 'APPROVED' ? <div className="text-green-600"><CheckCircle size={18}/></div> : 
                                     <button onClick={(e) => {e.stopPropagation(); onReject(dIdx, iIdx);}} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={18}/></button>}
                                </div>
                                
                                <div>
                                    <h5 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-1">{idea.title}</h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">"{idea.why}"</p>
                                </div>

                                <div className="mt-auto pt-2 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded uppercase">{idea.format}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onApprove(dIdx, iIdx); }}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${idea.status === 'PROPOSED' ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-transparent text-green-600'}`}
                                    >
                                        {idea.status === 'PROPOSED' ? 'Approve' : 'Approved'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        {stats.approved > 0 && (
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-gray-700 sticky bottom-0 z-20 shadow-2xl">
                <button 
                    onClick={onSaveToCalendar}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-green-100 dark:shadow-none animate-in slide-in-from-bottom-4 transition-all hover:bg-green-700"
                >
                    <CalendarPlus size={20}/> Push to Calendar ({stats.approved})
                </button>
            </div>
        )}
    </div>
);

const IdeasPlanner: React.FC<IdeasPlannerProps> = ({ onApproveIdea, onSaveComplete, onNavigate }) => {
  const [step, setStep] = useState<PlannerStep>('configure');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [selectedIdeaForDrawer, setSelectedIdeaForDrawer] = useState<PlanIdea | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [config, setConfig] = useState<PlannerConfig>({
    period: 'week',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    platforms: [Platform.Instagram, Platform.Facebook],
    frequency: '5x_week',
    contentMix: { educational: 70, inspo: 30, community: 20, promo: 10 },
    topicSource: 'dropdown',
    topicInputs: {
        goal: 'Drive engagement',
        theme: 'Seasonal Trending',
        voiceLevel: 'Medium hype',
        chatPrompt: ''
    }
  });

  const [plan, setPlan] = useState<PlanDay[]>([]);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stats = useMemo(() => {
      let proposed = 0;
      let approved = 0;
      let saved = 0;
      plan.forEach(d => d.ideas.forEach(i => {
          if (i.status === 'PROPOSED') proposed++;
          if (i.status === 'APPROVED') approved++;
          if (i.status === 'SAVED') saved++;
      }));
      return { proposed, approved, saved };
  }, [plan]);

  const handleGenerate = async () => {
      if (config.platforms.length === 0) {
          setErrorMessage("Please select at least one platform.");
          return;
      }

      setStep('generating');
      setErrorMessage(null);
      try {
          const generatedPlan = await generateContentPlan(config);
          setPlan(generatedPlan);
          setStep('results');
      } catch (e: any) {
          console.error("Plan Generation Error:", e);
          setErrorMessage(e.message || "Failed to generate plan.");
          setStep('configure');
      }
  };

  const handleApprove = (dayIndex: number, ideaIndex: number) => {
      const newPlan = [...plan];
      const idea = newPlan[dayIndex].ideas[ideaIndex];
      if (idea.status === 'PROPOSED') {
          idea.status = 'APPROVED';
          setPlan(newPlan);
      }
  };

  const handleReject = (dayIndex: number, ideaIndex: number) => {
      const newPlan = [...plan];
      newPlan[dayIndex].ideas[ideaIndex].status = 'REJECTED';
      setPlan(newPlan);
  };

  const handleApproveAll = () => {
      const newPlan = plan.map(day => ({
          ...day,
          ideas: day.ideas.map(idea => ({ ...idea, status: 'APPROVED' as const }))
      }));
      setPlan(newPlan);
  };

  const handleSaveToCalendar = () => {
      const newPlan = plan.map(day => ({
          ...day,
          ideas: day.ideas.map(idea => {
              if (idea.status === 'APPROVED') {
                  onApproveIdea(idea, day.date);
                  return { ...idea, status: 'SAVED' as const };
              }
              return idea;
          })
      }));
      setPlan(newPlan);

      if (onSaveComplete) {
          setTimeout(() => onSaveComplete(config.startDate), 800);
      }
  };

  const togglePlatform = (p: Platform) => {
      const exists = config.platforms.includes(p);
      const next = exists ? config.platforms.filter(x => x !== p) : [...config.platforms, p];
      setConfig({...config, platforms: next});
  };

  const handleUpdateIdeaFromDrawer = (updatedIdea: PlanIdea) => {
      setPlan(plan.map(day => ({
          ...day,
          ideas: day.ideas.map(i => i.id === updatedIdea.id ? updatedIdea : i)
      })));
      setSelectedIdeaForDrawer(updatedIdea); 
  };

  const handleApproveFromDrawer = (idea: PlanIdea) => {
      setPlan(plan.map(day => {
          const matchingIdea = day.ideas.find(i => i.id === idea.id);
          if (matchingIdea) {
              onApproveIdea(matchingIdea, day.date);
              return { ...day, ideas: day.ideas.map(i => i.id === idea.id ? { ...i, status: 'SAVED' as const } : i) };
          }
          return day;
      }));
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-gray-900 overflow-hidden relative">
      <div className={`${isMobile && step !== 'configure' ? 'hidden' : 'w-full md:w-80'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-gray-700 flex flex-col h-full overflow-y-auto shrink-0 shadow-sm z-10`}>
          <ConfigureView 
              config={config} 
              setConfig={setConfig} 
              onGenerate={handleGenerate} 
              onShowPlatformPicker={() => setShowPlatformPicker(true)}
          />
          {errorMessage && (
              <div className="mx-6 mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-xl flex items-start gap-3 animate-in shake">
                  <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={16}/>
                  <div>
                      <p className="text-xs font-bold text-red-900 dark:text-red-200">Generation Failed</p>
                      <p className="text-[10px] text-red-700 dark:text-red-300 mt-1">{errorMessage}</p>
                  </div>
              </div>
          )}
      </div>

      <div className="flex-1 flex flex-col h-full relative">
          {step === 'configure' && !isMobile && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 opacity-40">
                      <Layout size={32} />
                  </div>
                  <p className="font-bold text-slate-500 dark:text-slate-400">Strategize your content</p>
                  <p className="text-xs max-w-[200px] mt-2">Adjust your frequency and goals on the left to see your plan.</p>
              </div>
          )}
          {step === 'generating' && <GeneratingView onCancel={() => setStep('configure')} />}
          {step === 'results' && (
              <ResultsView 
                  plan={plan} 
                  stats={stats} 
                  onGenerate={handleGenerate} 
                  onApprove={handleApprove} 
                  onReject={handleReject} 
                  onApproveAll={handleApproveAll} 
                  onSaveToCalendar={handleSaveToCalendar}
                  onBack={() => setStep('configure')}
                  isMobile={isMobile}
                  onOpenIdeaDrawer={setSelectedIdeaForDrawer}
              />
          )}
          {selectedIdeaForDrawer && (
              <IdeaDetailDrawer 
                  idea={selectedIdeaForDrawer} 
                  onClose={() => setSelectedIdeaForDrawer(null)}
                  onUpdateIdea={handleUpdateIdeaFromDrawer}
                  onApprove={handleApproveFromDrawer}
                  onNavigate={onNavigate}
              />
          )}
      </div>
      <PlatformPickerModal 
          show={showPlatformPicker} 
          onClose={() => setShowPlatformPicker(false)} 
          platforms={config.platforms} 
          onToggle={togglePlatform} 
      />
    </div>
  );
};

export default IdeasPlanner;