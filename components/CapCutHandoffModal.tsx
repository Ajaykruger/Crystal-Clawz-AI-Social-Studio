
import React, { useState } from 'react';
import { DraftState } from '../types';
import { X, Download, Copy, Check, Calendar as CalendarIcon, LayoutDashboard, Save, Video, Image, FileText, Music, Mic, Scissors, Sparkles, Loader2 } from 'lucide-react';
import { contentEngineService } from '../services/contentEngineService';

interface CapCutHandoffModalProps {
  draft: DraftState;
  isOpen: boolean;
  onClose: () => void;
  onSaveToLibrary: () => void;
  onAddToCalendar: () => void;
  onBackToDashboard: () => void;
  onUpdateDraft?: (updates: Partial<DraftState>) => void;
}

const CapCutHandoffModal: React.FC<CapCutHandoffModalProps> = ({ 
  draft, isOpen, onClose, onSaveToLibrary, onAddToCalendar, onBackToDashboard, onUpdateDraft 
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isGeneratingVeo, setIsGeneratingVeo] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = () => {
    onSaveToLibrary();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Content Derivation
  const hook = draft.finalContent.title || draft.generatedOptions?.[0]?.hook || "No hook generated";
  const caption = draft.finalContent.copy || draft.generatedOptions?.[0]?.body || "";
  const script = draft.finalContent.assets.scripts?.[0] || draft.finalContent.assets.videoPrompts?.[0] || "No specific script generated.";
  
  // Scene Guide Generation - Use script content if available instead of placeholder
  const sceneGuide = draft.finalContent.assets.scripts?.[0] || draft.finalContent.assets.videoPrompts?.[0]
    ? `VISUAL BREAKDOWN (Derived from Script):\n\n${(draft.finalContent.assets.scripts?.[0] || draft.finalContent.assets.videoPrompts?.[0]).split('\n').map(line => `• ${line}`).join('\n')}`
    : `1. Intro: Face to camera or product close-up (0-3s)\n2. Hook: Text overlay "${hook}" (0-3s)\n3. Value/Demo: Show the process/product (3-10s)\n4. CTA: Text overlay "${draft.finalContent.cta || 'Link in Bio'}" (10-15s)`;

  const fullGuide = `
CAPCUT EDITING GUIDE
--------------------
FORMAT: 9:16 (Vertical)
PLATFORM: Reels / TikTok / Shorts
DURATION: 7-15s

HOOK (Text on Screen):
"${hook}"

VOICEOVER / SCRIPT:
${script}

SCENE GUIDE:
${sceneGuide}

MUSIC SUGGESTION:
Upbeat / Trending / Educational (Low volume if speaking)

CAPTION:
${caption}

CTA:
${draft.finalContent.cta || "Check link in bio"}
`;

  const handleGenerateVeo = async () => {
      setIsGeneratingVeo(true);
      try {
          const prompt = `Create a professional vertical 9:16 video for a nail beauty brand. Context: ${hook}. Script/Action: ${script.substring(0, 150)}...`;
          const result = await contentEngineService.generateVideoFromPrompt({
              prompt: prompt,
              model: 'veo-3.1-fast-generate-preview',
              aspectRatio: '9:16',
              durationSeconds: '8'
          });
          
          if (onUpdateDraft && result.dataUrl) {
              const currentVideos = draft.finalContent.assets.videos || [];
              onUpdateDraft({
                  finalContent: {
                      ...draft.finalContent,
                      assets: {
                          ...draft.finalContent.assets,
                          videos: [result.dataUrl, ...currentVideos]
                      }
                  }
              });
          }
      } catch (e) {
          console.error("Veo generation failed", e);
          alert("Failed to generate video. Please try again.");
      } finally {
          setIsGeneratingVeo(false);
      }
  };

  const hasVideo = (draft.finalContent.assets.videos?.length || 0) > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Scissors className="text-pink-500" /> Ready to Edit in CapCut
            </h2>
            <p className="text-slate-400 mt-1">Everything below is prepared — just upload/paste into CapCut.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Downloads & Instructions */}
          <div className="space-y-8">
            
            {/* Downloads Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Download size={18} className="text-pink-600"/> Downloads
              </h3>
              <div className="space-y-3">
                {hasVideo ? (
                    <button 
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-pink-300 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Video size={18}/></div>
                        <div className="text-left">
                          <span className="block text-sm font-bold text-slate-700">Video Assets</span>
                          <span className="block text-xs text-slate-400">Generated Video Available</span>
                        </div>
                      </div>
                      <a href={draft.finalContent.assets.videos[0]} download="generated_video.mp4" className="text-slate-300 hover:text-pink-600">
                          <Download size={16} />
                      </a>
                    </button>
                ) : (
                    <div className="p-4 bg-white border border-slate-200 rounded-lg text-center space-y-2">
                        <div className="text-sm font-medium text-slate-600">No video generated yet.</div>
                        <button 
                            onClick={handleGenerateVeo}
                            disabled={isGeneratingVeo}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-bold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            {isGeneratingVeo ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                            Generate with Veo 3
                        </button>
                    </div>
                )}

                <button 
                  disabled={(draft.finalContent.assets.images?.length || 0) === 0}
                  className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-pink-300 disabled:opacity-50 disabled:hover:border-slate-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 text-purple-600 p-2 rounded-lg"><Image size={18}/></div>
                    <div className="text-left">
                      <span className="block text-sm font-bold text-slate-700">Images / Overlays</span>
                      <span className="block text-xs text-slate-400">{draft.finalContent.assets.images?.length || 0} files available</span>
                    </div>
                  </div>
                  <Download size={16} className="text-slate-300 group-hover:text-pink-600" />
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => downloadTextFile(caption, `caption-${draft.id}.txt`)}
                        className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600"
                    >
                        <FileText size={16}/> Caption
                    </button>
                    <button 
                        onClick={() => downloadTextFile(script, `script-${draft.id}.txt`)}
                        className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600"
                    >
                        <Mic size={16}/> Voiceover
                    </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
                <button 
                    onClick={() => handleCopy(fullGuide, 'all')}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
                >
                    {copiedField === 'all' ? <Check size={20}/> : <Copy size={20}/>}
                    {copiedField === 'all' ? 'Copied Full Guide!' : 'Copy Entire CapCut Guide'}
                </button>
                <p className="text-xs text-center text-slate-400">
                    Paste this directly into your notes app or send to your phone.
                </p>
            </div>

          </div>

          {/* Right Column: Editing Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                <h3 className="font-bold text-slate-900">CapCut Editing Guide</h3>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded font-medium">9:16 Vertical</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Hook Block */}
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Hook (Text on Screen)</label>
                        <button 
                            onClick={() => handleCopy(hook, 'hook')}
                            className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                        >
                            {copiedField === 'hook' ? <Check size={12}/> : <Copy size={12}/>} Copy
                        </button>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-800">
                        {hook}
                    </div>
                </div>

                {/* Voiceover Block */}
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Voiceover / Script</label>
                        <button 
                            onClick={() => handleCopy(script, 'script')}
                            className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                        >
                            {copiedField === 'script' ? <Check size={12}/> : <Copy size={12}/>} Copy
                        </button>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {script}
                    </div>
                </div>

                {/* Scene Guide Block */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Scene Guide</label>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-mono">
                        {sceneGuide}
                    </div>
                </div>

                {/* Music & CTA */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1"><Music size={12}/> Music</label>
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-xs text-slate-600">
                            Upbeat / Educational
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">CTA</label>
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-xs text-slate-600 truncate">
                            {draft.finalContent.cta || "Link in Bio"}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
            <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSaved ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-white hover:shadow-sm'
                }`}
            >
                {isSaved ? <Check size={16}/> : <Save size={16}/>}
                {isSaved ? 'Saved to Library' : 'Save to Library'}
            </button>

            <div className="flex gap-3">
                <button 
                    onClick={onBackToDashboard}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2"
                >
                    <LayoutDashboard size={16}/> Back to Dashboard
                </button>
                <button 
                    onClick={onAddToCalendar}
                    className="px-6 py-2 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 shadow-sm flex items-center gap-2"
                >
                    <CalendarIcon size={16}/> Add to Calendar
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CapCutHandoffModal;
