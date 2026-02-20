import React, { useState, useEffect } from 'react';
import { DraftState, Platform, PostFormat, Goal, MediaAsset, PostOption } from '../types';
import { generatePostOptions, scrapeImagesFromUrl, analyzeMediaAsset, animateImageWithVeo, analyzeImageDeep } from '../services/geminiService';
import { contentEngineService } from '../services/contentEngineService';
import { Link, Image, Mic, AlertCircle, Loader2, Upload, Paperclip, FileText, ChevronDown, ChevronUp, Video, Wand2, X, Plus, Instagram, Facebook, Youtube, Sparkles, Film, FileSearch } from 'lucide-react';
import { CCTextArea, useVoiceInput } from '../components/ui/Inputs';
import { CCTooltip } from '../components/ui/Tooltip';
import Library from './Library';

interface CreateProps {
  draft: DraftState;
  setDraft: (d: DraftState) => void;
  onSuccess: () => void;
}

type CreateStep = 'select' | 'input';

const Create: React.FC<CreateProps> = ({ draft, setDraft, onSuccess }) => {
  const [step, setStep] = useState<CreateStep>('select');
  const [path, setPath] = useState<'video' | 'image' | 'copy' | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  
  // Library Modal State
  const [showLibrary, setShowLibrary] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);

  // Initialize draft with DRAFT status automatically on any change
  useEffect(() => {
      if (draft.status !== 'DRAFT') {
          setDraft({...draft, status: 'DRAFT'});
      }
  }, [draft.inputs.text]);

  // Auto-switch to input step if draft already has a path (e.g. from nav params)
  useEffect(() => {
      if (draft.creationPath && step === 'select') {
          setPath(draft.creationPath);
          setStep('input');
      }
  }, [draft.creationPath]);

  const handleInputChange = (value: string) => {
    const isUrl = value.trim().startsWith('http');
    setDraft({
      ...draft,
      inputs: { 
          ...draft.inputs, 
          text: value,
          url: isUrl ? value : '' 
      }
    });
  };

  const handleSelectPath = (selectedPath: 'video' | 'image' | 'copy') => {
      setPath(selectedPath);
      setStep('input');
      
      let format = PostFormat.FeedPost;
      if (selectedPath === 'video') format = PostFormat.Reel;
      if (selectedPath === 'copy') format = PostFormat.Text;
      
      setDraft({
          ...draft,
          creationPath: selectedPath,
          settings: { ...draft.settings, format }
      });
  };

  const handleLibrarySelect = (asset: MediaAsset) => {
      setDraft({
          ...draft,
          inputs: {
              ...draft.inputs,
              scrapedImages: asset.fileType === 'image' ? [asset.url] : [],
              files: []
          },
          finalContent: {
              ...draft.finalContent,
              assets: {
                  ...draft.finalContent.assets,
                  images: asset.fileType === 'image' ? [asset.url] : [],
              }
          }
      });
      setShowLibrary(false);
      setPendingUploadFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          setPendingUploadFile(file);
          setShowLibrary(true);
      }
  };

  const handleDirectAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files);
          setDraft({
              ...draft,
              inputs: { ...draft.inputs, files: [...(draft.inputs.files || []), ...newFiles] }
          });
      }
  };

  const handleAnalyzeReference = async () => {
      const file = draft.inputs.files?.[0];
      if (!file) return;

      setIsAnalyzingRef(true);
      setStatusMessage("Analyzing image with Pro AI...");
      
      try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              // Use gemini-3-pro-preview for deep analysis
              const result = await analyzeImageDeep(base64, file.type);
              
              if (result) {
                  const newText = (draft.inputs.text ? draft.inputs.text + "\n\n" : "") + `AI Insight: ${result}`;
                  handleInputChange(newText);
              }
              setIsAnalyzingRef(false);
              setStatusMessage("");
          };
      } catch (e) {
          console.error(e);
          setIsAnalyzingRef(false);
      }
  };

  const handleAnimateAttached = async () => {
      const file = draft.inputs.files?.[0];
      if (!file) return;
      setIsAnimating(true);
      setStatusMessage("Animating with Veo...");
      try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              const videoUrl = await animateImageWithVeo(base64, draft.inputs.text);
              const currentVideos = draft.finalContent.assets.videos || [];
              setDraft({
                  ...draft,
                  finalContent: {
                      ...draft.finalContent,
                      assets: { ...draft.finalContent.assets, videos: [videoUrl, ...currentVideos] }
                  }
              });
              setIsAnimating(false);
              setStatusMessage("");
              alert("Image animated! Check workbench for the video.");
          };
      } catch (e) {
          console.error(e);
          setIsAnimating(false);
          setError("Failed to animate. Veo requires a paid API key.");
      }
  };

  const { isListening, toggleListening, isSupported } = useVoiceInput({
      onResult: (text) => {
          const currentText = draft.inputs.text;
          const needsSpace = currentText.length > 0 && !currentText.endsWith(' ');
          const newText = currentText + (needsSpace ? ' ' : '') + text;
          handleInputChange(newText);
      },
      onError: (err) => setError(err)
  });

  const handleGenerate = async () => {
    if (!draft.inputs.text && !draft.inputs.url && (draft.inputs.files?.length || 0) === 0 && (draft.finalContent.assets.images?.length || 0) === 0) {
        setError("Please enter a topic, brief, or upload a file.");
        return;
    }
    
    setError(null);
    setIsGenerating(true);
    
    try {
        if (path === 'video') {
            setStatusMessage("Building deep strategy...");
            const brief = await contentEngineService.extractBrief(draft.inputs.text);
            const angles = await contentEngineService.generateAngles(brief);
            
            const options: PostOption[] = angles.map(angle => ({
                id: angle.id,
                platform: draft.settings.platforms[0] || Platform.Instagram,
                angle: angle.name,
                hook: angle.hook,
                body: `${angle.objective}\n\nTarget: ${brief.whoItsFor}`,
                cta: "Watch for more",
                isCompliant: true,
                whyThisWorks: angle.objective
            }));
            
            setDraft({ ...draft, generatedOptions: options });
            onSuccess();
        } else {
            setStatusMessage("Designing with Pro Image AI...");
            let scrapedImgs: string[] = draft.inputs.scrapedImages || [];
            if (draft.inputs.url && scrapedImgs.length === 0) {
                try {
                    const scraped = await scrapeImagesFromUrl(draft.inputs.url);
                    scrapedImgs = [...scrapedImgs, ...scraped];
                } catch(e) { console.warn("Scraping failed", e); }
            }

            const options = await generatePostOptions(draft);
            setDraft({ 
                ...draft, 
                generatedOptions: options,
                inputs: { ...draft.inputs, scrapedImages: scrapedImgs }
            });
            onSuccess();
        }
    } catch (e: any) {
        setError(e.message || "Generation failed.");
    } finally {
        setIsGenerating(false);
        setStatusMessage("");
    }
  };

  const renderSelectionView = () => (
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">What are we creating today?</h1>
              <p className="text-slate-500 dark:text-slate-400">Choose a path and harness Gemini intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={() => handleSelectPath('video')}
                className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-slate-100 dark:border-gray-700 hover:border-pink-500 hover:shadow-2xl transition-all text-center space-y-4 overflow-hidden"
              >
                  <div className="w-20 h-20 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                      <Video size={40} />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white text-shadow-sm">Video Project (Veo)</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Reels & TikToks. Animate static shots instantly.</p>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </button>

              <button 
                onClick={() => handleSelectPath('image')}
                className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-slate-100 dark:border-gray-700 hover:border-purple-500 hover:shadow-2xl transition-all text-center space-y-4 overflow-hidden"
              >
                  <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                      <Image size={40} />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white text-shadow-sm">Image Post (Pro)</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Carousels & Feed. Specify your aspect ratios.</p>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </button>

              <button 
                onClick={() => handleSelectPath('copy')}
                className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-slate-100 dark:border-gray-700 hover:border-blue-500 hover:shadow-2xl transition-all text-center space-y-4 overflow-hidden"
              >
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <FileText size={40} />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white text-shadow-sm">Copy Only (Flash)</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Captions & Hooks. Low-latency results.</p>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </button>
          </div>

          <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center gap-4 text-sm text-slate-400 font-medium uppercase tracking-widest">
                  <div className="h-px bg-slate-200 dark:bg-gray-700 w-12" />
                  <span>Or use studio context</span>
                  <div className="h-px bg-slate-200 dark:bg-gray-700 w-12" />
              </div>
              <div className="flex gap-4">
                  <button 
                    onClick={() => { setPendingUploadFile(null); setShowLibrary(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 transition-colors shadow-sm"
                  >
                      <Wand2 size={18} /> Library Pick
                  </button>
                  <label className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                      <Upload size={18} /> Upload Photo
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-gray-900 p-6 relative transition-colors duration-300">
        {step === 'select' ? renderSelectionView() : (
            <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300">
                <button onClick={() => setStep('select')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium">
                    <ChevronDown size={20} className="rotate-90" /> Change Path
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
                    <div className={`p-6 border-b border-slate-100 dark:border-gray-700 ${path === 'video' ? 'bg-pink-50/50' : path === 'image' ? 'bg-purple-50/50' : 'bg-blue-50/50'}`}>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {path === 'video' && <Video size={24} className="text-pink-600" />}
                            {path === 'image' && <Image size={24} className="text-purple-600" />}
                            {path === 'copy' && <FileText size={24} className="text-blue-600" />}
                            {path === 'video' ? 'New Veo Project' : path === 'image' ? 'Pro Image Draft' : 'Fast Copy Session'}
                        </h2>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="relative">
                            <CCTextArea 
                                className="h-48 text-lg"
                                placeholder="What's the vision?"
                                value={draft.inputs.text}
                                onChange={(e) => handleInputChange(e.target.value)}
                            />
                            
                            <div className="absolute bottom-4 left-4 flex gap-2">
                                <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-slate-300 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm z-10">
                                    <Upload size={16} />
                                    <span>Attach Image</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleDirectAttach} />
                                </label>
                                {(draft.inputs.files?.length || 0) > 0 && (
                                    <>
                                        <button
                                            type="button" 
                                            onClick={handleAnimateAttached}
                                            disabled={isAnimating}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm z-10 border bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                        >
                                            {isAnimating ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
                                            <span>Animate (Veo)</span>
                                        </button>
                                        <button
                                            type="button" 
                                            onClick={handleAnalyzeReference}
                                            disabled={isAnalyzingRef}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm z-10 border bg-blue-50 border-blue-200 text-blue-700"
                                        >
                                            {isAnalyzingRef ? <Loader2 size={16} className="animate-spin" /> : <FileSearch size={16} />}
                                            <span>Deep Analysis</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`w-full py-4 rounded-xl text-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isGenerating ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                            {isGenerating ? <><Loader2 className="animate-spin" /> {statusMessage || "Processing..."}</> : <><Wand2 size={20} /> Generate with Gemini Pro</>}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {showLibrary && (
            <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold">Pick from Library</h3>
                        <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <Library onAttach={handleLibrarySelect} pendingFile={pendingUploadFile} />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Create;
