
import React, { useState } from 'react';
import { DraftState, PostOption, Platform } from '../types';
import { RefreshCw, Check, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { generatePostOptions, generateCaptionFromAngle } from '../services/geminiService';

interface OptionsChooserProps {
  draft: DraftState;
  setDraft: (d: DraftState) => void;
  onSelect: () => void;
}

const OptionsChooser: React.FC<OptionsChooserProps> = ({ draft, setDraft, onSelect }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedWhy, setExpandedWhy] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generatingSelectionId, setGeneratingSelectionId] = useState<string | null>(null);

  // Group options by platform
  const groupedOptions = draft.generatedOptions.reduce((acc, option) => {
    const p = option.platform || 'General'; // Fallback if old data
    if (!acc[p]) acc[p] = [];
    acc[p].push(option);
    return acc;
  }, {} as Record<string, PostOption[]>);

  const handleSelect = async (option: PostOption) => {
    // If we are in the video path, the 'body' is currently just a template/brief summary.
    // We want to generate a full caption on selection.
    const isAngleTemplate = draft.creationPath === 'video';

    if (isAngleTemplate) {
        setGeneratingSelectionId(option.id);
        try {
            const generatedCopy = await generateCaptionFromAngle(
                draft.inputs.text || draft.inputs.url || "Nail Tech Product",
                option.angle,
                option.whyThisWorks || option.body,
                option.hook
            );

            setDraft({
              ...draft,
              selectedOptionId: option.id,
              finalContent: {
                ...draft.finalContent,
                title: option.hook,
                copy: generatedCopy,
                cta: option.cta || "Check link in bio",
                selectedAngle: option.angle
              }
            });
        } catch (e) {
            // Fallback to template text
            setDraft({
              ...draft,
              selectedOptionId: option.id,
              finalContent: {
                ...draft.finalContent,
                title: option.hook,
                copy: option.body + "\n\n(Starter draft — click Generate to refine)",
                cta: option.cta,
                selectedAngle: option.angle
              }
            });
        } finally {
            setGeneratingSelectionId(null);
            // We rely on the parent (Workbench) to switch view based on selectedOptionId presence
        }
    } else {
        // Standard Image/Copy path where copy is already generated
        setDraft({
          ...draft,
          selectedOptionId: option.id,
          finalContent: {
            ...draft.finalContent,
            title: option.hook,
            copy: option.body,
            cta: option.cta,
            hashtags: [],
            selectedAngle: option.angle
          }
        });
    }
  };

  const handleRegenerateAll = async () => {
    setIsRegenerating(true);
    try {
       const newOptions = await generatePostOptions(draft);
       setDraft({ ...draft, generatedOptions: newOptions });
       setSelectedId(null);
    } catch(e) {
        console.error(e);
    } finally {
        setIsRegenerating(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose your path</h2>
            <p className="text-slate-500 dark:text-slate-400">Select one option to move forward with.</p>
        </div>
        <button 
           onClick={handleRegenerateAll}
           disabled={isRegenerating || !!generatingSelectionId}
           className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
           <RefreshCw size={16} className={isRegenerating ? "animate-spin" : ""} />
           Regenerate all
        </button>
      </div>

      {Object.entries(groupedOptions).map(([platform, options]) => (
        <div key={platform} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <span className={`w-3 h-8 rounded-full ${
                    platform === Platform.Instagram ? 'bg-pink-500' : 
                    platform === Platform.Facebook ? 'bg-blue-600' :
                    platform === Platform.TikTok ? 'bg-black dark:bg-white' :
                    platform === Platform.YouTube ? 'bg-red-600' :
                    platform === Platform.YouTubeShorts ? 'bg-red-600' : 'bg-slate-400'
                }`}></span>
                {platform} Options
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(options as PostOption[]).map((option) => (
                  <div 
                    key={option.id}
                    onClick={() => setSelectedId(option.id)}
                    className={`relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl transition-all cursor-pointer border-2 ${
                      selectedId === option.id 
                        ? 'border-pink-600 shadow-xl shadow-pink-100 dark:shadow-pink-900/20 scale-[1.02] z-10' 
                        : 'border-transparent shadow-sm hover:border-slate-200 dark:hover:border-gray-700 hover:shadow-md'
                    }`}
                  >
                     {/* Badge */}
                     <div className="absolute top-4 right-4 max-w-[80%] text-right">
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm border ${
                            option.angle === 'Relatable' ? 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-100 dark:border-pink-800' :
                            option.angle === 'Practical Tip' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800' :
                            'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800'
                        }`}>
                            {option.angle}
                        </span>
                     </div>
        
                     <div className="p-6 flex-1 pt-12">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">{option.hook}</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed line-clamp-6 whitespace-pre-line">{option.body}</p>
                        <div className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-4">{option.cta}</div>
                        
                        <div className="flex gap-2 mb-4">
                            {option.imageSuggestion && <span className="text-xs bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-300 px-2 py-1 rounded">Images suggested</span>}
                            {!option.isCompliant && (
                                <span className="flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/30">
                                    <AlertTriangle size={12} /> Needs edit
                                </span>
                            )}
                        </div>
                     </div>
        
                     <div className="px-6 pb-6 mt-auto">
                         {/* Collapsible Why */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedWhy(expandedWhy === option.id ? null : option.id); }}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-4 w-full"
                        >
                            Why this works
                            {expandedWhy === option.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        </button>
                        {expandedWhy === option.id && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-gray-700 p-3 rounded mb-4">{option.whyThisWorks}</p>
                        )}
        
                        {selectedId === option.id ? (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleSelect(option); }}
                                disabled={!!generatingSelectionId}
                                className="w-full bg-pink-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-pink-700 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {generatingSelectionId === option.id ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Generating Draft...
                                    </>
                                ) : (
                                    <>
                                        Use this option <Check size={16} />
                                    </>
                                )}
                            </button>
                        ) : (
                            <button className="w-full bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-600">
                                Select
                            </button>
                        )}
                     </div>
                     
                     {/* Compliance Warning Banner */}
                     {!option.isCompliant && selectedId === option.id && (
                         <div className="bg-amber-50 dark:bg-amber-900/30 px-6 py-2 border-t border-amber-100 dark:border-amber-900/30 rounded-b-xl">
                             <p className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                 <AlertTriangle size={12} />
                                 {option.complianceNote || "Check claims carefully."}
                             </p>
                         </div>
                     )}
                  </div>
                ))}
            </div>
        </div>
      ))}
    </div>
  );
};

export default OptionsChooser;
