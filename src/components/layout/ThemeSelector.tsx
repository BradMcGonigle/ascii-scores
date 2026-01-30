"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme, type ThemePreference } from "./ThemeProvider";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string; fullLabel: string }[] =
  [
    { value: "system", label: "SYS", icon: "~", fullLabel: "System default" },
    { value: "light", label: "LGT", icon: "*", fullLabel: "Light theme" },
    { value: "dark", label: "DRK", icon: "#", fullLabel: "Dark theme" },
  ];

export function ThemeSelector() {
  const { preference, setPreference } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentOption =
    THEME_OPTIONS.find((opt) => opt.value === preference) ?? THEME_OPTIONS[0];
  const currentIndex = THEME_OPTIONS.findIndex((opt) => opt.value === preference);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  }, []);

  const selectOption = useCallback((option: typeof THEME_OPTIONS[0]) => {
    setPreference(option.value);
    closeDropdown();
  }, [setPreference, closeDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeDropdown]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          closeDropdown();
          break;
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev < THEME_OPTIONS.length - 1 ? prev + 1 : 0;
            optionRefs.current[next]?.focus();
            return next;
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : THEME_OPTIONS.length - 1;
            optionRefs.current[next]?.focus();
            return next;
          });
          break;
        case "Home":
          event.preventDefault();
          setFocusedIndex(0);
          optionRefs.current[0]?.focus();
          break;
        case "End":
          event.preventDefault();
          setFocusedIndex(THEME_OPTIONS.length - 1);
          optionRefs.current[THEME_OPTIONS.length - 1]?.focus();
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (focusedIndex >= 0) {
            selectOption(THEME_OPTIONS[focusedIndex]);
          }
          break;
        case "Tab":
          closeDropdown();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusedIndex, closeDropdown, selectOption]);

  // Focus first option when opening
  useEffect(() => {
    if (isOpen) {
      const initialIndex = currentIndex >= 0 ? currentIndex : 0;
      setFocusedIndex(initialIndex);
      // Small delay to ensure the dropdown is rendered
      requestAnimationFrame(() => {
        optionRefs.current[initialIndex]?.focus();
      });
    }
  }, [isOpen, currentIndex]);

  return (
    <div ref={dropdownRef} className="relative font-mono text-xs">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="flex items-center gap-1 text-terminal-muted hover:text-terminal-fg transition-colors px-2 py-1"
        aria-label={`Theme: ${currentOption.fullLabel}. Press Enter to change.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? "theme-listbox" : undefined}
      >
        <span className="text-terminal-border" aria-hidden="true">[</span>
        <span className="text-terminal-green" aria-hidden="true">{currentOption.icon}</span>
        <span>{currentOption.label}</span>
        <span className="text-terminal-border" aria-hidden="true">]</span>
      </button>

      {isOpen && (
        <div
          id="theme-listbox"
          className="absolute right-0 top-full mt-1 bg-terminal-bg border border-terminal-border z-50 min-w-[100px]"
          role="listbox"
          aria-label="Select theme"
          aria-activedescendant={focusedIndex >= 0 ? `theme-option-${THEME_OPTIONS[focusedIndex].value}` : undefined}
        >
          {THEME_OPTIONS.map((option, index) => {
            const isSelected = option.value === preference;
            const isFocused = index === focusedIndex;
            return (
              <button
                key={option.value}
                id={`theme-option-${option.value}`}
                ref={(el) => { optionRefs.current[index] = el; }}
                onClick={() => selectOption(option)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                  isSelected
                    ? "bg-terminal-fg text-terminal-bg"
                    : isFocused
                    ? "bg-terminal-border/50 text-terminal-fg"
                    : "text-terminal-muted hover:text-terminal-fg hover:bg-terminal-border/30"
                }`}
                role="option"
                aria-selected={isSelected}
                tabIndex={isFocused ? 0 : -1}
              >
                <span
                  className={isSelected ? "text-terminal-bg" : "text-terminal-green"}
                  aria-hidden="true"
                >
                  {option.icon}
                </span>
                <span>{option.fullLabel}</span>
                {isSelected && (
                  <span className="ml-auto text-terminal-bg" aria-hidden="true">*</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
