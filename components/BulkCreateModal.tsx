
import React, { useState } from 'react';
import { CalendarPost, Platform } from '../types';
import { X, Check, ArrowRight, Loader2, AlertCircle, Wand2, Calendar as CalendarIcon, PlayCircle } from 'lucide-react';
import { simulateBulkCreate } from '../services/bulkCreateService';
import { CCCheckbox } from './ui/Checkbox';

interface BulkCreateModalProps {
  selectedIdeas: CalendarPost[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (generatedPosts: any[]) => void;
}

const BulkCreateModal: React.FC<BulkCreateModalProps> = ({ selectedIdeas, isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  
  // Form State
  const [config, setConfig] = useState({
      scope: 'selected',
      voice_profile: 'default',
      caption_length: 'medium',
      emoji_level: 'medium',
      platform_selection: [] as Platform[], // Empty means use idea's defaults
      media_mode: 'use_existing'
  });

  if (!isOpen) return null;

  const handleRun = async () => {
      setIsProcessing(true);
      try {
          const results = await simulateBulkCreate(selectedIdeas, config, (p, s) => {
              setProgress(p);
              setProgressStage(s);
          });
          onSuccess(results);
          // Wait a bit to show 100%
          await new Promise(r => setTimeout(r, 500));
          onClose(); // In reality, we might show a summary screen first, but for now close and go to review
      } catch (e) {
          console.error(e);
          setIsProcessing(false);
      }
  };

  const steps = [
      { id: 1, title: 'Scope' },
      { id: 2, title: 'Rules' },
      { id: 3, title: 'Platforms' },
      { id: 4, title: 'Media' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Wand2 className="text-pink-600" size={24}/> Bulk Create
                    </h2>
                    <p className="text-sm text-slate-500">Transforming {selectedIdeas.length} ideas into posts</p>
                </div>
                {!isProcessing && <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>}
            </div>

            {/* Progress Bar (if processing) */}
            {isProcessing ? (
                <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 mb-6 relative">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-pink-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{Math.round(progress)}%</h3>
                    <p className="text-slate-500 font-medium animate-pulse">{progressStage}</p>
                    <div className="w-64 h-2 bg-slate-100 rounded-full mt-6 overflow-hidden">
                        <div className="h-full bg-pink-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Steps Indicator */}
                    <div className="px-6 py-4 flex items-center gap-2 border-b border-slate-100 overflow-x-auto">
                        {steps.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <div className={`flex items-center gap-2 ${step === s.id ? 'text-pink-600 font-bold' : step > s.id ? 'text-green-600' : 'text-slate-400'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                                        step === s.id ? 'border-pink-600 bg-pink-50' : 
                                        step > s.id ? 'border-green-600 bg-green-50' : 'border-slate-300'
                                    }`}>
                                        {step > s.id ? <Check size={12}/> : s.id}
                                    </div>
                                    <span className="text-sm whitespace-nowrap">{s.title}</span>
                                </div>
                                {i < steps.length - 1 && <div className="w-8 h-px bg-slate-200" />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="p-8 flex-1 overflow-y-auto">
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-900 mb-4">Choose Scope</h3>
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-4 border-2 border-pink-600 bg-pink-50 rounded-xl cursor-pointer">
                                        <input type="radio" name="scope" className="mt-1" checked readOnly />
                                        <div>
                                            <span className="font-bold text-slate-900 block">Selected Ideas ({selectedIdeas.length})</span>
                                            <span className="text-sm text-slate-600">Only process the items you manually selected.</span>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer opacity-50">
                                        <input type="radio" name="scope" className="mt-1" disabled />
                                        <div>
                                            <span className="font-bold text-slate-900 block">This Week</span>
                                            <span className="text-sm text-slate-600">Process all ideas scheduled for the current week.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                             <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Voice Profile</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                        <option value="default">Crystal Clawz (Default)</option>
                                        <option value="promo">Hype / Promo</option>
                                        <option value="edu">Educational</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Caption Length</label>
                                    <div className="flex gap-2">
                                        {['Short', 'Medium', 'Long'].map(l => (
                                            <button 
                                                key={l}
                                                onClick={() => setConfig({...config, caption_length: l.toLowerCase()})}
                                                className={`flex-1 py-2 border rounded-lg text-sm font-medium ${
                                                    config.caption_length === l.toLowerCase() 
                                                    ? 'bg-pink-600 text-white border-pink-600' 
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Risk Mode</label>
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 items-start">
                                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                                        <p className="text-xs text-amber-800">
                                            <strong>Balanced:</strong> Will avoid specific medical claims but keep energy high.
                                        </p>
                                    </div>
                                </div>
                             </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Target Platforms</label>
                                    <p className="text-sm text-slate-500 mb-4">Select which platforms to generate for. If none selected, we use the specific targets on each idea.</p>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.values(Platform).map(p => {
                                            const isSelected = config.platform_selection.includes(p);
                                            return (
                                                <button 
                                                    key={p}
                                                    onClick={() => {
                                                        const next = isSelected 
                                                            ? config.platform_selection.filter(x => x !== p)
                                                            : [...config.platform_selection, p];
                                                        setConfig({...config, platform_selection: next});
                                                    }}
                                                    className={`p-3 rounded-lg border text-sm font-medium flex items-center gap-2 ${
                                                        isSelected
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>
                                                        {isSelected && <Check size={10} className="text-white" />}
                                                    </div>
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Media Handling</label>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'use_existing', label: 'Use existing / Attach if found', desc: 'Will search Library for matches' },
                                            { id: 'suggest_only', label: 'Suggest only', desc: 'Do not attach files, just text suggestions' },
                                            { id: 'shot_list', label: 'Generate Shot Lists', desc: 'Create instructions for content creation' }
                                        ].map(m => (
                                            <label key={m.id} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer ${config.media_mode === m.id ? 'border-pink-500 bg-pink-50' : 'border-slate-200'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="media_mode" 
                                                    className="mt-1"
                                                    checked={config.media_mode === m.id}
                                                    onChange={() => setConfig({...config, media_mode: m.id})}
                                                />
                                                <div>
                                                    <span className="font-bold text-slate-900 block text-sm">{m.label}</span>
                                                    <span className="text-xs text-slate-500">{m.desc}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
                                    <CCCheckbox checked={true} readOnly label="Send all generated posts to Review Queue (No auto-post)" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between">
                        {step > 1 ? (
                            <button 
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100"
                            >
                                Back
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {step < 4 ? (
                            <button 
                                onClick={() => setStep(step + 1)}
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2"
                            >
                                Next Step <ArrowRight size={16}/>
                            </button>
                        ) : (
                            <button 
                                onClick={handleRun}
                                className="px-8 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold hover:bg-pink-700 shadow-lg shadow-pink-200 flex items-center gap-2"
                            >
                                <PlayCircle size={18}/> Start Bulk Create
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    </div>
  );
};

export default BulkCreateModal;
