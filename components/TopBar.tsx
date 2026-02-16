
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, MessageCircle, Check, Trash2, CheckCircle, AlertTriangle, Info, Menu, Sun, Moon } from 'lucide-react';
import { ViewState, Notification } from '../types';

interface TopBarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onToggleChat: () => void;
  onToggleMenu: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ currentView, onNavigate, onToggleChat, onToggleMenu, theme, onToggleTheme }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
      { id: '1', title: 'Post Published', message: 'Your "Summer Trends" reel is now live on Instagram.', time: '2 mins ago', read: false, type: 'success' },
      { id: '2', title: 'Asset Generated', message: '3 new image variations are ready for review.', time: '1 hour ago', read: false, type: 'info' },
      { id: '3', title: 'Connection Issue', message: 'Facebook token expired. Please reconnect in settings.', time: '5 hours ago', read: true, type: 'warning' },
  ]);
  
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'success': return <CheckCircle size={16} className="text-green-500" />;
          case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
          case 'error': return <AlertTriangle size={16} className="text-red-500" />;
          default: return <Info size={16} className="text-blue-500" />;
      }
  };

  const getBreadcrumbs = () => {
    switch(currentView) {
        case 'dashboard': return 'Dashboard';
        case 'create': return 'Create';
        case 'engine': return 'Engine';
        case 'workbench': return 'Create / Workbench';
        case 'review': return 'Review';
        case 'drafts': return 'Drafts';
        case 'calendar': return 'Calendar';
        case 'library': return 'Library';
        case 'settings': return 'Settings';
        default: return 'Workspace';
    }
  };

  return (
    <header className="h-16 glass sticky top-0 z-30 flex items-center justify-between px-6 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMenu}
          className="md:hidden p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu size={24} />
        </button>
        <div className="md:hidden font-extrabold text-pink-600 tracking-tight">Crystal Clawz</div>
        <div className="hidden md:flex items-center text-sm text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 pl-4 ml-4">
          <span className="font-semibold text-gray-900 dark:text-white mr-2">Crystal Clawz Social Studio</span>
          <span className="text-gray-400">/</span>
          <span className="ml-2 font-medium">{getBreadcrumbs()}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        {onToggleTheme && (
          <button 
            onClick={onToggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        <button 
            onClick={() => onNavigate('create')}
            className="hidden sm:block btn-primary px-5 py-2 rounded-lg text-sm"
        >
          Create
        </button>
        
        <button 
            onClick={onToggleChat}
            className="flex items-center gap-2 bg-pink-50 dark:bg-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-900/50 text-pink-700 dark:text-pink-300 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
        >
            <MessageCircle size={18} />
            <span className="hidden md:inline">AI Assistant</span>
        </button>

        <div className="relative" ref={notificationRef}>
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full relative transition-colors ${showNotifications ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
            >
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>}
            </button>

            {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-800 dark:text-white text-sm">Notifications</h3>
                        <div className="flex gap-1">
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors" title="Mark all read">
                                    <Check size={14} />
                                </button>
                            )}
                            <button onClick={clearNotifications} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors" title="Clear all">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                {notifications.map(n => (
                                    <div key={n.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${n.read ? 'opacity-60' : 'bg-pink-50/30'}`}>
                                        <div className="flex gap-3">
                                            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                n.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                                                n.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                                n.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                                                'bg-blue-100 dark:bg-blue-900/30'
                                            }`}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className={`text-sm font-bold ${n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{n.title}</h4>
                                                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0 mt-1.5"></span>}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{n.message}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium">{n.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
