
import React, { useEffect, useState } from 'react';
import { TrendingSuggestion } from '../types';
import { getTrendingSuggestions } from '../services/geminiService';
import { Sparkles, TrendingUp, Hash, Lightbulb, RefreshCw, Plus } from 'lucide-react';

interface TrendingSidebarProps {
  onApply: (suggestion: TrendingSuggestion) => void;
}

export const TrendingSidebar: React.FC<TrendingSidebarProps> = ({ onApply }) => {
  const [suggestions, setSuggestions] = useState<TrendingSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    const data = await getTrendingSuggestions();
    setSuggestions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'angle': return <Lightbulb size={14} className="text-yellow-500"/>;
      case 'hashtag': return <Hash size={14} className="text-blue-500"/>;
      default: return <TrendingUp size={14} className="text-pink-500"/>;
    }
  };

  return (
    <div className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden h-full">
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Sparkles size={16} className="text-pink-600"/> Trending Now
        </h4>
        <button onClick={fetchSuggestions} className={`p-1.5 rounded hover:bg-slate-100 text-slate-400 ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={14}/>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Scanning trends...</div>
        ) : (
          suggestions.map(s => (
            <div key={s.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-pink-200 transition-colors group">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 capitalize">
                  {getIcon(s.type)} {s.type.replace('_', ' ')}
                </div>
                <button 
                  onClick={() => onApply(s)}
                  className="text-pink-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-pink-50 rounded"
                  title="Apply to draft"
                >
                  <Plus size={14}/>
                </button>
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1">{s.text}</p>
              <p className="text-[10px] text-slate-500">{s.reason}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
