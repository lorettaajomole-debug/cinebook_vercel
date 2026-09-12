"use client";

import { Armchair, Accessibility, Crown, Star } from "lucide-react";

export interface SeatData {
  showtimeSeatId: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: "STANDARD" | "VIP" | "RECLINER" | "ACCESSIBLE";
  priceCents: number;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
  isHeldByMe?: boolean;
}

interface SeatItemProps {
  seat: SeatData;
  isSelected: boolean;
  onToggle: (seat: SeatData) => void;
  disabled?: boolean;
}

export default function SeatItem({ seat, isSelected, onToggle, disabled }: SeatItemProps) {
  const isAvailable = seat.status === "AVAILABLE" || (seat.status === "HELD" && seat.isHeldByMe);
  const isBooked = seat.status === "BOOKED";
  const isHeldByOther = seat.status === "HELD" && !seat.isHeldByMe;
  const isBlocked = seat.status === "BLOCKED";

  const isClickable = isAvailable && !disabled;

  // Visual appearance based on seat status and type
  let colorClasses = "bg-surface-raised border-surface-border text-gray-400 hover:border-accent-cyan/60 hover:text-white";

  if (isSelected) {
    colorClasses = "bg-accent-cyan border-cyan-300 text-gray-950 font-bold shadow-glow-cyan scale-110";
  } else if (isBooked) {
    colorClasses = "bg-gray-800/40 border-gray-800 text-gray-600 cursor-not-allowed opacity-40";
  } else if (isHeldByOther) {
    colorClasses = "bg-amber-900/30 border-amber-800 text-amber-500/60 cursor-not-allowed opacity-60";
  } else if (isBlocked) {
    colorClasses = "bg-red-950/20 border-red-900 text-red-700 cursor-not-allowed opacity-30";
  } else if (seat.seatType === "VIP") {
    colorClasses = "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20";
  } else if (seat.seatType === "RECLINER") {
    colorClasses = "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:border-purple-400 hover:bg-purple-500/20";
  } else if (seat.seatType === "ACCESSIBLE") {
    colorClasses = "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:border-blue-400 hover:bg-blue-500/20";
  }

  const getSeatIcon = () => {
    switch (seat.seatType) {
      case "VIP":
        return <Crown className="h-3 w-3" />;
      case "RECLINER":
        return <Star className="h-3 w-3" />;
      case "ACCESSIBLE":
        return <Accessibility className="h-3 w-3" />;
      default:
        return <Armchair className="h-3 w-3" />;
    }
  };

  const formattedPrice = `$${(seat.priceCents / 100).toFixed(2)}`;

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={() => onToggle(seat)}
      title={`Seat ${seat.rowLabel}${seat.seatNumber} (${seat.seatType}) - ${formattedPrice} [${seat.status}]`}
      className={`group relative flex h-9 w-9 sm:h-10 sm:w-10 flex-col items-center justify-center rounded-lg border text-[11px] font-medium transition-all duration-200 ${colorClasses}`}
    >
      <span className="leading-none text-[9px] font-bold">{seat.rowLabel}{seat.seatNumber}</span>
      <div className="mt-0.5">{getSeatIcon()}</div>

      {/* Hover tooltip for price */}
      {isClickable && (
        <div className="pointer-events-none absolute -top-8 z-30 hidden rounded bg-gray-900 px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:block whitespace-nowrap">
          {formattedPrice} • {seat.seatType}
        </div>
      )}
    </button>
  );
}
