// src/components/ui/Dropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export const Dropdown = ({ 
  label, 
  options, 
  onSelect, 
  className = '',
  variant = 'default',
  icon: Icon,
  size = 'md',
  disabled = false,
  fullWidth = true
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const variants = {
    default: 'bg-[#1B1B28] border-[#2A2A3D] text-white hover:border-[#0082FB]/30',
    primary: 'bg-gradient-to-r from-[#0082FB] to-[#0064EO] text-white border-transparent hover:from-[#0070E0] hover:to-[#0055CC]',
    outline: 'bg-transparent border-[#2A2A3D] text-[#A0A0B8] hover:border-[#0082FB] hover:text-white'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-base rounded-xl',
    lg: 'px-4 py-3.5 text-lg rounded-xl'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-auto'} ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`
          w-full border flex items-center justify-between transition-all duration-200
          ${variants[variant]} ${sizes[size]} 
          ${open ? 'ring-2 ring-[#0082FB]/20 border-[#0082FB]' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center space-x-2 truncate">
          {Icon && <Icon className={`${iconSizes[size]} flex-shrink-0`} />}
          <span className="truncate">{label}</span>
        </div>
        <ChevronDown 
          className={`${iconSizes[size]} flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {open && (
        <div className="absolute z-50 w-full mt-2 bg-[#1B1B28] border border-[#2A2A3D] rounded-xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in-0 zoom-in-95">
          <ul className="max-h-60 overflow-y-auto">
            {options.map((opt, idx) => (
              <li 
                key={idx} 
                className="px-4 py-3 hover:bg-[#0D0D14] cursor-pointer text-white border-b border-[#2A2A3D] last:border-b-0 
                           transition-all duration-200 first:rounded-t-xl last:rounded-b-xl active:scale-[0.98]"
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
              >
                <div className="flex items-center space-x-2">
                  {opt.icon && <opt.icon className={`${iconSizes[size]} text-[#0082FB]`} />}
                  <span className="flex-1">{opt.label || opt}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;