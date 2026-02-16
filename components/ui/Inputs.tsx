
import React, { useState, useEffect, useRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Mic, Search, X, Loader2, AlertCircle, MicOff } from 'lucide-react';
import { CCTooltip } from './Tooltip';

// --- Voice Input Hook ---
interface VoiceInputOptions {
  onResult: (text: string) => void;
  onError?: (err: string) => void;
}

export const useVoiceInput = ({ onResult, onError }: VoiceInputOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  const recognitionRef = useRef<any>(null);
  const callbacksRef = useRef({ onResult, onError });

  // Update callbacks ref whenever they change so the effect always has the latest version
  useEffect(() => {
      callbacksRef.current = { onResult, onError };
  }, [onResult, onError]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      // Basic Support Check
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      // Secure Context Check (Required for Mic)
      if (!window.isSecureContext) {
        console.warn("Voice input requires a secure context (HTTPS).");
        setIsSupported(false);
        return;
      }

      setIsSupported(true);

      const reco = new SpeechRecognition();
      reco.continuous = false; // Stop after one sentence/phrase
      reco.interimResults = false;
      reco.lang = 'en-ZA'; // Defaulting to South Africa as per app locale
      
      reco.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      reco.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Use the ref to get the latest callback without re-running this effect
        if (callbacksRef.current.onResult) {
            callbacksRef.current.onResult(transcript);
        }
        setIsListening(false);
      };
      
      reco.onerror = (event: any) => {
        console.error("Speech error", event.error);
        let msg = 'Error listening.';
        if (event.error === 'not-allowed') {
            msg = 'Mic permission denied. Check browser settings.';
            setPermissionState('denied');
        } else if (event.error === 'no-speech') {
            msg = 'No speech detected.';
        } else if (event.error === 'network') {
            msg = 'Network error.';
        } else if (event.error === 'aborted') {
            // Ignore manual aborts
            setIsListening(false);
            return;
        }
        
        setError(msg);
        if (callbacksRef.current.onError) {
            callbacksRef.current.onError(msg);
        }
        setIsListening(false);
      };

      reco.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = reco;

      // Cleanup
      return () => {
          if (recognitionRef.current) {
              recognitionRef.current.abort();
          }
      };
    }
  }, []); // Run once on mount

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start recognition", e);
        setError("Could not start microphone.");
        setIsListening(false);
      }
    }
  };

  return { isListening, toggleListening, error, isSupported, permissionState };
};

// --- Helper: Insert at Cursor ---
const insertTextAtCursor = (element: HTMLInputElement | HTMLTextAreaElement, text: string) => {
    if (!element) return;
    
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const currentVal = element.value;
    
    // Insert text (adding a leading space if we are appending and previous char isn't space)
    const prefix = currentVal.substring(0, start);
    const needsSpace = prefix.length > 0 && !prefix.endsWith(' ');
    const textToInsert = (needsSpace ? ' ' : '') + text;
    
    const newVal = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);
    
    // Update value prototype to trigger React's change tracking
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(element),
        "value"
    )?.set;
    
    if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, newVal);
    } else {
        element.value = newVal;
    }

    // Dispatch event
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);

    // Restore focus and move cursor
    element.focus();
    const newCursorPos = start + textToInsert.length;
    element.setSelectionRange(newCursorPos, newCursorPos);
};

// --- Common Styles ---
const BASE_INPUT_CLASSES = "w-full bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500";
const MIC_BUTTON_CLASSES = "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors flex items-center justify-center";

// --- CCTextField ---
interface CCTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  micEnabled?: boolean;
}

export const CCTextField = React.forwardRef<HTMLInputElement, CCTextFieldProps>(
  ({ label, error: propError, className = "", micEnabled = true, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const [voiceError, setVoiceError] = useState<string | null>(null);

    // Merge refs
    useEffect(() => {
        if (!ref) return;
        if (typeof ref === 'function') {
            ref(internalRef.current);
        } else {
            (ref as any).current = internalRef.current;
        }
    }, [ref]);

    const { isListening, toggleListening, isSupported, error: hookError } = useVoiceInput({
        onResult: (text) => {
            if (internalRef.current) {
                insertTextAtCursor(internalRef.current, text);
            }
        },
        onError: (err) => setVoiceError(err)
    });

    // Clear voice error after 3 seconds
    useEffect(() => {
        if (hookError || voiceError) {
            const timer = setTimeout(() => setVoiceError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [hookError, voiceError]);

    const activeError = propError || voiceError;

    return (
      <div className="w-full relative group">
        {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{label}</label>}
        <div className="relative">
          <input
            ref={internalRef}
            className={`${BASE_INPUT_CLASSES} px-4 py-2.5 ${micEnabled && isSupported ? 'pr-10' : ''} ${className}`}
            onChange={onChange}
            {...props}
          />
          {micEnabled && isSupported && (
            <CCTooltip registryKey="global.mic_button">
                <button 
                type="button"
                onClick={toggleListening}
                className={`${MIC_BUTTON_CLASSES} ${
                    isListening 
                    ? 'text-pink-600 bg-pink-100 animate-pulse ring-2 ring-pink-200' 
                    : 'text-slate-400 hover:text-pink-600 hover:bg-slate-50'
                }`}
                title={isListening ? "Stop listening" : "Voice to text"}
                >
                {isListening ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
                </button>
            </CCTooltip>
          )}
          {micEnabled && !isSupported && (
             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" title="Voice input not supported in this browser">
                 <MicOff size={16} />
             </div>
          )}
        </div>
        {activeError && (
            <p className={`mt-1 text-xs flex items-center gap-1 ${voiceError ? 'text-amber-600' : 'text-red-500'}`}>
                <AlertCircle size={12}/> {activeError}
            </p>
        )}
      </div>
    );
  }
);

// --- CCTextArea ---
interface CCTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  micEnabled?: boolean;
}

export const CCTextArea = React.forwardRef<HTMLTextAreaElement, CCTextAreaProps>(
  ({ label, error: propError, className = "", micEnabled = true, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const [voiceError, setVoiceError] = useState<string | null>(null);

    // Merge refs
    useEffect(() => {
        if (!ref) return;
        if (typeof ref === 'function') {
            ref(internalRef.current);
        } else {
            (ref as any).current = internalRef.current;
        }
    }, [ref]);

    const { isListening, toggleListening, isSupported, error: hookError } = useVoiceInput({
        onResult: (text) => {
            if (internalRef.current) {
                insertTextAtCursor(internalRef.current, text);
            }
        },
        onError: (err) => setVoiceError(err)
    });

    useEffect(() => {
        if (hookError || voiceError) {
            const timer = setTimeout(() => setVoiceError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [hookError, voiceError]);

    const activeError = propError || voiceError;

    return (
      <div className="w-full relative group">
        {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{label}</label>}
        <div className="relative">
          <textarea
            ref={internalRef}
            className={`${BASE_INPUT_CLASSES} p-4 ${micEnabled && isSupported ? 'pr-10' : ''} ${className}`}
            onChange={onChange}
            {...props}
          />
          {micEnabled && isSupported && (
            <CCTooltip registryKey="global.mic_button">
                <button 
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 top-3 p-1.5 rounded-full transition-all ${
                    isListening 
                    ? 'text-pink-600 bg-pink-100 animate-pulse ring-2 ring-pink-200' 
                    : 'text-slate-400 hover:text-pink-600 hover:bg-slate-50'
                }`}
                title={isListening ? "Stop listening" : "Voice to text"}
                >
                {isListening ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
                </button>
            </CCTooltip>
          )}
           {micEnabled && !isSupported && (
             <div className="absolute right-3 top-3 text-slate-300" title="Voice input not supported">
                 <MicOff size={16} />
             </div>
          )}
        </div>
        {activeError && (
            <p className={`mt-1 text-xs flex items-center gap-1 ${voiceError ? 'text-amber-600' : 'text-red-500'}`}>
                <AlertCircle size={12}/> {activeError}
            </p>
        )}
      </div>
    );
  }
);

// --- CCSearchField ---
interface CCSearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void;
}

export const CCSearchField = React.forwardRef<HTMLInputElement, CCSearchFieldProps>(
    ({ className = "", onClear, onChange, ...props }, ref) => {
        const internalRef = useRef<HTMLInputElement>(null);
        
        // Merge refs
        useEffect(() => {
            if (!ref) return;
            if (typeof ref === 'function') ref(internalRef.current);
            else (ref as any).current = internalRef.current;
        }, [ref]);

        const { isListening, toggleListening, isSupported } = useVoiceInput({
            onResult: (text) => {
                if (internalRef.current) {
                    insertTextAtCursor(internalRef.current, text);
                }
            }
        });

        return (
            <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    ref={internalRef}
                    type="text"
                    className={`${BASE_INPUT_CLASSES} pl-9 pr-16 py-2 ${className}`}
                    onChange={onChange}
                    {...props}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {props.value && onClear && (
                        <button onClick={onClear} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                            <X size={14} />
                        </button>
                    )}
                    {isSupported && (
                        <CCTooltip registryKey="global.mic_button">
                            <button 
                                onClick={toggleListening}
                                className={`p-1 rounded-full transition-colors ${
                                    isListening 
                                    ? 'text-pink-600 bg-pink-50 animate-pulse' 
                                    : 'text-slate-400 hover:text-pink-600 hover:bg-slate-50'
                                }`}
                                title="Voice Search"
                            >
                                {isListening ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
                            </button>
                        </CCTooltip>
                    )}
                </div>
            </div>
        );
    }
);
