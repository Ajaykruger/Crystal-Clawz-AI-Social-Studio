
import React, { useState, useMemo, useEffect } from 'react';
import { PlannerConfig, PlanDay, PlanIdea, Platform, PostFormat, ViewState, MediaAsset } from '../types';
import { generateContentPlan, generateImageForPost, generateVideoScripts } from '../services/geminiService';
import { contentEngineService } from '../services/contentEngineService'; // For Veo generation
import { 
  Calendar, Wand2, RefreshCw, CheckCircle, 
  MessageSquare, Sliders, ChevronDown, Check, X,
  AlertCircle, Loader2, Sparkles, CalendarPlus, 
  ArrowLeft, Plus, ChevronRight, Smartphone, Layout,
  Copy, Image as ImageIcon, Video, ExternalLink, Edit
} from 'lucide-react';
import { CCTextArea } from './ui/Inputs';
import { CCTooltip } from './ui/Tooltip';

interface IdeasPlannerProps {
  onApproveIdea: (idea: PlanIdea, date: Date) => void;
  onSaveComplete?: (targetDate: Date) => void;
  onNavigate?: (view: ViewState, params?: any) => void;
}

type PlannerStep = 'configure' | 'generating' | 'results';

// --- SUB-COMPONENTS ---

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
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choose Platforms</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={20} className="text-slate-400"/></button>
                </div>
                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {Object.values(Platform).map(p => (
                        <button 
                            key={p}
                            onClick={() => onToggle(p)}
                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${platforms.includes(p) ? 'border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
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
}) => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 md:bg-transparent">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 md:border-none">
             <h2 className="text-2xl md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <Sparkles className="text-pink-600" size={20}/> AI Planner
             </h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set your preferences, then generate your plan.</p>
         </div>

         <div className="p-6 space-y-6 flex-1 overflow-y-auto">
             {/* Period Card */}
             <div className="bg-slate-50 dark:bg-slate-700/50 md:bg-white md:dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm md:shadow-none md:border-none md:p-0">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 block tracking-wider">Period</label>
                 <div className="flex bg-slate-200/50 dark:bg-slate-700 md:bg-slate-100 md:dark:bg-slate-900 p-1 rounded-xl">
                     {['week', 'month'].map((p) => (
                         <button 
                            key={p}
                            onClick={() => setConfig({...config, period: p as any})}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg capitalize transition-all ${config.period === p ? 'bg-white dark:bg-slate-600 shadow-md text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                         >
                             {p}
                         </button>
                     ))}
                 </div>
             </div>

             {/* Platforms Card */}
             <div className="bg-slate-50 dark:bg-slate-700/50 md:bg-white md:dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm md:shadow-none md:border-none md:p-0">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 block tracking-wider">Platforms</label>
                 <div className="flex flex-wrap gap-2 mb-3">
                     {config.platforms.slice(0, 2).map(p => (
                         <div key={p} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                             {p} <button onClick={() => {
                                 const next = config.platforms.filter(x => x !== p);
                                 setConfig({...config, platforms: next});
                             }}><X size={12}/></button>
                         </div>
                     ))}
                     {config.platforms.length > 2 && (
                         <div className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full text-xs font-bold">
                             +{config.platforms.length - 2} more
                         </div>
                     )}
                 </div>
                 <button 
                    onClick={onShowPlatformPicker}
                    className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                 >
                     <Plus size={14}/> Add Platforms
                 </button>
             </div>

             {/* Goal & Source */}
             <div className="bg-slate-50 dark:bg-slate-700/50 md:bg-white md:dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm md:shadow-none md:border-none md:p-0 space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block tracking-wider">Goal</label>
                    <select 
                        className="w-full p-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none appearance-none"
                        value={config.topicInputs.goal}
                        onChange={(e) => setConfig({...config, topicInputs: {...config.topicInputs, goal: e.target.value}})}
                    >
                        <option className="text-slate-900 dark:text-white bg-white dark:bg-slate-700">Drive engagement</option>
                        <option className="text-slate-900 dark:text-white bg-white dark:bg-slate-700">Grow followers</option>
                        <option className="text-slate-900 dark:text-white bg-white dark:bg-slate-700">Sell products</option>
                        <option className="text-slate-900 dark:text-white bg-white dark:bg-slate-700">Educate community</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block tracking-wider">Source</label>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-3">
                        <button 
                            onClick={() => setConfig({...config, topicSource: 'dropdown'})}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${config.topicSource === 'dropdown' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <Sliders size={12}/> Config
                        </button>
                        <button 
                            onClick={() => setConfig({...config, topicSource: 'chat'})}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${config.topicSource === 'chat' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <MessageSquare size={12}/> Chat
                        </button>
                    </div>

                    {config.topicSource === 'chat' && (
                        <div>
                            <CCTextArea 
                                className="h-28 text-sm"
                                placeholder="Paste a product link or describe your plan..."
                                value={config.topicInputs.chatPrompt || ''}
                                onChange={(e) => setConfig({...config, topicInputs: {...config.topicInputs, chatPrompt: e.target.value}})}
                            />
                            <p className="text-[10px] text-slate-400 mt-2">
                                Tip: Paste a Crystal Clawz URL and we'll build a plan for that product.
                            </p>
                        </div>
                    )}
                 </div>
             </div>
         </div>

         {/* Sticky Footer */}
         <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 md:bg-transparent md:border-none">
             <button 
                onClick={onGenerate}
                disabled={config.platforms.length === 0}
                className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg hover:bg-pink-700 flex items-center justify-center gap-2 shadow-xl shadow-pink-100 dark:shadow-none disabled:opacity-50 transition-all"
             >
                <Wand2 size={20}/> Generate Plan
             </button>
             <p className="text-[10px] text-slate-400 mt-3 text-center uppercase font-bold tracking-widest">Nothing gets posted without your approval</p>
         </div>
    </div>
);

const GeneratingView = ({ onCancel }: { onCancel: () => void }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 h-full">
        <div className="w-24 h-24 mb-8 relative">
            <div className="absolute inset-0 border-4 border-slate-50 dark:border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pink-600 rounded-full border-t-transparent animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto text-pink-600 animate-pulse" size={32} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Creating your plan...</h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-xs mb-8">
            Analyzing your products and selecting the best formats for your audience.
        </p>
        <button 
            onClick={onCancel}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600"
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
    const [genImage, setGenImage] = useState<string | null>(null);
    const [genVideoUrl, setGenVideoUrl] = useState<string | null>(null);

    const handleGenerateImage = async () => {
        if (!idea.visualPrompt) return;
        setIsGeneratingImg(true);
        try {
            const base64 = await generateImageForPost(idea.visualPrompt);
            setGenImage(base64);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingImg(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!idea.visualPrompt) return;
        setIsGeneratingVideo(true);
        try {
            // Using Veo mock/wrapper from contentEngine for 8s video
            const result = await contentEngineService.generateVideoFromPrompt({
                prompt: idea.visualPrompt,
                durationSeconds: "8",
                aspectRatio: "9:16",
                model: "veo-3.1-fast-generate-preview"
            });
            setGenVideoUrl(result.dataUrl);
        } catch (e) {
            console.error(e);
            alert("Video generation unavailable in this environment.");
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    const handleEditInStudio = () => {
        if (onNavigate) {
            // Go directly to Workbench with data pre-filled
            onNavigate('workbench', {
                idea: idea,
                image: genImage // Pass generated image if any
            });
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white dark:bg-slate-800 shadow-2xl z-50 transform transition-transform border-l border-slate-200 dark:border-slate-700 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {idea.platforms.map(p => (
                            <span key={p} className="text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {p}
                            </span>
                        ))}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{idea.title}</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X size={20} className="text-slate-500 dark:text-slate-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Product Context */}
                {idea.productContext && (
                    <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-900 p-4 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-pink-100 dark:bg-pink-800 rounded-lg text-pink-600 dark:text-pink-100">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h4 className="font-bold text-pink-900 dark:text-pink-200 text-sm">Product Focus</h4>
                            <p className="text-xs text-pink-800 dark:text-pink-300 mt-1">{idea.productContext}</p>
                            {idea.productUrl && (
                                <a href={idea.productUrl} target="_blank" rel="noreferrer" className="text-[10px] text-pink-600 dark:text-pink-400 underline mt-1 flex items-center gap-1">
                                    View Product <ExternalLink size={10}/>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Caption Draft */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <MessageSquare size={14}/> Caption Draft
                    </h4>
                    <CCTextArea 
                        className="min-h-[160px] text-sm leading-relaxed"
                        value={idea.captionDraft || ''}
                        onChange={(e) => onUpdateIdea({...idea, captionDraft: e.target.value})}
                    />
                </div>

                {/* Visual Concept */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <ImageIcon size={14}/> Visual Concept
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-4 bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-600">
                        "{idea.visualPrompt || 'No visual prompt generated.'}"
                    </p>
                    
                    {/* Media Generation Buttons */}
                    <div className="flex gap-3 mb-4">
                        <button 
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImg}
                            className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
                        >
                            {isGeneratingImg ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>}
                            Generate Image
                        </button>
                        <button 
                            onClick={handleGenerateVideo}
                            disabled={isGeneratingVideo}
                            className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
                        >
                            {isGeneratingVideo ? <Loader2 size={14} className="animate-spin"/> : <Video size={14}/>}
                            Create 8s Video
                        </button>
                    </div>

                    {/* Generated Previews */}
                    {genImage && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 relative group">
                            <img src={genImage} className="w-full h-48 object-cover" />
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">AI Generated</div>
                        </div>
                    )}
                    {genVideoUrl && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 relative">
                            <video src={genVideoUrl} controls className="w-full h-48 object-cover" />
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">Veo Video</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
                <button 
                    onClick={handleEditInStudio}
                    className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2"
                >
                    <Edit size={16}/> Edit in Studio
                </button>
                <button 
                    onClick={() => { onApprove(idea); onClose(); }}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-100 dark:shadow-none flex items-center gap-2"
                >
                    <CalendarPlus size={16}/> Save to Calendar as Draft
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        {/* Mobile Header Toolbar */}
        <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                {isMobile && <button onClick={onBack} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full text-slate-400"><ArrowLeft size={20}/></button>}
                <h3 className="font-bold text-slate-800 dark:text-white">Your Plan</h3>
            </div>
            <div className="flex gap-2">
                <button onClick={onGenerate} className="p-2 text-slate-400 hover:text-pink-600 rounded-lg" title="Regenerate">
                    <RefreshCw size={18}/>
                </button>
                {stats.proposed > 0 && (
                    <button 
                        onClick={onApproveAll}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg"
                    >
                        Approve All
                    </button>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
            {plan.map((day, dIdx) => (
                <div key={dIdx} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <Calendar size={14} />
                        {day.date.toLocaleDateString('en-ZA', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {day.ideas.map((idea, iIdx) => (
                            <div 
                                key={idea.id} 
                                onClick={() => onOpenIdeaDrawer(idea)}
                                className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-all group ${idea.status === 'SAVED' ? 'border-green-100 dark:border-green-900/50 bg-green-50/10' : idea.status === 'APPROVED' ? 'border-green-200 dark:border-green-800 ring-2 ring-green-50 dark:ring-green-900/30' : 'border-slate-100 dark:border-slate-700'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-1">
                                        {idea.platforms.map(p => (
                                            <span key={p} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded uppercase text-slate-500 dark:text-slate-300">
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
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded uppercase">{idea.format}</span>
                                        {idea.productContext && <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">{idea.productContext}</span>}
                                    </div>
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

        {/* Sticky Action Footer */}
        {stats.approved > 0 && (
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 z-20">
                <button 
                    onClick={onSaveToCalendar}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-green-100 dark:shadow-none animate-in slide-in-from-bottom-4"
                >
                    <CalendarPlus size={20}/> Save to Calendar ({stats.approved})
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

  // Config State
  const [config, setConfig] = useState<PlannerConfig>({
    period: 'week',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    platforms: [Platform.Instagram, Platform.Facebook],
    frequency: '5x_week',
    contentMix: { educational: 40, inspo: 30, community: 20, promo: 10 },
    topicSource: 'dropdown',
    topicInputs: {
        goal: 'Drive engagement',
        theme: 'Seasonal',
        voiceLevel: 'Medium hype'
    }
  });

  // Plan State
  const [plan, setPlan] = useState<PlanDay[]>([]);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Computed stats
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
      setStep('generating');
      try {
          let start = new Date();
          let end = new Date();
          if (config.period === 'week') {
              end.setDate(start.getDate() + 6);
          } else if (config.period === 'month') {
              end.setDate(start.getDate() + 29);
          }
          const finalConfig = { ...config, startDate: start, endDate: end };
          
          const generatedPlan = await generateContentPlan(finalConfig);
          setPlan(generatedPlan);
          setStep('results');
      } catch (e) {
          console.error(e);
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
          ideas: day.ideas.map(idea => {
              if (idea.status === 'PROPOSED') {
                  return { ...idea, status: 'APPROVED' as const };
              }
              return idea;
          })
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
          setTimeout(() => {
              onSaveComplete(config.startDate);
          }, 800);
      }
  };

  const togglePlatform = (p: Platform) => {
      const exists = config.platforms.includes(p);
      const next = exists ? config.platforms.filter(x => x !== p) : [...config.platforms, p];
      setConfig({...config, platforms: next});
  };

  // Drawer Handlers
  const handleUpdateIdeaFromDrawer = (updatedIdea: PlanIdea) => {
      // Find and update in plan state
      const newPlan = plan.map(day => ({
          ...day,
          ideas: day.ideas.map(i => i.id === updatedIdea.id ? updatedIdea : i)
      }));
      setPlan(newPlan);
      setSelectedIdeaForDrawer(updatedIdea); // Update local state for drawer
  };

  const handleApproveFromDrawer = (idea: PlanIdea) => {
      // Find idea coordinates
      let found = false;
      const newPlan = [...plan];
      for (let d = 0; d < newPlan.length; d++) {
          for (let i = 0; i < newPlan[d].ideas.length; i++) {
              if (newPlan[d].ideas[i].id === idea.id) {
                  // Mark as SAVED locally
                  newPlan[d].ideas[i].status = 'SAVED';
                  // Push to calendar immediately
                  onApproveIdea(newPlan[d].ideas[i], newPlan[d].date);
                  found = true;
                  break;
              }
          }
          if(found) break;
      }
      setPlan(newPlan);
  };

  if (isMobile) {
      return (
        <div className="h-full bg-white dark:bg-slate-900">
            {step === 'configure' && (
                <ConfigureView 
                    config={config} 
                    setConfig={setConfig} 
                    onGenerate={handleGenerate} 
                    onShowPlatformPicker={() => setShowPlatformPicker(true)}
                />
            )}
            {step === 'generating' && <GeneratingView onCancel={() => setStep('configure')} />}
            {step === 'results' && (
                <>
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
                    {selectedIdeaForDrawer && (
                        <IdeaDetailDrawer 
                            idea={selectedIdeaForDrawer} 
                            onClose={() => setSelectedIdeaForDrawer(null)}
                            onUpdateIdea={handleUpdateIdeaFromDrawer}
                            onApprove={handleApproveFromDrawer}
                            onNavigate={onNavigate}
                        />
                    )}
                </>
            )}
            <PlatformPickerModal 
                show={showPlatformPicker} 
                onClose={() => setShowPlatformPicker(false)} 
                platforms={config.platforms} 
                onToggle={togglePlatform} 
            />
        </div>
      );
  }

  // Desktop Split-Pane View
  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-y-auto shrink-0">
          <ConfigureView 
              config={config} 
              setConfig={setConfig} 
              onGenerate={handleGenerate} 
              onShowPlatformPicker={() => setShowPlatformPicker(true)}
          />
      </div>
      <div className="flex-1 flex flex-col h-full relative">
          {step === 'configure' && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-12 text-center">
                  <Layout size={64} className="mb-4 opacity-10" />
                  <p className="font-bold text-slate-500 dark:text-slate-400">Configure your preferences</p>
                  <p className="text-sm">Use the left panel to set the period and platforms.</p>
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
