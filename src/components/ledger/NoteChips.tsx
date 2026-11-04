"use client";

import React from "react";
import { cn } from "@/components/ui/utils";

export const DEFAULT_NOTE_CHIPS = [
  "Chai",
  "Cold drink",
  "Cigarette",
  "Paan",
  "General",
] as const;

export interface NoteChipsProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  chips?: readonly string[];
}

/**
 * NoteChips component adhering strictly to Section 7.6.2 & 7.7:
 * - Quick chips: Chai, Cold drink, Cigarette, Paan, General.
 * - Tapping an inactive chip sets the note to that text.
 * - Tapping the currently active chip clears it.
 * - 44px height per chip, radius --radius-chip: 6px.
 */
export function NoteChips({
  value,
  onChange,
  disabled = false,
  className,
  chips = DEFAULT_NOTE_CHIPS,
}: NoteChipsProps) {
  const handleChipClick = (chip: string) => {
    if (disabled) return;
    if (value.trim() === chip) {
      onChange("");
    } else {
      onChange(chip);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {chips.map((chip) => {
        const isActive = value.trim() === chip;
        return (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => handleChipClick(chip)}
            className={cn(
              "min-h-[44px] h-11 px-3.5 flex items-center justify-center rounded-[var(--radius-chip)] border text-[14px] font-bold transition-all duration-100 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none",
              isActive
                ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-sm"
                : "bg-[var(--sheet)] text-[var(--ink)] border-[var(--rule)] hover:bg-[var(--paper)]"
            )}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );
}
