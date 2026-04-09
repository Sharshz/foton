"use client";

import { useRef, useEffect } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search NFTs or collections...",
  autoFocus = false,
  className = "",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div
      className={`relative flex items-center ${className}`}
      style={{
        background: "#12121f",
        border: "1px solid #2a2a3e",
        borderRadius: "12px",
        transition: "border-color 0.2s",
      }}
    >
      {/* Search icon */}
      <span
        className="absolute left-3 text-sm pointer-events-none"
        style={{ color: "#a0a0c0" }}
      >
        🔍
      </span>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent pl-9 pr-9 py-2.5 text-sm outline-none placeholder:text-sm"
        style={{
          color: "#ffffff",
          caretColor: "#00d4ff",
        }}
        onFocus={(e) => {
          const parent = e.currentTarget.parentElement;
          if (parent) parent.style.borderColor = "#00d4ff55";
        }}
        onBlur={(e) => {
          const parent = e.currentTarget.parentElement;
          if (parent) parent.style.borderColor = "#2a2a3e";
        }}
      />

      {/* Clear button */}
      {value.length > 0 && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 flex items-center justify-center w-5 h-5 rounded-full text-xs transition-all active:scale-90"
          style={{ background: "#2a2a3e", color: "#a0a0c0" }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
