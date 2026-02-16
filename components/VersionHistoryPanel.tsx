
import React from 'react';
import { VersionHistoryItem } from '../types';
import { History, RotateCcw, Clock } from 'lucide-react';

interface VersionHistoryPanelProps<T> {
  history: VersionHistoryItem<T>[];
  onRestore: (data: T) => void;
  onClose: () => void;
}

export function VersionHistoryPanel<T>({ history, onRestore, onClose }: VersionHistoryPanelProps<T>) {
  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <History size={18} className="text-slate-500" />
          Version History
        </h3>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800 font-medium">Close</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 ? (
          <div className="text-center text-slate-400 py-8 text-sm">
            No history yet. Edits will appear here.
          </div>
        ) : (
          history.slice().reverse().map((version) => (
            <div key={version.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-pink-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {version.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{version.author}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(version.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => onRestore(version.data)}
                  className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 flex items-center gap-1"
                >
                  <RotateCcw size={10} /> Restore
                </button>
              </div>
              {version.note && <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded">{version.note}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
