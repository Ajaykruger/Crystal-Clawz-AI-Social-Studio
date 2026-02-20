import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Send, MessageSquare, Waves, Loader2, StopCircle, Sparkles, AlertCircle, Database } from 'lucide-react';
import { createChatSession, connectLiveSession } from '../services/geminiService';
import { LiveServerMessage } from '@google/genai';
import { CalendarPost, PostFormat, Platform, AppContext } from '../types';
import { CCTextField } from './ui/Inputs';

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPost?: (post: CalendarPost) => void;
  appContext: AppContext;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    isAction?: boolean;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ isOpen, onClose, onAddPost, appContext }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');
  
  // --- Text Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: '1', role: 'model', text: 'Hey team! Ready to create some killer content? I have full visibility into your drafts, library, and schedule. How can I help? 💅✨' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Voice Chat State ---
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  
  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  // Cleanup on unmount or close
  useEffect(() => {
      if (!isOpen) {
          endLiveSession();
      }
      return () => {
          endLiveSession();
      };
  }, [isOpen]);

  // --- Text Chat Logic ---
  const handleSendMessage = async () => {
      if (!inputText.trim()) return;
      
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputText };
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      setIsTyping(true);

      try {
          // Pass context to ensure AI sees current data
          if (!chatSessionRef.current) {
              chatSessionRef.current = createChatSession(appContext);
          }

          const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
          const responseText = result.text || "Sorry, I couldn't generate a response.";
          
          // Check for JSON block (Calendar Draft)
          let cleanText = responseText;
          try {
              if (responseText.includes('```json')) {
                  const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
                  if (jsonMatch && jsonMatch[1]) {
                      const data = JSON.parse(jsonMatch[1]);
                      if (data.events && onAddPost) {
                          data.events.forEach((evt: any) => {
                             const newPost: CalendarPost = {
                                 id: Date.now().toString() + Math.random(),
                                 title: evt.title,
                                 date: new Date(evt.date + 'T' + (evt.time_start || '09:00')),
                                 status: 'DRAFT',
                                 platforms: [Platform.Instagram],
                                 format: PostFormat.FeedPost,
                                 contentTypeTags: evt.tags || ['Planned'],
                                 caption: evt.description
                             };
                             onAddPost(newPost);
                          });
                          cleanText = "I've added those drafts to your calendar! 🗓️✨";
                      }
                  }
              }
          } catch (e) {
              console.warn("Failed to parse tool output", e);
          }

          const modelMsg: ChatMessage = { 
              id: (Date.now() + 1).toString(), 
              role: 'model', 
              text: cleanText 
          };
          setMessages(prev => [...prev, modelMsg]);
      } catch (e) {
          console.error(e);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Oops! Something went wrong. Try again? 💅" }]);
      } finally {
          setIsTyping(false);
      }
  };

  // --- Live Voice Logic ---
  
  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const createPCM16Blob = (inputData: Float32Array): { data: string, mimeType: string } => {
     const l = inputData.length;
     const int16 = new Int16Array(l);
     for (let i = 0; i < l; i++) {
         let s = Math.max(-1, Math.min(1, inputData[i]));
         int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
     }
     
     let binary = '';
     const bytes = new Uint8Array(int16.buffer);
     const len = bytes.byteLength;
     for (let i = 0; i < len; i++) {
         binary += String.fromCharCode(bytes[i]);
     }
     
     return {
         data: btoa(binary),
         mimeType: 'audio/pcm;rate=16000'
     };
  };

  const decodeAudioData = async (
    arrayBuffer: ArrayBuffer, 
    ctx: AudioContext,
    sampleRate: number = 24000, 
    numChannels: number = 1
  ): Promise<AudioBuffer> => {
      const dataInt16 = new Int16Array(arrayBuffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      
      for(let ch=0; ch < numChannels; ch++) {
          const chData = buffer.getChannelData(ch);
          for(let i=0; i<frameCount; i++) {
              chData[i] = dataInt16[i * numChannels + ch] / 32768.0;
          }
      }
      return buffer;
  };

  const startLiveSession = async () => {
      setIsConnecting(true);
      setLiveError(null);
      
      try {
          // Setup Audio Contexts
          inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          
          // Get Mic Stream
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const source = inputAudioContextRef.current.createMediaStreamSource(stream);
          const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (e) => {
              // Only process if we have an active session
              if (!sessionRef.current) return;

              const inputData = e.inputBuffer.getChannelData(0);
              const blob = createPCM16Blob(inputData);
              
              sessionRef.current
                  .then((session: any) => {
                      try {
                          session.sendRealtimeInput({ media: blob });
                      } catch(err) {
                          // Session might be closed
                      }
                  })
                  .catch(() => {
                      // Ignore errors from session promise here
                  });
          };

          source.connect(processor);
          processor.connect(inputAudioContextRef.current.destination);

          // Connect to Gemini
          const sessionPromise = connectLiveSession({
              onOpen: () => {
                  console.log("Live Session Open");
                  setIsLiveConnected(true);
                  setIsConnecting(false);
              },
              onMessage: async (msg: LiveServerMessage) => {
                  const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                  if (audioData && outputAudioContextRef.current) {
                      setIsSpeaking(true);
                      const ctx = outputAudioContextRef.current;
                      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                      
                      const arrayBuffer = base64ToArrayBuffer(audioData);
                      const audioBuffer = await decodeAudioData(arrayBuffer, ctx);
                      
                      const source = ctx.createBufferSource();
                      source.buffer = audioBuffer;
                      source.connect(ctx.destination);
                      
                      source.addEventListener('ended', () => {
                          if (sourcesRef.current) {
                              sourcesRef.current.delete(source);
                              if (sourcesRef.current.size === 0) setIsSpeaking(false);
                          }
                      });
                      
                      source.start(nextStartTimeRef.current);
                      nextStartTimeRef.current += audioBuffer.duration;
                      sourcesRef.current.add(source);
                  }
                  
                  if (msg.serverContent?.interrupted) {
                       console.log("Interrupted");
                       sourcesRef.current.forEach(s => s.stop());
                       sourcesRef.current.clear();
                       nextStartTimeRef.current = 0;
                       setIsSpeaking(false);
                  }
              },
              onClose: () => {
                  console.log("Live Session Closed");
                  endLiveSession();
              },
              onError: (e) => {
                  console.error("Live Error", e);
                  const errorMsg = e?.message || e?.toString() || "Unknown error";
                  if (errorMsg.toLowerCase().includes("deadline expired")) {
                      setLiveError("Connection timed out. Please try starting again.");
                  } else {
                      setLiveError("Connection error. Please try again.");
                  }
                  endLiveSession();
              }
          }, appContext);
          
          sessionRef.current = sessionPromise;
          // Wait for connection with a safety timeout (handled by SDK but being explicit here)
          await sessionPromise; 

      } catch (e: any) {
          console.error("Failed to start live session", e);
          setLiveError(e.message || "Failed to connect to AI.");
          endLiveSession();
      }
  };

  const endLiveSession = () => {
      // Cleanup contexts
      if (inputAudioContextRef.current) {
          inputAudioContextRef.current.close().catch(() => {});
          inputAudioContextRef.current = null;
      }
      if (outputAudioContextRef.current) {
          outputAudioContextRef.current.close().catch(() => {});
          outputAudioContextRef.current = null;
      }
      
      setIsLiveConnected(false);
      setIsConnecting(false);
      setIsSpeaking(false);
      
      sessionRef.current = null;
      
      if (sourcesRef.current) {
          sourcesRef.current.forEach(s => {
              try { s.stop(); } catch(e) {}
          });
          sourcesRef.current.clear();
      }
      nextStartTimeRef.current = 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 border-l border-slate-200 flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-pink-600 text-white shadow-sm">
            <div className="flex flex-col">
                <h2 className="font-bold flex items-center gap-2">
                    <Sparkles size={18} className="text-yellow-300" />
                    AI Assistant
                </h2>
                <span className="text-[10px] font-bold text-pink-100 flex items-center gap-1">
                    <Database size={10} /> SYNCED WITH STUDIO DATA
                </span>
            </div>
            <button onClick={onClose} className="hover:bg-pink-700 p-1 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'chat' ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <MessageSquare size={16} /> Chat
            </button>
            <button 
                onClick={() => setActiveTab('voice')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'voice' ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Mic size={16} /> Live Voice
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
            {activeTab === 'chat' ? (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
                                    msg.role === 'user' 
                                    ? 'bg-pink-600 text-white rounded-br-none' 
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="flex gap-2 relative items-center">
                            <div className="flex-1">
                                <CCTextField 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask about your schedule or drafts..."
                                    className="rounded-full pr-12 text-sm"
                                    micEnabled={true}
                                />
                            </div>
                            <button 
                                onClick={handleSendMessage}
                                disabled={!inputText.trim() || isTyping}
                                className="bg-pink-600 text-white p-2.5 rounded-full hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-pink-100 transition-all active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
                    <div className={`relative w-40 h-40 rounded-full flex items-center justify-center mb-8 transition-all duration-700 ${
                        isLiveConnected 
                        ? 'bg-pink-100 ring-8 ring-pink-50 shadow-2xl shadow-pink-200' 
                        : 'bg-white border-4 border-slate-100 shadow-sm'
                    }`}>
                        {isConnecting ? (
                            <Loader2 size={48} className="text-pink-600 animate-spin" />
                        ) : isLiveConnected ? (
                            <Waves size={64} className={`text-pink-600 ${isSpeaking ? 'animate-pulse scale-110' : ''} transition-transform duration-300`} />
                        ) : (
                            <Mic size={64} className="text-slate-300" />
                        )}
                        
                        {/* Ripple Effect when speaking */}
                        {isSpeaking && (
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-pink-400 opacity-20 animate-ping"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-pink-400 opacity-20 animate-ping delay-300"></div>
                            </>
                        )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {isConnecting ? 'Connecting...' : isLiveConnected ? 'Listening...' : 'Voice Brainstorming'}
                    </h3>
                    <p className="text-sm text-slate-500 text-center mb-8 max-w-xs leading-relaxed font-medium">
                        {isLiveConnected 
                         ? "Go ahead, I'm listening! Ask me to help with your current drafts or schedule." 
                         : "Start a live conversation to brainstorm ideas hands-free using your studio context."}
                    </p>

                    {liveError && (
                        <div className="mb-6 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-red-100 animate-in shake">
                            <AlertCircle size={14}/> {liveError}
                        </div>
                    )}
                    
                    {!isLiveConnected ? (
                        <button 
                            onClick={startLiveSession}
                            disabled={isConnecting}
                            className="bg-pink-600 text-white px-8 py-4 rounded-full font-black shadow-xl shadow-pink-200 hover:bg-pink-700 hover:scale-105 transition-all flex items-center gap-3 active:scale-95"
                        >
                            <Mic size={20} /> Start Conversation
                        </button>
                    ) : (
                        <button 
                            onClick={endLiveSession}
                            className="bg-white border-2 border-red-100 text-red-600 px-8 py-3 rounded-full font-bold hover:bg-red-50 flex items-center gap-2 transition-all active:scale-95"
                        >
                            <StopCircle size={20} /> End Session
                        </button>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default ChatAssistant;