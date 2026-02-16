
import React, { useState } from 'react';
import { ViewState, CalendarPost, Platform, PostFormat, PostStatus, PlanIdea } from '../types';
import { 
  ChevronLeft, ChevronRight, Plus, Filter, Calendar as CalendarIcon, 
  MoreHorizontal, X, Clock, CheckCircle, AlertTriangle, FileText, 
  Instagram, Facebook, Linkedin, Youtube, Layout, ChevronDown, Lightbulb, Wand2, ArrowLeft, BarChart, Check
} from 'lucide-react';
import BulkCreateModal from '../components/BulkCreateModal';
import IdeasPlanner from '../components/IdeasPlanner';
import { CCTextField } from '../components/ui/Inputs';
import { CCTooltip } from '../components/ui/Tooltip';

interface CalendarProps {
  posts: CalendarPost[];
  onUpdatePost: (post: CalendarPost) => void;
  onNavigate: (view: ViewState, params?: any) => void;
  onEditPost?: (post: CalendarPost) => void;
  onAddReviewPosts?: (posts: any[]) => void;
  onAddPost?: (post: CalendarPost) => void;
}

const PlatformIcon: React.FC<{ p: Platform; size?: number }> = ({ p, size = 14 }) => {
  switch(p) {
    case Platform.Instagram: return <Instagram size={size} className="text-pink-600" />;
    case Platform.Facebook: return <Facebook size={size} className="text-blue-600" />;
    case Platform.TikTok: return <span style={{fontSize: size, fontWeight: 'bold'}}>Tk</span>;
    case Platform.YouTube: return <Youtube size={size} className="text-red-600" />;
    case Platform.YouTubeShorts: return <Youtube size={size} className="text-red-600" />;
    default: return <Layout size={size} className="text-slate-400" />;
  }
};

const StatusBadge = ({ status }: { status: PostStatus }) => {
  const styles = {
    PUBLISHED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    IDEA: 'bg-purple-100 text-purple-700 border-purple-200',
    CREATED: 'bg-teal-100 text-teal-700 border-teal-200',
    FAILED: 'bg-red-100 text-red-700 border-red-200'
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${styles[status] || styles.DRAFT}`}>
      {status === 'IDEA' ? 'IDEA' : status === 'CREATED' ? 'CREATED' : status.charAt(0)}
    </span>
  );
};

const Calendar: React.FC<CalendarProps> = ({ posts, onUpdatePost, onNavigate, onEditPost, onAddReviewPosts, onAddPost }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [filters, setFilters] = useState({
    platform: null as Platform | null,
    status: null as PostStatus | null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Ideas Mode State
  const [activeTab, setActiveTab] = useState<'schedule' | 'plan'>('schedule');
  const [ideasSubView, setIdeasSubView] = useState<'planner' | 'approved'>('planner');
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    return { days, startOffset };
  };

  const { days, startOffset } = getDaysInMonth(currentDate);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Filter posts based on active filters AND view mode
  const filteredPosts = posts.filter(p => {
    if (filters.platform && !p.platforms.includes(filters.platform)) return false;
    if (filters.status && p.status !== filters.status) return false;
    
    // View Mode Filtering
    if (activeTab === 'plan') {
        return p.status === 'IDEA' || p.status === 'CREATED'; // Show approved ideas and processed ones
    } else {
        return p.status !== 'IDEA'; // Show schedule items
    }
  });

  const getPostsForDay = (day: number) => {
    return filteredPosts.filter(p => {
      const d = new Date(p.date);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  // --- Handlers ---

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDay(date);
    setSelectedPost(null);
    setIsRescheduling(false);
  };

  const handlePostClick = (e: React.MouseEvent, post: CalendarPost) => {
    e.stopPropagation();
    if (activeTab === 'plan' && ideasSubView === 'approved') {
        // Toggle selection for bulk actions
        const next = new Set(selectedIdeaIds);
        if (next.has(post.id)) next.delete(post.id);
        else next.add(post.id);
        setSelectedIdeaIds(next);
        // Only open detail view if it's the first selection or we're specifically clicking to view
        if (!selectedPost || selectedPost.id !== post.id) {
            setSelectedPost(post);
        }
    } else {
        setSelectedPost(post);
        setSelectedDay(null);
        setIsRescheduling(false);
        // Init inputs...
        const d = new Date(post.date);
        setRescheduleDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        setRescheduleTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }
  };

  const handleSelectAllApproved = () => {
    const approvedIds = filteredPosts
        .filter(p => p.status === 'IDEA')
        .map(p => p.id);
    
    if (selectedIdeaIds.size === approvedIds.length && approvedIds.length > 0) {
        setSelectedIdeaIds(new Set());
    } else {
        setSelectedIdeaIds(new Set(approvedIds));
    }
  };

  const handleSaveReschedule = () => {
    if (selectedPost && rescheduleDate && rescheduleTime) {
      const newDate = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const updatedPost: CalendarPost = { 
          ...selectedPost, 
          date: newDate, 
          status: selectedPost.status === 'DRAFT' ? 'SCHEDULED' : selectedPost.status 
      };
      onUpdatePost(updatedPost);
      setSelectedPost(updatedPost);
      setIsRescheduling(false);
    }
  };

  const handleBulkSuccess = (generatedPosts: any[]) => {
      if (onAddReviewPosts) {
          onAddReviewPosts(generatedPosts);
      }
      // Update status of source ideas to CREATED
      if (onUpdatePost) {
          selectedIdeaIds.forEach(id => {
              const post = posts.find(p => p.id === id);
              if (post) onUpdatePost({...post, status: 'CREATED'});
          });
      }
      setSelectedIdeaIds(new Set());
      onNavigate('review');
  };

  const handleApproveFromPlanner = (idea: PlanIdea, date: Date) => {
      if (onAddPost) {
          const newPost: CalendarPost = {
              id: idea.id,
              title: idea.title,
              date: date,
              status: 'IDEA',
              platforms: idea.platforms,
              format: idea.format,
              contentTypeTags: [idea.contentType],
              whyItWorks: idea.why,
              notes: idea.notes,
              caption: idea.captionDraft // Pass the draft forward
          };
          onAddPost(newPost);
      }
  };

  // --- Render ---

  const DayDrawer = () => {
    const target = selectedPost || (selectedDay ? { date: selectedDay } as any : null);
    if (!target) return null;
    
    if (activeTab === 'plan' && ideasSubView === 'planner') return null;

    const isNew = !selectedPost;
    const postsOnDay = isNew && selectedDay ? getPostsForDay(selectedDay.getDate()) : [];

    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-slate-800 shadow-2xl z-40 transform transition-transform border-l border-slate-200 dark:border-slate-700 flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
               {selectedPost ? 'Post Details' : target.date.toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            {selectedPost && (
                 <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 cursor-pointer hover:text-pink-600" onClick={() => setIsRescheduling(true)}>
                    <Clock size={14} />
                    {selectedPost.date.toLocaleString('en-GB')}
                    <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 rounded ml-2 font-bold">Edit</span>
                 </p>
            )}
          </div>
          <button onClick={() => { setSelectedDay(null); setSelectedPost(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X size={20} className="text-slate-500 dark:text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {selectedPost ? (
             <>
               {isRescheduling && (
                   <div className="bg-white dark:bg-slate-700 border-2 border-pink-100 dark:border-pink-900 rounded-xl p-4 shadow-sm mb-4">
                       <h4 className="text-sm font-bold text-pink-900 dark:text-pink-200 mb-3 flex items-center gap-2"><CalendarIcon size={16}/> Reschedule</h4>
                       <div className="grid grid-cols-2 gap-3 mb-4">
                           <CCTextField 
                              type="date" 
                              value={rescheduleDate} 
                              onChange={e => setRescheduleDate(e.target.value)} 
                              micEnabled={false}
                           />
                           <CCTextField 
                              type="time" 
                              value={rescheduleTime} 
                              onChange={e => setRescheduleTime(e.target.value)} 
                              micEnabled={false}
                           />
                       </div>
                       <button onClick={handleSaveReschedule} className="w-full bg-pink-600 text-white py-2 rounded text-sm font-bold">Save</button>
                   </div>
               )}

               <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border ${
                      selectedPost.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      selectedPost.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      selectedPost.status === 'IDEA' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                      {selectedPost.status === 'PUBLISHED' ? <CheckCircle size={14} /> : selectedPost.status === 'SCHEDULED' ? <Clock size={14} /> : <Lightbulb size={14} />}
                      {selectedPost.status}
                  </div>
                  <div className="flex -space-x-2">
                      {selectedPost.platforms.map(p => (
                          <div key={p} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm z-10"><PlatformIcon p={p} size={16} /></div>
                      ))}
                  </div>
               </div>
               <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{selectedPost.title}</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-100 dark:border-slate-600 mt-2">{selectedPost.caption || selectedPost.whyItWorks || "No caption draft."}</p>
               </div>
               
               {selectedPost.status === 'IDEA' && (
                   <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                        <button 
                            onClick={() => { setSelectedIdeaIds(new Set([selectedPost.id])); setShowBulkModal(true); }}
                            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg shadow-purple-100"
                        >
                            <Wand2 size={18} /> Create Post from Idea
                        </button>
                   </div>
               )}
             </>
           ) : (
             <div className="space-y-4">
                {postsOnDay.map(p => (
                    <div key={p.id} onClick={() => setSelectedPost(p)} className="p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-pink-300 cursor-pointer shadow-sm">
                        <div className="flex justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white">{p.title}</h4>
                            <StatusBadge status={p.status} />
                        </div>
                    </div>
                ))}
                {activeTab === 'schedule' && (
                    <button onClick={() => onNavigate('create')} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:border-pink-500 hover:text-pink-600 transition-colors flex items-center justify-center gap-2">
                        <Plus size={20} /> Schedule New Post
                    </button>
                )}
             </div>
           )}
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
      if (activeTab === 'plan' && ideasSubView === 'planner') {
          return (
            <IdeasPlanner 
                onApproveIdea={handleApproveFromPlanner} 
                onSaveComplete={(date) => {
                    if(date) setCurrentDate(date);
                    setIdeasSubView('approved');
                }}
                onNavigate={onNavigate}
            />
          );
      }

      return (
        <div className="flex-1 overflow-y-auto p-6 relative">
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm min-h-[600px] glass-card">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="bg-slate-50 dark:bg-slate-800 p-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{day}</div>
                ))}
                {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} className="bg-white/50 dark:bg-slate-800/50" />)}
                {Array.from({ length: days }).map((_, i) => {
                    const dayNum = i + 1;
                    const dayPosts = getPostsForDay(dayNum);
                    const isToday = dayNum === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

                    return (
                        <div key={dayNum} onClick={() => handleDayClick(dayNum)} className={`bg-white dark:bg-slate-800 min-h-[140px] p-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group flex flex-col gap-2 ${isToday ? 'bg-pink-50/30 dark:bg-pink-900/20' : ''}`}>
                            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-pink-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{dayNum}</span>
                            <div className="flex flex-col gap-1.5">
                                {dayPosts.map(post => {
                                    const isSelected = selectedIdeaIds.has(post.id);
                                    const isIdeaMode = activeTab === 'plan';
                                    
                                    return (
                                        <div 
                                            key={post.id}
                                            onClick={(e) => handlePostClick(e, post)}
                                            className={`text-xs p-2 rounded-lg border shadow-sm transition-all flex flex-col gap-1 ${
                                                isIdeaMode
                                                ? (isSelected ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-400 ring-2 ring-purple-400 scale-[1.02]' : post.status === 'CREATED' ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 opacity-75' : 'bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 hover:border-purple-400 border-dashed')
                                                : (post.status === 'PUBLISHED' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600')
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                {isIdeaMode ? (
                                                    <div className="flex items-center gap-1.5">
                                                        {isSelected ? <CheckCircle size={10} className="text-purple-600" /> : <Lightbulb size={10} className="text-purple-400" />}
                                                        {post.status === 'CREATED' && <CheckCircle size={10} className="text-teal-600"/>}
                                                    </div>
                                                ) : (
                                                    <div className="flex -space-x-1">
                                                        {post.platforms.slice(0,2).map(p => <div key={p} className="bg-white dark:bg-slate-600 rounded-full p-0.5"><PlatformIcon p={p} size={8}/></div>)}
                                                    </div>
                                                )}
                                                {isSelected && <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />}
                                            </div>
                                            <span className={`font-semibold truncate leading-tight ${isIdeaMode ? 'text-purple-900 dark:text-purple-300' : 'text-slate-800 dark:text-white'}`}>
                                                {post.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {(selectedDay || selectedPost) && (
                <div className="fixed inset-0 bg-black/20 z-30" onClick={() => { setSelectedDay(null); setSelectedPost(null); }} />
            )}
            <DayDrawer />
        </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      
      {/* Header */}
      <div className="glass border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendar</h1>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <CCTooltip registryKey="calendar.tabs.schedule">
                    <button 
                        onClick={() => setActiveTab('schedule')}
                        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'schedule' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Schedule
                    </button>
                </CCTooltip>
                <CCTooltip registryKey="calendar.tabs.ideas">
                    <button 
                        onClick={() => setActiveTab('plan')}
                        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'plan' ? 'bg-white dark:bg-slate-600 shadow text-purple-700 dark:text-purple-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        <Lightbulb size={14} className={activeTab === 'plan' ? 'fill-purple-700 dark:fill-purple-300' : ''} />
                        Plan
                    </button>
                </CCTooltip>
            </div>
            
            {activeTab === 'plan' && (
                <div className="flex items-center gap-2 ml-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                     <button 
                        onClick={() => setIdeasSubView('planner')}
                        className={`text-xs font-bold px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${ideasSubView === 'planner' ? 'text-pink-600 bg-pink-50 dark:bg-pink-900/30' : 'text-slate-500 dark:text-slate-400'}`}
                     >
                         AI Planner
                     </button>
                     <button 
                        onClick={() => setIdeasSubView('approved')}
                        className={`text-xs font-bold px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${ideasSubView === 'approved' ? 'text-pink-600 bg-pink-50 dark:bg-pink-900/30' : 'text-slate-500 dark:text-slate-400'}`}
                     >
                         Approved Ideas
                     </button>
                </div>
            )}
            
            {(activeTab === 'schedule' || ideasSubView === 'approved') && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 ml-4">
                    <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"><ChevronLeft size={18}/></button>
                    <span className="px-4 font-medium text-sm w-32 text-center text-slate-800 dark:text-white">
                        {currentDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"><ChevronRight size={18}/></button>
                </div>
            )}
        </div>

        <div className="flex items-center gap-3">
             {activeTab === 'plan' && ideasSubView === 'approved' && (
                 <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSelectAllApproved}
                        className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                    >
                        {selectedIdeaIds.size > 0 ? `Deselect All (${selectedIdeaIds.size})` : 'Select All'}
                    </button>
                    
                    {selectedIdeaIds.size > 0 && (
                        <CCTooltip registryKey="calendar.bulk_create">
                            <button 
                                onClick={() => setShowBulkModal(true)}
                                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-100 animate-in zoom-in duration-200"
                            >
                                <Wand2 size={18} /> Bulk Create
                            </button>
                        </CCTooltip>
                    )}
                 </div>
             )}

            {(activeTab === 'schedule' || ideasSubView === 'approved') && (
                <div className="flex gap-2">
                    <CCTooltip registryKey="dashboard.view_report">
                        <button 
                            onClick={() => onNavigate('settings', { tab: 'reports', action: 'new', template: 'calendar_gaps' })}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-pink-600 transition-colors shadow-sm"
                        >
                            <BarChart size={16} /> Report
                        </button>
                    </CCTooltip>
                    <button 
                        onClick={() => setShowFilters(!showFilters)} 
                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 transition-colors shadow-sm"
                    >
                        <Filter size={16} className="text-slate-500" /> 
                        <span>Filters</span>
                    </button>
                </div>
            )}
        </div>
      </div>

      {renderMainContent()}
      
      <BulkCreateModal 
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedIdeas={posts.filter(p => selectedIdeaIds.has(p.id))}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
};

export default Calendar;
