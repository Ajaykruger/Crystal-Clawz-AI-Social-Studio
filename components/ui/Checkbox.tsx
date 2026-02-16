
import React, { useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';

interface CCCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
}

export const CCCheckbox: React.FC<CCCheckboxProps> = ({ 
  label, 
  checked, 
  indeterminate, 
  disabled, 
  onChange, 
  className = '',
  ...props 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}>
      <div className="relative flex items-center justify-center w-[18px] h-[18px] shrink-0">
        <input 
          ref={inputRef}
          type="checkbox"
          className="peer appearance-none w-full h-full border border-gray-300 rounded bg-white checked:bg-green-500 checked:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all disabled:bg-gray-100 disabled:border-gray-200"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        {/* Icons are absolutely positioned over the input */}
        <div className={`absolute pointer-events-none text-white flex items-center justify-center transition-opacity duration-100 ${checked || indeterminate ? 'opacity-100' : 'opacity-0'}`}>
            {indeterminate ? <Minus size={14} strokeWidth={3} /> : <Check size={12} strokeWidth={3.5} />}
        </div>
      </div>
      {label && <span className="text-sm text-slate-700 select-none">{label}</span>}
    </label>
  );
};
