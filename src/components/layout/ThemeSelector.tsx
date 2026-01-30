"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, type ThemePreference } from "./ThemeProvider";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] =
  [
    { value: "system", label: "SYS", icon: "~" },
    { value: "light", label: "LGT", icon: "*" },
    { value: "dark", label: "DRK", icon: "#" },
  ];

export function ThemeSelector() {
  const { preference, setPreference } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption =
    THEME_OPTIONS.find((opt) => opt.value === preference) ?? THEME_OPTIONS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div ref={dropdownRef} className="relative font-mono text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-terminal-muted hover:text-terminal-fg transition-colors px-2 py-1"
        aria-label={`Theme: ${currentOption.label}. Click to change.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-terminal-border">[</span>
        <span className="text-terminal-green">{currentOption.icon}</span>
        <span>{currentOption.label}</span>
        <span className="text-terminal-border">]</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 bg-terminal-bg border border-terminal-border z-50 min-w-[100px]"
          role="listbox"
          aria-label="Select theme"
        >
          {THEME_OPTIONS.map((option) => {
            const isSelected = option.value === preference;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setPreference(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                  isSelected
                    ? "bg-terminal-fg text-terminal-bg"
                    : "text-terminal-muted hover:text-terminal-fg hover:bg-terminal-border/30"
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span
                  className={isSelected ? "text-terminal-bg" : "text-terminal-green"}
                >
                  {option.icon}
                </span>
                <span>{option.label}</span>
                {isSelected && (
                  <span className="ml-auto text-terminal-bg">*</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
