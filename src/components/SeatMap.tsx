"use client";

import { useMemo } from "react";
import SeatItem, { SeatData } from "./SeatItem";
import { Sparkles, Crown, Star, Accessibility, Armchair } from "lucide-react";

interface SeatMapProps {
  seats: SeatData[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: SeatData) => void;
  disabled?: boolean;
}

export default function SeatMap({
  seats,
  selectedSeatIds,
  onToggleSeat,
  disabled,
}: SeatMapProps) {
  // Group seats by row
  const rows = useMemo(() => {
    const grouped: Record<string, SeatData[]> = {};
    for (const s of seats) {
      if (!grouped[s.rowLabel]) {
        grouped[s.rowLabel] = [];
      }
      grouped[s.rowLabel].push(s);
    }

    // Sort row keys (A, B, C...)
    return Object.keys(grouped)
      .sort()
      .map((rowLabel) => ({
        rowLabel,
        seats: grouped[rowLabel].sort((a, b) => a.seatNumber - b.seatNumber),
      }));
  }, [seats]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto rounded-3xl bg-surface border border-surface-border p-4 sm:p-8 shadow-2xl">
      {/* Screen Area with Curved Ambient Glow */}
      <div className="w-full max-w-2xl flex flex-col items-center mb-10">
        <div className="cinema-screen-curve w-full" />
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent-cyan/80 mt-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> All Eyes On Screen <Sparkles className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* Seat Grid Layout (Responsive horizontal scroll on mobile) */}
      <div className="w-full overflow-x-auto py-2 flex justify-center">
        <div className="min-w-fit flex flex-col gap-2.5 sm:gap-3">
          {rows.map(({ rowLabel, seats: rowSeats }) => (
            <div key={rowLabel} className="flex items-center gap-2 sm:gap-3 justify-center">
              {/* Left Row Identifier */}
              <span className="w-5 text-center text-xs font-bold text-gray-500 select-none">
                {rowLabel}
              </span>

              {/* Seats in this row */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {rowSeats.map((seat, index) => {
                  const isAisleGap = index === Math.floor(rowSeats.length / 2);
                  return (
                    <div key={seat.seatId} className="flex items-center">
                      {isAisleGap && <div className="w-4 sm:w-8" />}
                      <SeatItem
                        seat={seat}
                        isSelected={selectedSeatIds.includes(seat.seatId)}
                        onToggle={onToggleSeat}
                        disabled={disabled}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Right Row Identifier */}
              <span className="w-5 text-center text-xs font-bold text-gray-500 select-none">
                {rowLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend & Seat Types */}
      <div className="mt-8 pt-6 border-t border-surface-border/80 w-full flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-300">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-surface-raised border border-surface-border" />
          <span>Available</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-accent-cyan border border-cyan-300 shadow-glow-cyan" />
          <span className="font-semibold text-accent-cyan">Selected</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-amber-900/30 border border-amber-800" />
          <span>Held by Other</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-800/40 border border-gray-800 opacity-50" />
          <span>Booked</span>
        </div>

        <div className="flex items-center gap-1.5 text-amber-300">
          <Crown className="h-3.5 w-3.5" />
          <span>VIP ($22+)</span>
        </div>

        <div className="flex items-center gap-1.5 text-purple-300">
          <Star className="h-3.5 w-3.5" />
          <span>Recliner ($28+)</span>
        </div>

        <div className="flex items-center gap-1.5 text-blue-300">
          <Accessibility className="h-3.5 w-3.5" />
          <span>Accessible</span>
        </div>
      </div>
    </div>
  );
}
