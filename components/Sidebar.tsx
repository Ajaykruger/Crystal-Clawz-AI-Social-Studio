
import React, { useState } from 'react';
import { ViewState, User } from '../types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Calendar, 
  Library, 
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  MessageSquareQuote,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen?: boolean;
  onClose?: () => void;
  draftCount?: number;
  reviewCount?: number;
  user?: User;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose, draftCount, reviewCount, user }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Navigation items with hierarchy
  const menuItems: { id: ViewState; label: string; icon: React.ReactNode; isChild?: boolean; badge?: string; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> },
    { id: 'synopsis', label: 'Studio Synopsis', icon: <Sparkles size={24} />, badge: 'AI' },
    { id: 'create', label: 'Create', icon: <PlusCircle size={24} /> },
    { id: 'drafts', label: 'Drafts', icon: <FileText size={20} />, isChild: true, count: draftCount },
    { id: 'review', label: 'In Review', icon: <CheckCircle size={20} />, isChild: true, count: reviewCount },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={24} /> },
    { id: 'library', label: 'Library', icon: <Library size={24} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={24} /> },
    { id: 'social-suite', label: 'Inbox', icon: <MessageSquareQuote size={24} />, badge: 'Phase 2' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50 md:z-auto transition-all duration-300 glass-sidebar flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-56'}
        w-64 md:w-56 pb-24 md:pb-0
      `}>
        {/* Toggle Button (Desktop Only) */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-8 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-pink-600 rounded-full p-1.5 shadow-sm z-50 items-center justify-center transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
        >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center h-20">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
              {/* CSS-Based Reliable Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200/50 dark:shadow-none text-white font-black text-xl shrink-0">
                  C
              </div>
              <span className={`font-extrabold text-gray-800 dark:text-white tracking-tight transition-all duration-300 overflow-hidden whitespace-nowrap leading-tight ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  Crystal Clawz<br/>
                  <span className="text-xs font-medium text-pink-600 dark:text-pink-400">Social Studio</span>
              </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                <X size={20} />
            </button>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 flex flex-col space-y-1 px-3 scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all relative group 
              ${currentView === item.id
                  ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'} 
              ${isCollapsed ? 'justify-center w-full' : 'w-full'}
              ${item.isChild && !isCollapsed ? 'ml-4 w-[calc(100%-1rem)] text-xs py-2.5' : 'text-sm'}
              `}
            >
              <div className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${item.isChild && !isCollapsed ? 'opacity-80' : ''}`}>{item.icon}</div>
              
              <div className={`flex flex-1 items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 absolute left-full' : 'w-auto opacity-100'}`}>
                  <span>{item.label}</span>
                  {item.badge && !isCollapsed && (
                      <span className="text-[9px] bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter shadow-sm animate-pulse">
                          {item.badge}
                      </span>
                  )}
                  {/* Dynamic Count Badge */}
                  {typeof item.count === 'number' && item.count > 0 && !isCollapsed && (
                      <span className="ml-auto bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                          {item.count}
                      </span>
                  )}
              </div>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg animate-in fade-in slide-in-from-left-2">
                      {item.label} {item.badge ? `(${item.badge})` : ''} {typeof item.count === 'number' && item.count > 0 ? `(${item.count})` : ''}
                  </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                        {user?.name.charAt(0) || 'U'}
                    </div>
                )}
            </div>
            <div className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{user?.name || 'User'}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-1.5 py-0.5 rounded w-fit font-semibold capitalize">{user?.role || 'Guest'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
