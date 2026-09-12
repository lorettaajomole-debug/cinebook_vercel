"use client";

import { useEffect, useState } from "react";
import { Timer, AlertTriangle } from "lucide-react";

interface HoldCountdownProps {
  expiresAt: string | Date;
  onExpire?: () => void;
}

export default function HoldCountdown({ expiresAt, onExpire }: HoldCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; totalSecs: number }>({
    minutes: 10,
    seconds: 0,
    totalSecs: 600,
  });

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, totalSecs: 0 });
        if (onExpire) onExpire();
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSecs / 60);
      const seconds = totalSecs % 60;
      setTimeLeft({ minutes, seconds, totalSecs });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const isUrgent = timeLeft.totalSecs < 120 && timeLeft.totalSecs > 0;
  const isExpired = timeLeft.totalSecs <= 0;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all ${
        isExpired
          ? "bg-red-950/40 border-red-800 text-red-400"
          : isUrgent
          ? "bg-amber-950/40 border-amber-500/50 text-amber-300 animate-pulse"
          : "bg-surface-raised border-surface-border text-accent-cyan"
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="h-4 w-4 text-amber-400" />
      ) : (
        <Timer className="h-4 w-4" />
      )}
      <span>
        {isExpired ? (
          "Hold Expired"
        ) : (
          <>
            Seats Held:{" "}
            <span className="font-mono text-sm font-bold">
              {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </>
        )}
      </span>
    </div>
  );
}
