"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string;
  icon?: ReactNode;
}

interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  prefixIcon?: ReactNode;
  labelPrefix?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
  disabled?: boolean;
  renderTrigger?: (selectedOption: DropdownOption | undefined, isOpen: boolean) => ReactNode;
}

export default function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = "Select...",
  prefixIcon,
  labelPrefix,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  align = "left",
  disabled = false,
  renderTrigger,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {renderTrigger ? (
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {renderTrigger(selectedOption, isOpen)}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-semibold cursor-pointer select-none ${
            isOpen
              ? "border-[#0070f3] ring-2 ring-[#0070f3]/15 bg-white text-slate-900 shadow-sm"
              : "border-slate-200 bg-slate-50 hover:bg-white text-slate-700"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${triggerClassName}`}
        >
          {prefixIcon && <span className="flex-shrink-0 text-slate-500">{prefixIcon}</span>}
          {labelPrefix && <span className="text-slate-500 font-semibold">{labelPrefix}</span>}
          <span className="font-bold text-slate-900 truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-auto ${
              isOpen ? "rotate-180 text-[#0070f3]" : ""
            }`}
          />
        </button>
      )}

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 min-w-[180px] max-h-64 overflow-y-auto rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 py-1.5 animate-in fade-in-0 zoom-in-95 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          } ${menuClassName}`}
        >
          {options.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-slate-400 italic text-center">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-[calc(100%-12px)] mx-1.5 px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/80 text-[#0070f3] font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100/70 text-[#0070f3]">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#0070f3] flex-shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
