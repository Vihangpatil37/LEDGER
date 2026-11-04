import * as React from "react";

/**
 * Loading skeleton adhering to Section 7.5:
 * "skeleton made of ruled rows, no shimmer animation"
 * Strictly NO pulse, NO shimmer, NO animations.
 */
export default function AppLoading() {
  return (
    <div className="w-full flex flex-col gap-6" aria-busy="true" aria-label="Loading page content">
      {/* Title skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-7 w-40 bg-[var(--rule)]/60 rounded-[var(--radius-chip)]" />
        <div className="h-4 w-64 bg-[var(--rule)]/30 rounded-[var(--radius-chip)]" />
      </div>

      {/* Two action button skeletons */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 bg-[var(--rule)]/40 rounded-[var(--radius-control)]" />
        <div className="h-14 bg-[var(--rule)]/40 rounded-[var(--radius-control)]" />
      </div>

      {/* Ruled rows skeleton container */}
      <div className="bg-[var(--sheet)] border border-[var(--rule)] flex flex-col">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="ruled-row min-h-[56px] px-4 py-3 flex items-center justify-between"
          >
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-32 bg-[var(--rule)]/60 rounded-[var(--radius-chip)]" />
              <div className="h-3 w-20 bg-[var(--rule)]/30 rounded-[var(--radius-chip)]" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="h-4 w-20 bg-[var(--rule)]/60 rounded-[var(--radius-chip)]" />
              <div className="h-3 w-16 bg-[var(--rule)]/30 rounded-[var(--radius-chip)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
