
import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, PlusCircle, Calendar, Library, Menu } from 'lucide-react';

interface MobileNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onToggleMenu: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onChangeView, onToggleMenu }) => {
  const mainItems = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={24} /> },
    { id: 'create', label: 'Create', icon: <PlusCircle size={28} />, isPrimary: true },
    { id: 'calendar', label: 'Plan', icon: <Calendar size={24} /> },
    { id: 'library', label: 'Library', icon: <Library size={24} /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        {mainItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id as ViewState)}
            className={`flex flex-col items-center justify-center w-full h-full cursor-pointer active:scale-95 transition-transform ${
              item.isPrimary ? '-mt-8' : ''
            }`}
            aria-label={item.label}
          >
            {item.isPrimary ? (
              <div className="w-14 h-14 bg-pink-600 rounded-full shadow-lg shadow-pink-200 dark:shadow-none flex items-center justify-center text-white ring-4 ring-white dark:ring-gray-800">
                {item.icon}
              </div>
            ) : (
              <div className={`${currentView === item.id ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {item.icon}
              </div>
            )}
          </button>
        ))}
        
        <button 
          onClick={onToggleMenu}
          className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer active:scale-95 transition-transform"
          aria-label="Menu"
        >
           <Menu size={24} />
        </button>
      </div>
    </div>
  );
};

export default MobileNav;
