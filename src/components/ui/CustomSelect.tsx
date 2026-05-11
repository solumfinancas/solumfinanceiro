import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Layers, CreditCard, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { IconRenderer } from './IconRenderer';

export interface SelectOption {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  logoUrl?: string;
  type?: string;
  parentId?: string;
  isHeader?: boolean;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: boolean;
  searchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Selecionar...",
  className,
  searchPlaceholder = "Buscar...",
  disabled = false,
  error = false,
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dropdownStyle = useMemo(() => {
    if (!buttonRect) return {};

    if (isMobile) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        width: '90vw',
        maxWidth: '400px',
        maxHeight: '80vh',
        zIndex: 9999,
      };
    }

    const openUp = (buttonRect.bottom + 350 > window.innerHeight) || (buttonRect.top > window.innerHeight * 0.6);
    
    // Ensure dropdown doesn't go off-screen on the right
    const dropdownWidth = 400; // Expected max width from maxWidth
    const left = Math.max(8, Math.min(buttonRect.left, window.innerWidth - dropdownWidth - 16));

    return {
      position: 'fixed' as const,
      top: openUp
        ? Math.max(8, buttonRect.top - Math.min(300, buttonRect.top - 20) - 8)
        : buttonRect.bottom + 8,
      left: left,
      minWidth: buttonRect.width,
      width: 'max-content',
      maxWidth: 'min(90vw, 400px)',
      maxHeight: openUp
        ? Math.min(300, buttonRect.top - 20)
        : Math.min(300, window.innerHeight - buttonRect.bottom - 20),
      zIndex: 9999,
    };
  }, [buttonRect, isMobile]);

  const selectedOption = useMemo(() => options.find(opt => opt.id === value), [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => 
      !opt.isHeader && 
      opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const updatePosition = () => {
    if (containerRef.current) {
      setButtonRect(containerRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (containerRef.current && containerRef.current.contains(target)) ||
        (dropdownRef.current && dropdownRef.current.contains(target))
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleScroll = (event: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      updatePosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const renderIcon = (option: SelectOption) => {
    const iconSource = option.logoUrl || option.icon;
    if (!iconSource) return null;

    return (
      <IconRenderer 
        icon={iconSource} 
        color={option.color || (option.type === 'credit_card' ? undefined : '#94a3b8')}
        size={36}
        className={cn(
          "shadow-sm shrink-0",
          isSelected(option.id) ? "border-2 border-white/20" : ""
        )}
      />
    );
  };

  const isSelected = (id: string | undefined) => id === value;

  // Dropdown Component to be portalized
  const DropdownContent = (
    <AnimatePresence>
      {isOpen && buttonRect && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] pointer-events-auto"
            />
          )}
          <motion.div
            ref={dropdownRef}
            initial={isMobile ? { opacity: 0, scale: 0.9, x: '-50%', y: '-50%' } : { opacity: 0, scale: 0.95 }}
            animate={isMobile ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' } : { opacity: 1, scale: 1 }}
            exit={isMobile ? { opacity: 0, scale: 0.9, x: '-50%', y: '-50%' } : { opacity: 0, scale: 0.95 }}
            style={dropdownStyle}
            className="bg-card border-2 border-primary/20 rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar backdrop-blur-md pointer-events-auto"
          >
            {searchable && (
              <div className="p-4 border-b border-border/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-border/20 rounded-xl text-xs outline-none focus:ring-1 ring-primary/20 transition-all font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="p-2 space-y-1">
              {filteredOptions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest">
                  Nenhum resultado
                </div>
              ) : (
                filteredOptions.map((option) => {
                  if (option.isHeader) {
                    return (
                      <div key={option.id} className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40 mt-3 mb-1">
                        {option.name}
                      </div>
                    );
                  }

                  const isSelectedOption = isSelected(option.id);
                  const isSub = !!option.parentId;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        onChange(option.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all text-left group",
                        isSelectedOption ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-primary/5 text-foreground",
                        isSub && "ml-4 border-l-2 border-muted/30 pl-4"
                      )}
                    >
                      {renderIcon(option)}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={cn(
                          "text-[11px] font-black uppercase tracking-tight leading-tight",
                          isSelectedOption ? "text-white" : "group-hover:text-primary"
                        )}>
                          {isSub && <span className="mr-1 opacity-50">↳</span>}
                          {option.name}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          updatePosition();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 bg-background border-2 rounded-2xl transition-all text-left outline-none font-bold text-sm appearance-none min-h-[64px]",
          isOpen ? "border-primary ring-2 ring-primary/10" : "border-muted hover:border-primary/50",
          error && "border-rose-500/50",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedOption ? (
            <>
              {renderIcon(selectedOption)}
              <span className="uppercase tracking-tight text-[11px] leading-tight flex-1">
                {selectedOption.name}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground/60 uppercase tracking-widest text-[11px] flex-1">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={18} className={cn("transition-transform duration-300 shrink-0 opacity-50", isOpen && "rotate-180")} />
      </button>

      {isOpen && createPortal(DropdownContent, document.body)}
    </div>
  );
};
