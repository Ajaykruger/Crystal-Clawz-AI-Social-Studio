
import React from 'react';
import { X, Heart, MessageCircle, Share2, TrendingUp, Sparkles, Copy, Eye, BarChart } from 'lucide-react';
import { Platform } from '../types';
import { PlatformIcon } from '../pages/Dashboard';

interface PostDetailsModalProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
  onCreateSimilar: (post: any) => void;
}

const PostDetailsModal: React.FC<PostDetailsModalProps> = ({ post, isOpen, onClose, onCreateSimilar }) => {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-[600px] animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Left Column: Media */}
        <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative overflow-hidden group">
            <img 
                src={post.thumbnail} 
                alt={post.title} 
                className="w-full h-full object-contain"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
            
            <div className="absolute bottom-4 left-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                    <PlatformIcon p={post.platform} />
                    <span className="text-sm font-medium opacity-90">{post.platform}</span>
                </div>
            </div>
        </div>

        {/* Right Column: Details & Stats */}
        <div className="w-full md:w-1/2 flex flex-col bg-white">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">{post.title}</h2>
                    <p className="text-sm text-slate-500">Posted on {new Date().toLocaleDateString()}</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Analytics Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-pink-50 rounded-xl border border-pink-100">
                        <div className="flex items-center gap-2 text-pink-700 text-xs font-bold uppercase mb-1">
                            <Heart size={12} /> Likes
                        </div>
                        <span className="text-xl font-bold text-slate-900">{post.likes}</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase mb-1">
                            <TrendingUp size={12} /> Trend
                        </div>
                        <span className="text-xl font-bold text-slate-900">{post.trend}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                            <MessageCircle size={12} /> Comments
                        </div>
                        <span className="text-lg font-bold text-slate-900">{post.comments}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                            <Share2 size={12} /> Shares
                        </div>
                        <span className="text-lg font-bold text-slate-900">{post.shares}</span>
                    </div>
                </div>

                {/* Caption / Copy */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase mb-3 flex items-center gap-2">
                        <Copy size={14} className="text-slate-400"/> Post Copy
                    </h3>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                        {post.caption || "No caption available."}
                    </div>
                </div>

                {/* AI Insights (Mock) */}
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <h3 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                        <Sparkles size={14} /> AI Analysis
                    </h3>
                    <ul className="text-xs text-purple-800 space-y-2 list-disc list-inside">
                        <li>High engagement due to the <strong>strong hook</strong> in the first 3 seconds.</li>
                        <li><strong>Call to action</strong> generated 40% more comments than average.</li>
                        <li>Visual style aligns perfectly with the current <strong>"Clean Girl"</strong> trend.</li>
                    </ul>
                </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button 
                    onClick={() => onCreateSimilar(post)}
                    className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                    <Sparkles size={18} /> Create Similar Post
                </button>
                <p className="text-xs text-center text-slate-400 mt-3">
                    This will open a new draft pre-filled with this post's data.
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default PostDetailsModal;
