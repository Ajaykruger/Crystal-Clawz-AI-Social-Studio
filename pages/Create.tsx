
import React, { useState, useEffect } from 'react';
import { DraftState, Platform, PostFormat, Goal, MediaAsset, PostOption } from '../types';
import { generatePostOptions, scrapeImagesFromUrl, analyzeMediaAsset } from '../services/geminiService';
import { contentEngineService } from '../services/contentEngineService';
import { Link, Image, Mic, AlertCircle, Loader2, Upload, Paperclip, FileText, ChevronDown, ChevronUp, Video, Wand2, X, Plus, Instagram, Facebook, Youtube, Sparkles } from 'lucide-react';
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
      
      // Configure draft based on path
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
              files: [] // Clear raw files if library used
          },
          finalContent: {
              ...draft.finalContent,
              assets: {
                  ...draft.finalContent.assets,
                  images: asset.fileType === 'image' ? [asset.url] : [],
                  // We could handle video assets here too
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
      // Logic for the small toolbar inside the editor (doesn't use Library flow for speed)
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
      setStatusMessage("Analyzing reference media...");
      
      try {
          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              // We reuse analyzeMediaAsset but just take the promptSuggestion
              const result = await analyzeMediaAsset(base64, file.type, []);
              
              if (result.promptSuggestion) {
                  // Append logic to input text
                  const newText = (draft.inputs.text ? draft.inputs.text + "\n\n" : "") + `Visual Reference Style: ${result.promptSuggestion}`;
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
            setStatusMessage("Building brief and angles...");
            // Use Engine Service logic
            const brief = await contentEngineService.extractBrief(draft.inputs.text);
            const angles = await contentEngineService.generateAngles(brief);
            
            // Map angles to PostOptions for Workbench
            const options: PostOption[] = angles.map(angle => ({
                id: angle.id,
                platform: draft.settings.platforms[0] || Platform.Instagram, // Default
                angle: angle.name,
                hook: angle.hook,
                body: `${angle.objective}\n\nTarget: ${brief.whoItsFor}`,
                cta: "Watch for more",
                imageSuggestion: "",
                videoSuggestion: "See generated blueprint",
                isCompliant: true,
                whyThisWorks: angle.objective
            }));
            
            setDraft({ ...draft, generatedOptions: options });
            onSuccess();

        } else {
            // Image or Copy Paths - Use standard generation but maybe with specific prompting context
            setStatusMessage(path === 'copy' ? "Drafting copy variants..." : "Designing posts...");
            
            // If URL provided, try scraping
            let scrapedImgs: string[] = draft.inputs.scrapedImages || [];
            if (draft.inputs.url && scrapedImgs.length === 0) {
                setStatusMessage("Scanning URL...");
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
              <p className="text-slate-500 dark:text-slate-400">Choose a format to start your creation journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={() => handleSelectPath('video')}
                className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-slate-100 dark:border-gray-700 hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-100/10 transition-all text-center space-y-4 overflow-hidden"
              >
                  <div className="w-20 h-20 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                      <Video size={40} />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create a Video (Veo)</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Reels, TikToks, Shorts. Start with a brief.</p>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </button>

              <button 
                onClick={() => handleSelectPath('image')}
                className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-slate-100 dark:border-gray-700 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-100/10 transition-all text-center space-y-4 overflow-hidden"
              >
                  <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                      <Image size={40} />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create an Image Post</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Carousels, Static Posts. Visual-first.</p>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </button>

              <button 
                onClick={() => handleSelectPath('copy')}
                className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-slate-100 dark:border-gray-700 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-100/10 transition-all text-center space-y-4 overflow-hidden"
              >
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <FileText size={40} />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Copy Only</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Captions, Hooks, Ideas. Text-focused.</p>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </button>
          </div>

          <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center gap-4 text-sm text-slate-400 font-medium uppercase tracking-widest">
                  <div className="h-px bg-slate-200 dark:bg-gray-700 w-12" />
                  <span>Or start from existing</span>
                  <div className="h-px bg-slate-200 dark:bg-gray-700 w-12" />
              </div>
              
              <div className="flex gap-4">
                  <button 
                    onClick={() => { setPendingUploadFile(null); setShowLibrary(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                  >
                      <Wand2 size={18} /> Pick from Library
                  </button>
                  <label className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors shadow-sm cursor-pointer">
                      <Upload size={18} /> Upload File
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
              </div>

              {/* Asset Preview Indicator */}
              {((draft.inputs.files?.length || 0) > 0 || (draft.finalContent.assets.images?.length || 0) > 0) && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg border border-green-100 dark:border-green-900 animate-in slide-in-from-bottom-2">
                      <Paperclip size={14} /> 
                      <span className="text-sm font-medium">
                          {(draft.inputs.files?.length || 0) + (draft.finalContent.assets.images?.length || 0)} assets ready
                      </span>
                  </div>
              )}
          </div>
      </div>
  );

  const availablePlatforms = [Platform.Instagram, Platform.TikTok, Platform.Facebook, Platform.YouTubeShorts];

  const getPlatformIcon = (p: Platform) => {
      switch(p) {
          case Platform.Instagram: return <Instagram size={16} />;
          case Platform.Facebook: return <Facebook size={16} />;
          case Platform.YouTubeShorts: return <Youtube size={16} />;
          case Platform.TikTok: return <span className="font-bold text-[10px]">Tk</span>;
          default: return <Video size={16} />;
      }
  };

  const renderInputView = () => (
      <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <button 
            onClick={() => setStep('select')}
            className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium"
          >
              <ChevronDown size={20} className="rotate-90" /> Back to options
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
              <div className={`p-6 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center ${
                  path === 'video' ? 'bg-pink-50 dark:bg-pink-900/20' : path === 'image' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
              }`}>
                  <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {path === 'video' && <Video size={24} className="text-pink-600 dark:text-pink-400" />}
                          {path === 'image' && <Image size={24} className="text-purple-600 dark:text-purple-400" />}
                          {path === 'copy' && <FileText size={24} className="text-blue-600 dark:text-blue-400" />}
                          {path === 'video' ? 'New Video Project' : path === 'image' ? 'New Image Post' : 'New Copy Draft'}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {path === 'video' ? 'Tell us about the product or topic for your video.' :
                           path === 'image' ? 'Describe the image concept you want to create.' :
                           'What is the topic of your caption?'}
                      </p>
                  </div>
              </div>

              <div className="p-8 space-y-6">
                  {/* Platform Selector */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Platform</label>
                      <div className="flex gap-2 flex-wrap">
                          {availablePlatforms.map(p => {
                              const isSelected = draft.settings.platforms.includes(p);
                              return (
                                  <button
                                      key={p}
                                      onClick={() => setDraft({ ...draft, settings: { ...draft.settings, platforms: [p] } })}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                                          isSelected
                                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                                          : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700'
                                      }`}
                                  >
                                      {getPlatformIcon(p)} {p}
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  <div className="relative">
                      <CCTextArea 
                          className="h-64 text-lg"
                          placeholder={
                              path === 'video' ? "Describe the product, key benefits, and who it's for..." :
                              path === 'image' ? "Describe the scene, mood, and subject..." :
                              "Write a topic, paste a URL, or just braindump..."
                          }
                          value={draft.inputs.text}
                          onChange={(e) => handleInputChange(e.target.value)}
                          micEnabled={false} // We use custom toolbar
                      />
                      
                      {/* Integrated Toolbar */}
                      <div className="absolute bottom-4 left-4 flex gap-2">
                          <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-600 hover:text-pink-600 dark:hover:text-pink-400 transition-colors shadow-sm z-10">
                              <Upload size={16} />
                              <span>Attach</span>
                              <input type="file" className="hidden" multiple accept="image/*,video/*,application/pdf" onChange={handleDirectAttach} />
                          </label>
                          {isSupported && (
                              <button
                                  type="button" 
                                  onClick={toggleListening}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm z-10 border ${
                                      isListening 
                                      ? 'bg-pink-100 text-pink-700 border-pink-200 animate-pulse' 
                                      : 'bg-white dark:bg-gray-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-600 hover:text-pink-600'
                                  }`}
                              >
                                  {isListening ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
                                  <span>Voice</span>
                              </button>
                          )}
                          
                          {/* AI Analysis Button for References */}
                          {(draft.inputs.files?.length || 0) > 0 && (
                              <button
                                  type="button" 
                                  onClick={handleAnalyzeReference}
                                  disabled={isAnalyzingRef}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm z-10 border bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100`}
                              >
                                  {isAnalyzingRef ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                  <span>Analyze for Prompt</span>
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Asset Previews */}
                  {((draft.inputs.files?.length || 0) > 0 || (draft.finalContent.assets.images?.length || 0) > 0) && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                          {draft.inputs.files?.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-gray-600 whitespace-nowrap">
                                  <Paperclip size={12} /> {f.name}
                              </div>
                          ))}
                          {draft.finalContent.assets.images?.map((url, i) => (
                              <div key={`img-${i}`} className="w-10 h-10 rounded border border-slate-200 dark:border-gray-600 overflow-hidden relative">
                                  <img src={url} className="w-full h-full object-cover" />
                              </div>
                          ))}
                      </div>
                  )}

                  {error && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm border border-red-100 dark:border-red-900/30">
                          <AlertCircle size={16} /> {error}
                      </div>
                  )}

                  <button 
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className={`w-full py-4 rounded-xl text-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                          isGenerating 
                          ? 'bg-slate-100 dark:bg-gray-700 text-slate-400 cursor-not-allowed shadow-none' 
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-gray-100 hover:scale-[1.01]'
                      }`}
                  >
                      {isGenerating ? (
                          <>
                              <Loader2 className="animate-spin" />
                              {statusMessage || "Processing..."}
                          </>
                      ) : (
                          <>
                              <Wand2 size={20} />
                              {path === 'video' ? 'Generate Brief & Angles' : path === 'copy' ? 'Generate Copy Options' : 'Generate Concepts'}
                          </>
                      )}
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-gray-900 p-6 relative transition-colors duration-300">
        {step === 'select' ? renderSelectionView() : renderInputView()}
        
        {/* Reusing Library Component as Modal */}
        {showLibrary && (
            <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                            {pendingUploadFile ? 'Save to Library' : 'Pick from Library'}
                        </h3>
                        <button onClick={() => { setShowLibrary(false); setPendingUploadFile(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-500"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <Library 
                            onAttach={handleLibrarySelect} 
                            pendingFile={pendingUploadFile}
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Create;
