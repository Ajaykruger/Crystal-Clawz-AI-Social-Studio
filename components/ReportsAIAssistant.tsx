
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, BarChart, ChevronRight, Loader2, PlayCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { CCTextField } from './ui/Inputs';
import { parseReportQuery } from '../services/geminiService';
import { saveReport, runReport, mapIntentToTemplate, getReportTemplates } from '../services/reportService';
import { ReportQueryParseResult, ReportRun, Platform } from '../types';

interface ReportsAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: any, params?: any) => void;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: React.ReactNode;
}

const ReportsAIAssistant: React.FC<ReportsAIAssistantProps> = ({ isOpen, onClose, onNavigate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: '1', role: 'model', content: "Hi! I'm your Analytics Assistant. I can build reports for you. Try asking 'Show me top Instagram posts last 30 days'." }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<ReportQueryParseResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string = inputText) => {
      if (!text.trim()) return;
      
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      setIsTyping(true);
      setPendingConfig(null);

      try {
          const result = await parseReportQuery(text);
          
          if (!result || result.intent === 'unknown') {
              setMessages(prev => [...prev, { 
                  id: Date.now().toString(), 
                  role: 'model', 
                  content: "I'm not sure which report to run. Try asking for 'performance overview', 'top posts', or 'calendar gaps'." 
              }]);
          } else {
              setPendingConfig(result);
              setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  content: (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <p className="text-sm text-slate-700 mb-3">{result.explanation}</p>
                          <div className="text-xs text-slate-500 space-y-1 mb-4 bg-white p-3 rounded border border-slate-100">
                              <div className="flex justify-between">
                                  <span className="font-bold">Intent:</span>
                                  <span>{result.intent.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="font-bold">Platforms:</span>
                                  <span>{result.platforms.join(', ')}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="font-bold">Range:</span>
                                  <span>{result.dateRange.replace(/_/g, ' ')}</span>
                              </div>
                          </div>
                          <button 
                            onClick={() => handleExecuteRun(result)}
                            className="w-full bg-pink-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-pink-700 flex items-center justify-center gap-2"
                          >
                              <PlayCircle size={16} /> Run Report
                          </button>
                      </div>
                  )
              }]);
          }
      } catch (e) {
          console.error(e);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Something went wrong parsing your request." }]);
      } finally {
          setIsTyping(false);
      }
  };

  const handleExecuteRun = async (config: ReportQueryParseResult) => {
      // Clear pending state to prevent double clicks
      setPendingConfig(null);
      
      // Add a loader message
      const loadMsgId = Date.now().toString();
      setMessages(prev => [...prev, { 
          id: loadMsgId, 
          role: 'model', 
          content: <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Running report...</span> 
      }]);

      try {
          // 1. Create Report Definition
          const templateId = mapIntentToTemplate(config.intent);
          const reportDef = saveReport({
              name: `AI: ${config.intent} (${new Date().toLocaleDateString()})`,
              templateId: templateId,
              description: config.explanation,
              scope: {
                  platforms: config.platforms,
                  dateRange: config.dateRange
              }
          });

          // 2. Run Report
          const run = await runReport(reportDef.id);

          // 3. Update Chat with Results
          setMessages(prev => {
              const filtered = prev.filter(m => m.id !== loadMsgId);
              return [...filtered, {
                  id: Date.now().toString(),
                  role: 'model',
                  content: <ReportResultCard run={run} reportId={reportDef.id} onNavigate={onNavigate} />
              }];
          });

      } catch (e) {
          setMessages(prev => prev.filter(m => m.id !== loadMsgId).concat({
              id: Date.now().toString(),
              role: 'model',
              content: "Failed to execute report run."
          }));
      }
  };

  const ReportResultCard = ({ run, reportId, onNavigate }: { run: ReportRun, reportId: string, onNavigate: any }) => (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-green-50 border-b border-green-100 flex items-center gap-2 text-green-800 text-sm font-bold">
              <Sparkles size={14}/> Report Ready
          </div>
          <div className="p-4 space-y-4">
              {/* KPIs Summary */}
              <div className="grid grid-cols-2 gap-2">
                  {run.results.kpis.slice(0, 2).map((k, i) => (
                      <div key={i} className="bg-slate-50 p-2 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-500">{k.label}</div>
                          <div className="text-sm font-bold text-slate-900">{k.value}</div>
                      </div>
                  ))}
              </div>
              
              {/* Top Insight */}
              {run.results.insights.length > 0 && (
                  <div className="text-xs text-slate-700 bg-blue-50 p-2 rounded border border-blue-100 flex gap-2">
                      <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5"/>
                      {run.results.insights[0]}
                  </div>
              )}

              <button 
                onClick={() => {
                    onClose();
                    onNavigate('settings', { tab: 'reports', action: 'view_run', reportId: reportId });
                }}
                className="w-full text-center text-xs font-bold text-pink-600 hover:underline flex items-center justify-center gap-1"
              >
                  View Full Report <ArrowRight size={12}/>
              </button>
          </div>
      </div>
  );

  const chips = [
      "Top Facebook posts last 7 days",
      "Instagram engagement this month",
      "Show me calendar gaps",
      "Draft health check"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 border-l border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
            <h2 className="font-bold flex items-center gap-2">
                <BarChart size={18} className="text-pink-400" />
                Reports AI
            </h2>
            <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded-full"><X size={20} /></button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-xl px-4 py-3 text-sm ${
                        msg.role === 'user' 
                        ? 'bg-slate-800 text-white rounded-br-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}>
                        {msg.content}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none px-4 py-3 shadow-sm">
                        <Loader2 size={16} className="animate-spin text-slate-400"/>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Quick Chips */}
        {messages.length < 3 && (
            <div className="px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
                {chips.map((chip, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSendMessage(chip)}
                        className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:border-pink-300 hover:text-pink-600 transition-colors shadow-sm"
                    >
                        {chip}
                    </button>
                ))}
            </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex gap-2 relative items-center">
                <div className="flex-1">
                    <CCTextField 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask about your data..."
                        className="rounded-full pr-12"
                        micEnabled={true}
                    />
                </div>
                <button 
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isTyping}
                    className="bg-slate-900 text-white p-2 rounded-full hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default ReportsAIAssistant;
