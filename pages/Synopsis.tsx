
import React, { useState, useEffect } from 'react';
import { generateAppSynopsis } from '../services/geminiService';
import { Sparkles, Loader2, Zap, AlertTriangle, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';

interface SynopsisProps {
    data: {
        draftCount: number;
        scheduledCount: number;
        reviewCount: number;
        topPerformers: string[];
    };
}

const Synopsis: React.FC<SynopsisProps> = ({ data }) => {
    const [synopsis, setSynopsis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchSynopsis = async () => {
        setLoading(true);
        try {
            const result = await generateAppSynopsis(data);
            setSynopsis(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSynopsis();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-128px)] text-center p-8">
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mb-6 animate-bounce">
                    <Sparkles className="text-pink-600 dark:text-pink-400" size={32} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Analyzing Studio Operations...</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">Generating your strategic briefing based on current drafts and performance.</p>
                <div className="mt-8 flex items-center gap-2 text-pink-600 font-bold">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Crunching metadata...</span>
                </div>
            </div>
        );
    }

    if (!synopsis) return null;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="heading-page text-4xl mb-2 flex items-center gap-3">
                        <Sparkles className="text-pink-600" />
                        Studio Synopsis
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">AI-generated strategic briefing for Crystal Clawz.</p>
                </div>
                <button 
                    onClick={fetchSynopsis}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-all shadow-sm"
                >
                    <RefreshCw size={16} /> Refresh Analysis
                </button>
            </div>

            {/* Main Summary Card */}
            <div className="glass-card p-8 rounded-3xl border-l-8 border-l-pink-600 shadow-xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={120} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-sm font-black text-pink-600 uppercase tracking-widest mb-4">Executive Summary</h2>
                    <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white leading-relaxed italic">
                        "{synopsis.summary}"
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Brand Health */}
                <div className="glass-card p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        Brand Health
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                        {synopsis.brandHealth}
                    </p>
                </div>

                {/* Operational Status */}
                <div className="glass-card p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" />
                        Operational Status
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                        {synopsis.operationalStatus}
                    </p>
                </div>
            </div>

            {/* Critical Gaps & Growth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-8 rounded-3xl">
                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <AlertTriangle size={18} /> Critical Gaps
                    </h3>
                    <div className="space-y-4">
                        {synopsis.criticalGaps.map((gap: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 text-red-800 dark:text-red-300 font-bold bg-white/50 dark:bg-red-900/20 p-3 rounded-xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                                {gap}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 p-8 rounded-3xl">
                    <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={18} /> Growth Opportunities
                    </h3>
                    <div className="space-y-4">
                        {synopsis.growthOpportunities.map((opp: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 text-purple-800 dark:text-purple-300 font-bold bg-white/50 dark:bg-purple-900/20 p-3 rounded-xl">
                                <Sparkles size={16} className="mt-0.5 shrink-0" />
                                {opp}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                <button className="btn-primary px-8 py-4 rounded-2xl text-lg font-black shadow-pink-500/20">
                    Apply Recommended Strategy
                </button>
            </div>
        </div>
    );
};

export default Synopsis;
