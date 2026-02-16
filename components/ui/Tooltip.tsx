
import React, { useState } from 'react';
import { TOOLTIP_REGISTRY, TooltipKey } from '../../services/tooltipService';

interface TooltipProps {
  content?: string;
  registryKey?: TooltipKey;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const CCTooltip: React.FC<TooltipProps> = ({ content, registryKey, children, placement: propPlacement, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  let text = content;
  let placement = propPlacement;

  if (registryKey && TOOLTIP_REGISTRY[registryKey]) {
      text = TOOLTIP_REGISTRY[registryKey].text;
      if (!propPlacement) {
          placement = TOOLTIP_REGISTRY[registryKey].placement as any;
      }
  }

  if (!text) return <>{children}</>;

  const getPositionClasses = () => {
      switch(placement) {
          case 'top': return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
          case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2';
          case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-2';
          case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-2';
          default: return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      }
  };

  const getArrowClasses = () => {
      switch(placement) {
          case 'top': return 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent';
          case 'bottom': return 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent';
          case 'left': return 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent';
          case 'right': return 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent';
          default: return '';
      }
  };

  return (
    <div 
        className={`relative inline-flex ${className}`} 
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        onTouchStart={() => setIsVisible(!isVisible)} // Mobile tap
    >
        {children}
        {isVisible && (
            <div className={`absolute z-50 w-max max-w-[200px] px-3 py-2 text-xs text-white bg-slate-900 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none ${getPositionClasses()}`}>
                {text}
                <div className={`absolute border-4 ${getArrowClasses()}`}></div>
            </div>
        )}
    </div>
  );
};
