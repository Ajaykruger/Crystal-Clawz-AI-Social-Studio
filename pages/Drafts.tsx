
import React, { useState, useMemo, useEffect } from 'react';
import { DraftListPost, Platform, PostFormat, PostStatus, DraftReadiness, DraftHealth } from '../types';
import { 
  Search, Filter, MoreHorizontal, AlertTriangle, CheckCircle, 
  Clock, Zap, Image as ImageIcon, MessageSquare, ChevronDown, 
  ChevronRight, Sparkles, X, Edit2, Copy, Trash2, CalendarClock,
  ArrowRight, Layout, Paperclip, Video, Instagram, Facebook, Youtube, Loader2, BarChart
} from 'lucide-react';
import { CCSearchField, CCTextArea, CCTextField } from '../components/ui/Inputs';
import { CCCheckbox } from '../components/ui/Checkbox';

interface DraftsProps {
  onNavigate: (view: any, params?: any) => void;
  drafts: DraftListPost[];
  onUpdateDrafts: (drafts: DraftListPost[]) => void;
  onMoveToReview: (draft: DraftListPost) => void;
}

// --- Helpers ---

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
    });
};

const PlatformIcon: React.FC<{ p: Platform, size?: number }> = ({ p, size = 14 }) => {
  switch(p) {
    case Platform.Instagram: return <Instagram size={size} className="text-pink-600" />;
    case Platform.Facebook: return <Facebook size={size} className="text-blue-600" />;
    case Platform.TikTok: return <span style={{fontSize: size, fontWeight: 'bold'}}>Tk</span>;
    case Platform.YouTube: return <Youtube size={size} className="text-red-600" />;
    case Platform.YouTubeShorts: return <Youtube size={size} className="text-red-600" />;
    default: return <Layout size={size} className="text-slate-400" />;
  }
};

const HealthBadge = ({ health }: { health: DraftHealth }) => {
    const colors = {
        'STRONG': 'bg-green-100 text-green-700 border-green-200',
        'AVERAGE': 'bg-amber-100 text-amber-700 border-amber-200',
        'RISKY': 'bg-red-100 text-red-700 border-red-200'
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 w-fit ${colors[health.label]}`}>
            <Zap size={10} className={health.label === 'STRONG' ? 'fill-green-700' : ''} />
            {health.label} {health.score}
        </span>
    );
};

const ReadinessBadge = ({ readiness }: { readiness: DraftReadiness }) => {
    const colors = {
        'READY': 'bg-blue-50 text-blue-700 border-blue-200',
        'NEEDS_ATTENTION': 'bg-amber-50 text-amber-700 border-amber-200',
        'BLOCKED': 'bg-red-50 text-red-700 border-red-200'
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors[readiness.state]}`}>
            {readiness.state.replace('_', ' ')}
        </span>
    );
};

// --- Sub-Components Defined Outside to Avoid Remounts ---

const DraftSummary = ({ stats, setFilterReadiness }: { stats: { ready: number, blocked: number }, setFilterReadiness: (s: string) => void }) => (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 text-white shadow-lg mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <Sparkles className="text-pink-300" size={24} />
            </div>
            <div>
                <h2 className="font-bold text-lg">Draft Summary</h2>
                <p className="text-sm text-slate-300">
                    {stats.ready} drafts ready for review. {stats.blocked} blocked.
                </p>
                {stats.blocked > 0 && (
                    <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-red-500/20 text-red-200 px-2 py-0.5 rounded flex items-center gap-1 border border-red-500/30">
                            <AlertTriangle size={10} /> Missing Media
                        </span>
                    </div>
                )}
            </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setFilterReadiness('BLOCKED')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                Show Blocked
            </button>
            <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-pink-900/20 transition-colors flex items-center gap-2">
                <Sparkles size={16} /> Fix with AI
            </button>
        </div>
    </div>
);

const InlineEditor = ({ 
    draft, 
    onUpdate, 
    onOpenDrawer, 
    onSendToReview 
}: { 
    draft: DraftListPost, 
    onUpdate: (id: string, updates: Partial<DraftListPost>) => void,
    onOpenDrawer: (id: string) => void,
    onSendToReview: (id: string) => void
}) => {
    const [isRewriting, setIsRewriting] = useState(false);

    const handleRewrite = () => {
        setIsRewriting(true);
        // Simulate AI delay
        setTimeout(() => {
            const rewritten = draft.caption.startsWith("✨") 
                ? draft.caption 
                : "✨ " + draft.caption + " \n\n#CrystalClawz #NailTechLife";
            onUpdate(draft.id, { caption: rewritten });
            setIsRewriting(false);
        }, 1000);
    };

    return (
        <div className="bg-slate-50 dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 p-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex gap-6">
                {/* Check & Health */}
                <div className="w-64 shrink-0 space-y-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Health Check</h4>
                            <HealthBadge health={draft.draft_health} />
                        </div>
                        <div className="space-y-2">
                            {[
                                { label: 'Hook present', pass: !!draft.hook },
                                { label: 'Clear CTA', pass: !!draft.cta },
                                { label: 'Media attached', pass: draft.media.length > 0 },
                                { label: 'Hashtags', pass: draft.hashtags.length > 0 },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className={`text-slate-600 dark:text-slate-300 ${!item.pass && 'text-slate-400 dark:text-slate-500'}`}>{item.label}</span>
                                    {item.pass 
                                        ? <CheckCircle size={14} className="text-green-500" /> 
                                        : <AlertTriangle size={14} className="text-amber-400" />
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Inline AI Suggestions */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                        <h4 className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase mb-2 flex items-center gap-2">
                            <Sparkles size={12} /> AI Suggestions
                        </h4>
                        <div className="space-y-2">
                            {!draft.hook && (
                                <button 
                                    onClick={() => onUpdate(draft.id, { hook: "Wait until you see this..." })}
                                    className="w-full text-left text-xs bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                                >
                                    + Add Hook: "Wait until you see this..."
                                </button>
                            )}
                            {!draft.cta && (
                                <button 
                                    onClick={() => onUpdate(draft.id, { cta: "Shop link in bio" })}
                                    className="w-full text-left text-xs bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                                >
                                    + Add CTA: "Shop link in bio"
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Editor */}
                <div className="flex-1 space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Caption</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleRewrite}
                                    disabled={isRewriting}
                                    className="text-[10px] text-pink-600 dark:text-pink-400 font-medium hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isRewriting ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                    {isRewriting ? 'Rewriting...' : 'Rewrite'}
                                </button>
                            </div>
                        </div>
                        <CCTextArea 
                            className="h-32 text-sm"
                            value={draft.caption}
                            onChange={(e) => onUpdate(draft.id, { caption: e.target.value })}
                        />
                    </div>
                    
                    {/* Media Preview / Attach */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Media</label>
                        <div className="flex gap-2">
                            {draft.media.length > 0 ? (
                                draft.media.map((m, i) => (
                                    <div key={i} className="w-20 h-20 bg-slate-100 dark:bg-gray-700 rounded-lg overflow-hidden relative group">
                                        <img src={m.url} className="w-full h-full object-cover" />
                                        <button className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <button className="w-20 h-20 bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-pink-400 hover:text-pink-600 transition-colors">
                                    <Paperclip size={16} />
                                    <span className="text-[10px] font-bold mt-1">Attach</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-gray-700">
                        <button className="text-slate-500 dark:text-slate-400 text-sm font-medium px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">Archive</button>
                        <button className="text-slate-500 dark:text-slate-400 text-sm font-medium px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">Schedule</button>
                        <button 
                            onClick={() => onOpenDrawer(draft.id)}
                            className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700"
                        >
                            Full Edit
                        </button>
                        <button 
                            onClick={() => onSendToReview(draft.id)}
                            className="bg-pink-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-pink-700 shadow-sm flex items-center gap-2"
                        >
                            Send to Review <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DrawerEditor = ({ editingDraft, onClose }: { editingDraft: DraftListPost | undefined, onClose: () => void }) => {
    const [activeDrawerTab, setActiveDrawerTab] = useState<'Content' | 'Media' | 'History'>('Content');

    if (!editingDraft) return null;
    
    return (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform border-l border-slate-200 dark:border-gray-700 flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="h-16 border-b border-slate-200 dark:border-gray-700 px-6 flex items-center justify-between bg-slate-50 dark:bg-gray-800 shrink-0">
                  <div className="min-w-0 pr-4">
                      <h3 className="font-bold text-slate-900 dark:text-white">Edit Draft</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{editingDraft.title}</p>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors"
                    title="Close"
                  >
                    <X size={20}/>
                  </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-gray-700 px-6 gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {(['Content', 'Media', 'History'] as const).map(tab => (
                      <button 
                          key={tab}
                          onClick={() => setActiveDrawerTab(tab)}
                          className={`py-3 border-b-2 transition-colors ${activeDrawerTab === tab ? 'border-pink-600 text-pink-600 dark:text-pink-400' : 'border-transparent hover:text-slate-800 dark:hover:text-white'}`}
                      >
                          {tab}
                      </button>
                  ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {activeDrawerTab === 'Content' && (
                      <>
                          <div>
                              <CCTextField 
                                label="Title / Hook"
                                defaultValue={editingDraft.title}
                              />
                          </div>
                          <div>
                              <CCTextArea 
                                label="Caption"
                                className="h-40"
                                defaultValue={editingDraft.caption}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Hashtags</label>
                              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
                                  {editingDraft.hashtags.map(t => (
                                      <span key={t} className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded border border-slate-200 dark:border-gray-600 dark:text-slate-300">{t}</span>
                                  ))}
                                  <button className="text-xs text-slate-400 hover:text-pink-600 dark:hover:text-pink-400">+ Add</button>
                              </div>
                          </div>
                      </>
                  )}
                  {activeDrawerTab === 'Media' && (
                      <div className="text-center py-12 text-slate-400">
                          <ImageIcon size={48} className="mx-auto mb-3 opacity-20"/>
                          <p className="text-sm">Manage attachments</p>
                      </div>
                  )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 flex justify-end gap-3">
                  <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-600">Save</button>
                  <button className="px-6 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold hover:bg-pink-700 shadow-sm">Send to Review</button>
              </div>
          </div>
        </>
    );
};

const Drafts: React.FC<DraftsProps> = ({ onNavigate, drafts, onUpdateDrafts, onMoveToReview }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [filterReadiness, setFilterReadiness] = useState<string>('ALL');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Handle outside clicks for menus
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Filter Logic
    const filteredDrafts = useMemo(() => {
        let result = drafts;
        if (filterReadiness !== 'ALL') {
            result = result.filter(d => d.readiness.state === filterReadiness);
        }
        if (searchQuery) {
            result = result.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.caption.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return result;
    }, [drafts, filterReadiness, searchQuery]);

    const stats = useMemo(() => ({
        ready: drafts.filter(d => d.readiness.state === 'READY').length,
        blocked: drafts.filter(d => d.readiness.state === 'BLOCKED').length,
        total: drafts.length
    }), [drafts]);

    // Actions
    const handleToggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleUpdateDraft = (id: string, updates: Partial<DraftListPost>) => {
        onUpdateDrafts(drafts.map(d => d.id === id ? { ...d, ...updates } : d));
    };

    const handleSendToReview = (id: string) => {
        const draft = drafts.find(d => d.id === id);
        if (draft) {
            onMoveToReview(draft);
        }
    };

    const openDrawer = (id: string) => {
        setEditingDraftId(id);
        setDrawerOpen(true);
        setActiveMenuId(null);
    };

    const editingDraft = drafts.find(d => d.id === editingDraftId);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-900 relative transition-colors duration-300">
            
            {/* Top Bar */}
            <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onNavigate.bind(null, 'dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-500 dark:text-slate-400">
                        <ArrowRight size={20} className="rotate-180" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Drafts</h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="w-64">
                        <CCSearchField 
                            placeholder="Search drafts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClear={() => setSearchQuery('')}
                        />
                    </div>
                    <button 
                        onClick={() => onNavigate('settings', { tab: 'reports', action: 'new', template: 'draft_health' })}
                        className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-300 flex items-center gap-2 text-sm font-medium"
                    >
                        <BarChart size={16} /> Report
                    </button>
                    <button className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-300">
                        <Filter size={20} />
                    </button>
                    <button onClick={onNavigate.bind(null, 'create')} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors">
                        New Draft
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    
                    <DraftSummary stats={stats} setFilterReadiness={setFilterReadiness} />

                    {/* Filter Bar */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {['ALL', 'READY', 'NEEDS_ATTENTION', 'BLOCKED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterReadiness(status)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                                    filterReadiness === status 
                                    ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' 
                                    : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Draft Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            <div className="col-span-1 text-center">
                                <CCCheckbox 
                                    checked={selectedIds.size === filteredDrafts.length && filteredDrafts.length > 0}
                                    onChange={(checked) => {
                                        if (selectedIds.size === filteredDrafts.length) setSelectedIds(new Set());
                                        else setSelectedIds(new Set(filteredDrafts.map(d => d.id)));
                                    }}
                                />
                            </div>
                            <div className="col-span-4">Title / Hook</div>
                            <div className="col-span-1">Platform</div>
                            <div className="col-span-2">Readiness</div>
                            <div className="col-span-1">Health</div>
                            <div className="col-span-1">Last Edited</div>
                            <div className="col-span-2 text-right">Action</div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-slate-100 dark:divide-gray-700">
                            {filteredDrafts.map(draft => (
                                <React.Fragment key={draft.id}>
                                    <div 
                                        className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${expandedRowId === draft.id ? 'bg-slate-50 dark:bg-gray-700/50' : ''}`}
                                        onClick={() => setExpandedRowId(expandedRowId === draft.id ? null : draft.id)}
                                    >
                                        <div className="col-span-1 text-center" onClick={(e) => e.stopPropagation()}>
                                            <CCCheckbox 
                                                checked={selectedIds.has(draft.id)}
                                                onChange={() => handleToggleSelect(draft.id)}
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{draft.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{draft.hook || "No hook set"}</p>
                                        </div>
                                        <div className="col-span-1 flex gap-1">
                                            {draft.platforms.map(p => <PlatformIcon key={p} p={p} />)}
                                        </div>
                                        <div className="col-span-2">
                                            <ReadinessBadge readiness={draft.readiness} />
                                        </div>
                                        <div className="col-span-1">
                                            <HealthBadge health={draft.draft_health} />
                                        </div>
                                        <div className="col-span-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {formatDate(draft.last_edited_at)}
                                        </div>
                                        <div className="col-span-2 flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {/* Smart Next Action Button */}
                                            {draft.readiness.missing_elements.includes('MEDIA') ? (
                                                <button className="text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-1 whitespace-nowrap">
                                                    <Paperclip size={12} /> Attach
                                                </button>
                                            ) : draft.readiness.missing_elements.includes('CTA') ? (
                                                <button className="text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-1 whitespace-nowrap">
                                                    <Sparkles size={12} /> Add CTA
                                                </button>
                                            ) : draft.status === 'READY_TO_REVIEW' ? (
                                                <button onClick={() => handleSendToReview(draft.id)} className="text-xs bg-pink-600 text-white px-3 py-1.5 rounded hover:bg-pink-700 flex items-center gap-1 whitespace-nowrap shadow-sm">
                                                    Review <ArrowRight size={12} />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setExpandedRowId(expandedRowId === draft.id ? null : draft.id); }}
                                                    className="text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-gray-700 min-w-[60px]"
                                                >
                                                    {expandedRowId === draft.id ? 'Close' : 'Open'}
                                                </button>
                                            )}
                                            
                                            {/* Action Menu (Dots) */}
                                            <div className="relative">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuId(activeMenuId === draft.id ? null : draft.id);
                                                    }}
                                                    className={`p-1.5 rounded transition-colors ${activeMenuId === draft.id ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700'}`}
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                                
                                                {/* Dropdown */}
                                                {activeMenuId === draft.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-slate-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                        <div className="py-1">
                                                            <button onClick={() => openDrawer(draft.id)} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                                <Edit2 size={14} className="text-slate-400"/> Edit
                                                            </button>
                                                            <button className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                                <Copy size={14} className="text-slate-400"/> Duplicate
                                                            </button>
                                                            <button className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                                <CalendarClock size={14} className="text-slate-400"/> Schedule
                                                            </button>
                                                            <div className="h-px bg-slate-100 dark:bg-gray-700 my-1"/>
                                                            <button className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2">
                                                                <Trash2 size={14}/> Archive
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Expanded Row */}
                                    {expandedRowId === draft.id && (
                                        <div className="col-span-12">
                                            <InlineEditor 
                                                draft={draft} 
                                                onUpdate={handleUpdateDraft} 
                                                onOpenDrawer={openDrawer}
                                                onSendToReview={handleSendToReview}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        
                        {filteredDrafts.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                <p>No drafts found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-6 z-30 animate-in slide-in-from-bottom-4">
                    <span className="text-sm font-bold">{selectedIds.size} selected</span>
                    <div className="h-4 w-px bg-slate-700" />
                    <button className="text-sm font-medium hover:text-pink-400 flex items-center gap-2">
                        <Sparkles size={16} /> AI Rewrite
                    </button>
                    <button className="text-sm font-medium hover:text-pink-400 flex items-center gap-2">
                        <CalendarClock size={16} /> Schedule
                    </button>
                    <button className="text-sm font-medium hover:text-red-400 flex items-center gap-2">
                        <Trash2 size={16} /> Archive
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} className="ml-4 p-1 hover:bg-slate-800 rounded-full">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Drawer */}
            {drawerOpen && <DrawerEditor editingDraft={editingDraft} onClose={() => setDrawerOpen(false)} />}
        </div>
    );
};

export default Drafts;
