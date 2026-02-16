
import React, { useState } from 'react';
import { DraftState, ViewState, Platform, PostFormat } from '../types';
import { 
  ArrowLeft, Save, Video, Image as ImageIcon, Type, 
  MonitorPlay, Smartphone, Download, Share2, 
  Maximize2, Scissors, Check, X, RefreshCw, LayoutTemplate, Zap, Wand2, Loader2
} from 'lucide-react';
import { CCTextArea, CCTextField } from '../components/ui/Inputs';
import CapCutHandoffModal from '../components/CapCutHandoffModal';
import { generateImageForPost, generatePromptFromContext } from '../services/geminiService';

interface EditorStudioProps {
  draft: DraftState;
  setDraft: (d: DraftState) => void;
  onNext: () => void;
  onNavigate: (view: ViewState, params?: any) => void;
}

const EditorStudio: React.FC<EditorStudioProps> = ({ draft, setDraft, onNext, onNavigate }) => {
  const [showCapCutModal, setShowCapCutModal] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [nanoPrompt, setNanoPrompt] = useState("");
  const [isGeneratingNano, setIsGeneratingNano] = useState(false);
  const [isMagicPrompting, setIsMagicPrompting] = useState(false);

  // Helper to update final content
  const updateContent = (updates: Partial<typeof draft.finalContent>) => {
      setDraft({
          ...draft,
          finalContent: { ...draft.finalContent, ...updates }
      });
  };

  const handleRegenerateImage = async () => {
      if (!draft.finalContent.imagePrompt) return;
      setIsRegeneratingImage(true);
      try {
          // Default to Pro for the main regenerate button
          const newUrl = await generateImageForPost(draft.finalContent.imagePrompt, 'gemini-3-pro-image-preview');
          if (newUrl) {
              updateContent({
                  assets: {
                      ...draft.finalContent.assets,
                      images: [newUrl, ...(draft.finalContent.assets.images || [])]
                  }
              });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsRegeneratingImage(false);
      }
  };

  const handleGenerateNano = async () => {
      if (!nanoPrompt) return;
      setIsGeneratingNano(true);
      try {
          const newUrl = await generateImageForPost(nanoPrompt, 'gemini-2.5-flash-image');
          if (newUrl) {
              updateContent({
                  assets: {
                      ...draft.finalContent.assets,
                      images: [newUrl, ...(draft.finalContent.assets.images || [])]
                  }
              });
              setNanoPrompt(""); // Clear after success
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingNano(false);
      }
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

  const isVideoFormat = draft.settings.format === PostFormat.Reel || draft.settings.format === PostFormat.Video;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* Header */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
              <button 
                onClick={() => setDraft({ ...draft, selectedOptionId: undefined })}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-500 dark:text-slate-400"
              >
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Editor Studio
                      {isVideoFormat && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded border border-pink-200 uppercase">Video Mode</span>}
                  </h2>
              </div>
          </div>
          
          <div className="flex items-center gap-3">
              {isVideoFormat && (
                  <button 
                    onClick={() => setShowCapCutModal(true)}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-gray-200 flex items-center gap-2"
                  >
                      <Scissors size={16} /> Export to CapCut
                  </button>
              )}
              <button 
                onClick={onNext}
                className="px-6 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold hover:bg-pink-700 shadow-lg shadow-pink-200 dark:shadow-none flex items-center gap-2"
              >
                  <Save size={16} /> Save Draft
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Panel: Inputs */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 border-r border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              
              {/* Copy Section */}
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Type size={18} className="text-blue-500"/> Content
                      </h3>
                  </div>
                  
                  <CCTextField 
                      label="Hook / Title"
                      value={draft.finalContent.title}
                      onChange={(e) => updateContent({ title: e.target.value })}
                  />

                  <CCTextArea 
                      label="Caption Body"
                      className="min-h-[200px]"
                      value={draft.finalContent.copy}
                      onChange={(e) => updateContent({ copy: e.target.value })}
                  />

                  <CCTextField 
                      label="Call to Action (CTA)"
                      value={draft.finalContent.cta}
                      onChange={(e) => updateContent({ cta: e.target.value })}
                  />
              </div>

              {/* Media Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {isVideoFormat ? <Video size={18} className="text-pink-500"/> : <ImageIcon size={18} className="text-purple-500"/>} 
                          {isVideoFormat ? 'Video Assets' : 'Visuals'}
                      </h3>
                      {!isVideoFormat && (
                          <button 
                            onClick={handleRegenerateImage}
                            disabled={isRegeneratingImage}
                            className="text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                              <RefreshCw size={12} className={isRegeneratingImage ? 'animate-spin' : ''}/> Regenerate (Pro)
                          </button>
                      )}
                  </div>

                  {/* Nano Banana Section */}
                  {!isVideoFormat && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                          <h4 className="text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase mb-2 flex items-center gap-2">
                              <Zap size={14} className="fill-yellow-500"/> Nano Banana Creator (Fast)
                          </h4>
                          <div className="flex flex-col gap-3">
                              <div className="relative">
                                  <textarea 
                                      value={nanoPrompt}
                                      onChange={e => setNanoPrompt(e.target.value)}
                                      className="w-full h-24 p-3 pr-10 text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-slate-400 resize-none"
                                      placeholder="Describe the image you want..."
                                  />
                                  <button 
                                      onClick={handleMagicPrompt}
                                      disabled={isMagicPrompting}
                                      className="absolute right-2 bottom-2 p-1.5 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors shadow-sm border border-slate-100 dark:border-gray-600"
                                      title="AI Assist: Generate prompt from caption"
                                  >
                                      {isMagicPrompting ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                                  </button>
                              </div>
                              <button 
                                  onClick={handleGenerateNano}
                                  disabled={!nanoPrompt || isGeneratingNano}
                                  className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                              >
                                  {isGeneratingNano ? <RefreshCw size={14} className="animate-spin"/> : <Zap size={14}/>}
                                  Generate Image
                              </button>
                          </div>
                      </div>
                  )}

                  {draft.finalContent.assets.images && draft.finalContent.assets.images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {draft.finalContent.assets.images.map((url, idx) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600">
                                  <img src={url} className="w-full h-full object-cover" />
                                  <button 
                                    className="absolute top-2 right-2 p-1.5 bg-white/80 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                    onClick={() => {
                                        const newImages = draft.finalContent.assets.images.filter((_, i) => i !== idx);
                                        updateContent({ assets: { ...draft.finalContent.assets, images: newImages } });
                                    }}
                                  >
                                      <X size={14} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="p-8 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon size={32} className="mb-2 opacity-50"/>
                          <p className="text-sm">No images generated.</p>
                      </div>
                  )}
                  
                  {draft.finalContent.imagePrompt && (
                      <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-bold block mb-1">Visual Prompt:</span>
                          {draft.finalContent.imagePrompt}
                      </div>
                  )}
              </div>

          </div>

          {/* Right Panel: Preview */}
          <div className="w-full lg:w-[400px] xl:w-[480px] bg-slate-50 dark:bg-gray-900 border-l border-slate-200 dark:border-gray-700 overflow-y-auto shrink-0 flex flex-col">
                <div className="m-auto p-8 flex flex-col items-center">
                    <div className="w-full max-w-[340px] bg-white border-8 border-slate-900 rounded-[3rem] shadow-2xl overflow-hidden relative aspect-[9/19] flex flex-col shrink-0">
                        {/* Mock Phone UI */}
                        <div className="h-6 bg-slate-900 w-full absolute top-0 z-20 flex justify-center">
                            <div className="h-4 w-20 bg-black rounded-b-xl"></div>
                        </div>
                        
                        <div className="flex-1 bg-gray-100 relative">
                            {/* Media Display */}
                            {draft.finalContent.assets.images?.[0] ? (
                                <img src={draft.finalContent.assets.images[0]} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                    <span className="text-xs font-bold uppercase tracking-widest">Preview</span>
                                </div>
                            )}
                            
                            {/* Content Overlay */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16 text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center font-bold text-xs">C</div>
                                    <span className="font-bold text-sm">crystalclawz</span>
                                </div>
                                <p className="text-sm line-clamp-3 mb-2">
                                    {draft.finalContent.copy || draft.finalContent.title || "Your caption here..."}
                                </p>
                                <p className="text-xs opacity-70">
                                    {draft.finalContent.hashtags?.join(' ') || "#CrystalClawz #Nails"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Smartphone size={14}/> Mobile Preview
                    </p>
                </div>
          </div>

      </div>

      {showCapCutModal && (
          <CapCutHandoffModal 
            draft={draft}
            isOpen={showCapCutModal}
            onClose={() => setShowCapCutModal(false)}
            onSaveToLibrary={() => { /* Assume draft auto-saved, show toast */ }}
            onAddToCalendar={() => { onNext(); }} // Flow: Review then Schedule
            onBackToDashboard={() => onNavigate('dashboard')}
            onUpdateDraft={(updates) => setDraft({ ...draft, ...updates })}
          />
      )}
    </div>
  );
};

export default EditorStudio;
