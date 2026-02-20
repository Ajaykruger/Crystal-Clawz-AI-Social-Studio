import React, { useState, useEffect } from 'react';
import { DraftState, ViewState, Platform, PostFormat, MediaAsset } from '../types';
import { 
  ArrowLeft, Save, Video, Image as ImageIcon, Type, 
  Smartphone, Download, Share2, 
  Maximize2, Scissors, Check, X, RefreshCw, LayoutTemplate, Zap, Wand2, Loader2, Plus, 
  Sparkles, Library, Eraser, History, Layers, Palette, Trash2, Undo2, Upload, Eye, FileSearch, Film
} from 'lucide-react';
import { CCTextArea, CCTextField } from '../components/ui/Inputs';
import CapCutHandoffModal from '../components/CapCutHandoffModal';
import LibraryModal from './Library';
import { generateImageForPost, generatePromptFromContext, refineImageWithAI, generateCaptionFromAngle, animateImageWithVeo, analyzeImageDeep } from '../services/geminiService';
import { addAsset } from '../services/libraryService';

interface ImageWithMetadata {
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
    parent_id?: string;
    isAnimate?: boolean;
}

interface EditorStudioProps {
  draft: DraftState;
  setDraft: (d: DraftState) => void;
  onNext: () => void;
  onNavigate: (view: ViewState, params?: any) => void;
}

const EditorStudio: React.FC<EditorStudioProps> = ({ draft, setDraft, onNext, onNavigate }) => {
  const [showCapCutModal, setShowCapCutModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [nanoPrompt, setNanoPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isGeneratingNano, setIsGeneratingNano] = useState(false);
  const [isMagicPrompting, setIsMagicPrompting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [didSaveSuccess, setDidSaveSuccess] = useState(false);
  
  const [isHeadlineWizardLoading, setIsHeadlineWizardLoading] = useState(false);
  const [isCaptionWizardLoading, setIsCaptionWizardLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);

  // Visual Studio State
  const [focusImage, setFocusImage] = useState<ImageWithMetadata | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const aspectRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];

  // Initialize state from draft
  const [imagesWithMetadata, setImagesWithMetadata] = useState<ImageWithMetadata[]>(
      (draft.finalContent.assets.images || []).map((url, i) => ({ 
          id: `init_${i}`,
          url, 
          prompt: draft.finalContent.imagePrompt || "Initial generation",
          timestamp: Date.now() - (i * 1000)
      }))
  );

  const updateDraftAssets = (newMeta: ImageWithMetadata[]) => {
      setDraft({
          ...draft,
          finalContent: { 
              ...draft.finalContent, 
              assets: { ...draft.finalContent.assets, images: newMeta.map(m => m.url) } 
          }
      });
  };

  const handleGenerateFresh = async () => {
      if (!nanoPrompt) return;
      setIsGeneratingNano(true);
      try {
          const result = await generateImageForPost(nanoPrompt, aspectRatio);
          if (result.url) {
              const newMeta: ImageWithMetadata = { id: `gen_${Date.now()}`, url: result.url, prompt: result.prompt, timestamp: Date.now() };
              const nextMeta = [newMeta, ...imagesWithMetadata];
              setImagesWithMetadata(nextMeta);
              updateDraftAssets(nextMeta);
              setNanoPrompt("");
              setFocusImage(newMeta);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingNano(false);
      }
  };

  const handleAnimateImage = async () => {
      if (!focusImage) return;
      setIsAnimating(true);
      try {
          const videoUrl = await animateImageWithVeo(focusImage.url, nanoPrompt);
          // For simplicity, we add the video as a special image metadata item
          const newMeta: ImageWithMetadata = { 
              id: `veo_${Date.now()}`, 
              url: videoUrl, 
              prompt: `Animate: ${focusImage.prompt}`, 
              timestamp: Date.now(),
              isAnimate: true
          };
          const nextMeta = [newMeta, ...imagesWithMetadata];
          setImagesWithMetadata(nextMeta);
          setFocusImage(newMeta);
          alert("Video generated successfully! You can find it in the history grid.");
      } catch (e) {
          console.error(e);
          alert("Veo animation failed. Ensure you have selected a paid API key.");
      } finally {
          setIsAnimating(false);
      }
  };

  const handleDeepAnalyze = async () => {
      if (!focusImage) return;
      setIsDeepAnalyzing(true);
      try {
          const result = await analyzeImageDeep(focusImage.url, 'image/png');
          setDeepAnalysis(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsDeepAnalyzing(false);
      }
  };

  const handleHeadlineWizard = async () => {
      setIsHeadlineWizardLoading(true);
      try {
          const refined = await generateCaptionFromAngle(draft.finalContent.copy || draft.inputs.text, "Catchy Headline / Hook", "Nail Tech Community", draft.finalContent.title);
          setDraft({...draft, finalContent: {...draft.finalContent, title: refined.slice(0, 80).replace(/["']/g, '')}});
      } catch (e) {
          console.error(e);
      } finally {
          setIsHeadlineWizardLoading(false);
      }
  };

  const handleCaptionWizard = async () => {
      setIsCaptionWizardLoading(true);
      try {
          const refined = await generateCaptionFromAngle(draft.inputs.text, "Optimize and Expand", "High Engagement", draft.finalContent.copy);
          setDraft({...draft, finalContent: {...draft.finalContent, copy: refined}});
      } catch (e) {
          console.error(e);
      } finally {
          setIsCaptionWizardLoading(false);
      }
  };

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              const url = event.target?.result as string;
              const newMeta: ImageWithMetadata = { 
                  id: `upload_${Date.now()}`, 
                  url, 
                  prompt: `Uploaded image: ${file.name}`, 
                  timestamp: Date.now() 
              };
              const nextMeta = [newMeta, ...imagesWithMetadata];
              setImagesWithMetadata(nextMeta);
              updateDraftAssets(nextMeta);
              setFocusImage(newMeta);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleLibrarySelect = (asset: MediaAsset) => {
      const newMeta: ImageWithMetadata = { 
          id: `lib_${Date.now()}`, 
          url: asset.url, 
          prompt: `Imported from Library: ${asset.filename}`, 
          timestamp: Date.now() 
      };
      const nextMeta = [newMeta, ...imagesWithMetadata];
      setImagesWithMetadata(nextMeta);
      updateDraftAssets(nextMeta);
      setFocusImage(newMeta);
      setShowLibrary(false);
  };

  const handleRefine = async (preset?: string) => {
      const promptToUse = preset || refinementPrompt;
      if (!focusImage || !promptToUse) return;
      
      setIsRefining(true);
      try {
          const result = await refineImageWithAI(focusImage.url, promptToUse);
          if (result.url) {
              const newMeta: ImageWithMetadata = { 
                  id: `ref_${Date.now()}`, 
                  url: result.url, 
                  prompt: result.prompt, 
                  timestamp: Date.now(),
                  parent_id: focusImage.id 
              };
              const nextMeta = [newMeta, ...imagesWithMetadata];
              setImagesWithMetadata(nextMeta);
              updateDraftAssets(nextMeta);
              setFocusImage(newMeta);
              setRefinementPrompt("");
          }
      } catch (e) {
          console.error(e);
          alert("Refinement failed. Try a simpler adjustment.");
      } finally {
          setIsRefining(false);
      }
  };

  const handleUndo = () => {
      if (!focusImage || !focusImage.parent_id) return;
      
      const parent = imagesWithMetadata.find(img => img.id === focusImage.parent_id);
      if (parent) {
          const nextMeta = imagesWithMetadata.filter(img => img.id !== focusImage.id);
          setImagesWithMetadata(nextMeta);
          updateDraftAssets(nextMeta);
          setFocusImage(parent);
      }
  };

  const handleSaveToLibrary = (item: ImageWithMetadata) => {
      const asset: MediaAsset = {
          id: `gen_${Date.now()}`,
          filename: `Crystal_Clawz_AI_${Date.now()}.png`,
          fileType: item.isAnimate ? 'video' : 'image',
          url: item.url,
          createdAt: new Date().toISOString(),
          tags: ['ai-generated', 'gemini-creator'],
          status: 'final',
          folderPath: 'Content Ready',
          packData: JSON.stringify({ prompt: item.prompt })
      };
      addAsset(asset);
      setSaveStatus(item.id);
      setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleMagicPrompt = async () => {
      const context = draft.finalContent.copy || draft.finalContent.title || draft.inputs.text || "";
      if (!context) return;
      setIsMagicPrompting(true);
      try {
          const suggested = await generatePromptFromContext(context);
          setNanoPrompt(suggested);
      } catch (e) {
          console.error(e);
      } finally {
          setIsMagicPrompting(false);
      }
  };

  const handleFinalSave = async () => {
    setIsSavingDraft(true);
    updateDraftAssets(imagesWithMetadata);
    await new Promise(r => setTimeout(r, 600));
    setDidSaveSuccess(true);
    await new Promise(r => setTimeout(r, 400));
    onNext();
    setIsSavingDraft(false);
  };

  const refinementPresets = [
      "Change nails to royal blue",
      "Add a gold ring on ring finger",
      "Apply glossy high-shine top coat",
      "Add subtle glitter to nail tips",
      "Make background more minimalist"
  ];

  const isVideoFormat = draft.settings.format === PostFormat.Reel || draft.settings.format === PostFormat.Video;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* Header */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
              <button 
                onClick={() => setDraft({ ...draft, selectedOptionId: undefined })}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
                type="button"
              >
                  <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editor Studio</h2>
          </div>
          
          <div className="flex items-center gap-3">
              {isVideoFormat && (
                  <button onClick={() => setShowCapCutModal(true)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-gray-200 flex items-center gap-2 transition-all" type="button">
                      <Scissors size={16} /> CapCut
                  </button>
              )}
              <button 
                onClick={handleFinalSave} 
                disabled={isSavingDraft || didSaveSuccess}
                className={`px-6 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 transition-all ${didSaveSuccess ? 'bg-green-600 text-white' : 'bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-70'}`}
                type="button"
              >
                  {isSavingDraft ? <Loader2 size={16} className="animate-spin"/> : didSaveSuccess ? <Check size={16}/> : <Save size={16} />}
                  {isSavingDraft ? 'Saving...' : didSaveSuccess ? 'Saved!' : 'Save Draft'}
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-white dark:bg-gray-800 scrollbar-hide no-scrollbar">
              
              <div className="max-w-4xl mx-auto space-y-8 pb-20">
                  <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Type size={18} className="text-blue-500"/> Content Design
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <CCTextField label="Headline / Hook" value={draft.finalContent.title} onChange={(e) => setDraft({...draft, finalContent: {...draft.finalContent, title: e.target.value}})} />
                            </div>
                            <button 
                                onClick={handleHeadlineWizard}
                                disabled={isHeadlineWizardLoading}
                                className="mb-0.5 p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-xl hover:bg-purple-100 border border-purple-100 dark:border-purple-800 transition-all shadow-sm group"
                                title="Optimize Hook"
                            >
                                {isHeadlineWizardLoading ? <Loader2 size={20} className="animate-spin"/> : <Wand2 size={20} className="group-hover:rotate-12 transition-transform"/>}
                            </button>
                        </div>

                        <div className="relative group">
                            <CCTextArea label="Full Caption" className="min-h-[160px]" value={draft.finalContent.copy} onChange={(e) => setDraft({...draft, finalContent: {...draft.finalContent, copy: e.target.value}})} />
                            <button 
                                onClick={handleCaptionWizard}
                                disabled={isCaptionWizardLoading}
                                className="absolute top-8 right-2 p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 rounded-xl hover:bg-pink-100 border border-pink-100 dark:border-pink-800 transition-all shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                title="AI Expansion Wizard"
                            >
                                {isCaptionWizardLoading ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                            </button>
                        </div>
                      </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 dark:border-gray-700 space-y-6">
                      <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                              <ImageIcon size={18} className="text-purple-500"/> Visual Studio
                          </h3>
                      </div>

                      {/* Fresh Generation Box */}
                      <div className="bg-slate-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-slate-200 dark:border-gray-700">
                          <div className="flex justify-between items-center mb-4">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Zap size={14} className="text-yellow-500 fill-yellow-500"/> Create High-Quality Visual (Pro)
                              </p>
                              <button onClick={handleMagicPrompt} disabled={isMagicPrompting} className="text-[10px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-full transition-all" type="button">
                                  {isMagicPrompting ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>}
                                  WIZARD PROMPT
                              </button>
                          </div>
                          
                          <div className="mb-4">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Aspect Ratio</label>
                              <div className="flex flex-wrap gap-2">
                                  {aspectRatios.map(ar => (
                                      <button 
                                          key={ar} 
                                          onClick={() => setAspectRatio(ar)}
                                          className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${aspectRatio === ar ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800'}`}
                                      >
                                          {ar}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="flex gap-3">
                              <input 
                                value={nanoPrompt} 
                                onChange={e => setNanoPrompt(e.target.value)} 
                                className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 text-sm border border-slate-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm transition-all"
                                placeholder="Describe your nail vision... (e.g. Chrome nails in a luxury salon)"
                                onKeyDown={e => e.key === 'Enter' && handleGenerateFresh()}
                              />
                              <button 
                                onClick={handleGenerateFresh} 
                                disabled={!nanoPrompt || isGeneratingNano}
                                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                type="button"
                              >
                                {isGeneratingNano ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                              </button>
                          </div>
                      </div>

                      {/* History & Bench Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generation History</p>
                              <div className="grid grid-cols-3 gap-3">
                                  {imagesWithMetadata.map((img) => (
                                      <div 
                                        key={img.id} 
                                        onClick={() => { setFocusImage(img); setRefinementPrompt(""); setDeepAnalysis(null); }}
                                        className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${focusImage?.id === img.id ? 'border-pink-600 ring-4 ring-pink-50 shadow-xl' : 'border-transparent hover:border-slate-300 shadow-sm'}`}
                                      >
                                          {img.isAnimate ? (
                                              <video src={img.url} className="w-full h-full object-cover" />
                                          ) : (
                                              <img src={img.url} className="w-full h-full object-cover" alt="History item" />
                                          )}
                                          {focusImage?.id === img.id && (
                                              <div className="absolute inset-0 bg-pink-600/10 flex items-center justify-center">
                                                  <Check className="text-white bg-pink-600 rounded-full p-1 shadow-lg" size={24}/>
                                              </div>
                                          )}
                                      </div>
                                  ))}
                                  {imagesWithMetadata.length === 0 && (
                                      <div className="col-span-3 aspect-video border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                                          <ImageIcon size={32} className="mb-2 opacity-20"/>
                                          <p className="text-xs">No visuals generated yet.</p>
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* Focus Workbench */}
                          <div className="flex-1">
                              {focusImage ? (
                                  <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col animate-in zoom-in-95 duration-300">
                                      <div className="p-4 bg-slate-50 dark:bg-gray-900/50 flex justify-between items-center border-b border-slate-100 dark:border-gray-700">
                                          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Sparkles size={14}/> Refinement Bench</span>
                                          <button onClick={() => setFocusImage(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-full" type="button"><X size={16}/></button>
                                      </div>
                                      <div className="aspect-square bg-black relative">
                                          {focusImage.isAnimate ? (
                                              <video src={focusImage.url} controls className="w-full h-full object-cover" />
                                          ) : (
                                              <img src={focusImage.url} className="w-full h-full object-cover" alt="Focus visual" />
                                          )}
                                          <div className="absolute top-4 right-4 flex flex-col gap-2">
                                              <button 
                                                onClick={() => {
                                                  const next = imagesWithMetadata.filter(m => m.id !== focusImage.id);
                                                  setImagesWithMetadata(next);
                                                  updateDraftAssets(next);
                                                  setFocusImage(null);
                                                }} 
                                                className="p-2 bg-red-500 text-white rounded-xl shadow-xl hover:bg-red-600 transition-colors"
                                                title="Delete version"
                                                type="button"
                                              >
                                                  <Trash2 size={18}/>
                                              </button>
                                          </div>
                                      </div>
                                      <div className="p-5 space-y-4">
                                          <div className="flex flex-wrap gap-2">
                                              <button 
                                                onClick={handleAnimateImage}
                                                disabled={isAnimating || focusImage.isAnimate}
                                                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-30 shadow-md transition-all"
                                                type="button"
                                              >
                                                  {isAnimating ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
                                                  Animate with Veo
                                              </button>
                                              <button 
                                                onClick={handleDeepAnalyze}
                                                disabled={isDeepAnalyzing || focusImage.isAnimate}
                                                className="flex-1 py-2.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
                                                type="button"
                                              >
                                                  {isDeepAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <FileSearch size={16} />}
                                                  Deep Analysis (Pro)
                                              </button>
                                          </div>

                                          {deepAnalysis && (
                                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl animate-in fade-in">
                                                  <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed font-medium">{deepAnalysis}</p>
                                              </div>
                                          )}

                                          <div className="flex gap-2">
                                              <button 
                                                onClick={handleUndo} 
                                                disabled={!focusImage.parent_id}
                                                className="flex-1 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                type="button"
                                              >
                                                  <Undo2 size={16} /> Undo Edit
                                              </button>
                                              <button 
                                                onClick={() => handleSaveToLibrary(focusImage)} 
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${saveStatus === focusImage.id ? 'bg-green-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'}`}
                                                type="button"
                                              >
                                                  {saveStatus === focusImage.id ? <Check size={16}/> : <Save size={16}/>}
                                                  {saveStatus === focusImage.id ? 'Saved!' : 'Save Asset'}
                                              </button>
                                          </div>

                                          <div className="h-px bg-slate-100 dark:bg-gray-700 my-2" />

                                          <div>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Refinements (Pro)</p>
                                              <div className="flex flex-wrap gap-2">
                                                  {refinementPresets.map(preset => (
                                                      <button 
                                                        key={preset} 
                                                        onClick={() => handleRefine(preset)}
                                                        disabled={isRefining}
                                                        className="px-3 py-1.5 bg-slate-50 dark:bg-gray-700 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-bold hover:bg-pink-50 hover:text-pink-600 border border-slate-100 dark:border-gray-600 transition-colors"
                                                        type="button"
                                                      >
                                                          {preset}
                                                      </button>
                                                  ))}
                                              </div>
                                          </div>
                                          <div className="flex gap-2">
                                              <input 
                                                className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-600 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-500"
                                                placeholder="Custom edit... (e.g. change to red)"
                                                value={refinementPrompt}
                                                onChange={e => setRefinementPrompt(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleRefine()}
                                              />
                                              <button 
                                                onClick={() => handleRefine()} 
                                                disabled={isRefining || !refinementPrompt}
                                                className="px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-pink-700 disabled:opacity-50 transition-all"
                                                type="button"
                                              >
                                                  {isRefining ? <Loader2 size={14} className="animate-spin"/> : <Palette size={14}/>} Refine
                                              </button>
                                          </div>
                                          <div className="pt-2">
                                              <p className="text-[9px] font-medium text-slate-400 uppercase flex items-center gap-1"><History size={10}/> Applied: {focusImage.prompt.slice(0, 100)}...</p>
                                          </div>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-gray-700 transition-all">
                                      <Sparkles size={32} className="text-slate-300 mb-4"/>
                                      <h4 className="font-bold text-slate-500 mb-2">Workbench Ready</h4>
                                      <p className="text-xs text-slate-400 mb-6 max-w-[200px]">Select a history image or upload your own to start refining, animating, or analyzing.</p>
                                      
                                      <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                          <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer shadow-sm transition-colors">
                                              <Upload size={14}/> Upload Photo
                                              <input type="file" className="hidden" accept="image/*" onChange={handleLocalUpload} />
                                          </label>
                                          <button 
                                              onClick={() => setShowLibrary(true)}
                                              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
                                              type="button"
                                          >
                                              <Library size={14}/> From Library
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Right Preview */}
          <div className="w-full lg:w-[400px] xl:w-[480px] bg-slate-50 dark:bg-gray-900 border-l border-slate-200 dark:border-gray-700 overflow-y-auto shrink-0 flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-[340px] bg-white border-[12px] border-slate-900 rounded-[3.5rem] shadow-2xl overflow-hidden relative aspect-[9/19] flex flex-col transition-all">
                  <div className="h-7 bg-slate-900 w-full absolute top-0 z-20 flex justify-center">
                      <div className="h-4 w-20 bg-black rounded-b-xl"></div>
                  </div>
                  <div className="flex-1 bg-gray-100 relative">
                      {imagesWithMetadata[0] ? (
                          imagesWithMetadata[0].isAnimate ? (
                              <video src={imagesWithMetadata[0].url} autoPlay loop muted className="w-full h-full object-cover" />
                          ) : (
                              <img src={imagesWithMetadata[0].url} className="w-full h-full object-cover" alt="Editor Preview" />
                          )
                      ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                              <span className="text-[10px] font-black uppercase tracking-widest">Preview</span>
                          </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20 text-white">
                          <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center font-bold text-xs shadow-lg">C</div>
                              <span className="font-bold text-sm tracking-tight">crystalclawz</span>
                          </div>
                          <p className="text-sm line-clamp-3 mb-2 font-medium leading-relaxed">{draft.finalContent.copy || draft.finalContent.title || "Crystal Clawz Nails..."}</p>
                          <p className="text-[10px] font-bold text-pink-400">#CrystalClawz #NailsSouthAfrica</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {showCapCutModal && (
          <CapCutHandoffModal 
            draft={draft} 
            isOpen={showCapCutModal} 
            onClose={() => setShowCapCutModal(false)} 
            onSaveToLibrary={() => {}} 
            onAddToCalendar={() => { onNext(); }} 
            onBackToDashboard={() => onNavigate('dashboard')} 
            onUpdateDraft={(updates) => setDraft({...draft, ...updates})} 
          />
      )}

      {showLibrary && (
          <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                  <div className="p-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 dark:text-white">Import from Library</h3>
                      <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-500" type="button"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                      <LibraryModal 
                        onAttach={handleLibrarySelect} 
                      />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default EditorStudio;
