"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, MapPin, Clock, Ticket, AlertCircle, ArrowRight, Sparkles, Shield, User } from "lucide-react";
import SeatMap from "@/components/SeatMap";
import { SeatData } from "@/components/SeatItem";

interface ShowtimeSeatPayload {
  showtime: {
    id: string;
    startTime: string;
    endTime: string;
    priceMultiplier: string;
    status: string;
    movie: {
      id: string;
      title: string;
      slug: string;
      posterUrl: string;
      durationMins: number;
      rating: string;
      language: string;
    };
    cinema: {
      id: string;
      name: string;
      address: string;
      city: string;
    };
    auditorium: {
      id: string;
      name: string;
      soundSystem: string;
      screenType: string;
      totalRows: number;
      totalCols: number;
      totalSeats: number;
    };
  };
  seats: SeatData[];
}

export default function SeatSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const showtimeId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<ShowtimeSeatPayload | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);

  const fetchShowtimeSeats = () => {
    setIsLoading(true);
    fetch(`/api/showtimes/${showtimeId}/seats`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.showtime) {
          setData(resData);
        } else {
          setErrorMessage(resData.error || "Failed to load showtime");
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setErrorMessage("Network error loading seat layout");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchShowtimeSeats();
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((d) => setUser(d.user || null))
      .catch(() => {});
  }, [showtimeId]);

  const handleToggleSeat = (seat: SeatData) => {
    setErrorMessage(null);
    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.seatId));
    } else {
      if (selectedSeatIds.length >= 10) {
        setErrorMessage("Maximum 10 seats allowed per booking");
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.seatId]);
    }
  };

  // Compute live price breakdown for selected seats
  const selectedSeats = data?.seats.filter((s) => selectedSeatIds.includes(s.seatId)) || [];
  const subtotalCents = selectedSeats.reduce((sum, s) => sum + s.priceCents, 0);
  const bookingFeeCents = selectedSeats.length > 0 ? 150 : 0; // $1.50 per order
  const taxCents = selectedSeats.length > 0 ? Math.round((subtotalCents + bookingFeeCents) * 0.08) : 0;
  const totalCents = subtotalCents + bookingFeeCents + taxCents;

  const handleProceedToCheckout = async () => {
    if (selectedSeatIds.length === 0) {
      setErrorMessage("Please select at least one seat to proceed");
      return;
    }

    if (!user) {
      // Prompt user to sign in, preserving destination
      router.push(`/login?redirect=/showtimes/${showtimeId}/seats`);
      return;
    }

    setIsHolding(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId,
          seatIds: selectedSeatIds,
        }),
      });

      const holdData = await res.json();

      if (!res.ok) {
        setErrorMessage(holdData.error || "Failed to reserve selected seats");
        setIsHolding(false);
        // Refresh seats in case another user took them
        fetchShowtimeSeats();
        return;
      }

      // Success: Navigate to checkout with 10-minute hold active
      router.push(`/checkout/${holdData.bookingId}`);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
      setIsHolding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-4">
        <div className="h-96 rounded-3xl bg-surface-raised/40 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Showtime Unavailable</h1>
        <p className="text-xs text-red-400 mt-2">{errorMessage}</p>
        <Link href="/movies" className="mt-4 inline-block text-accent-cyan underline text-sm">
          Return to Movies
        </Link>
      </div>
    );
  }

  const showDate = new Date(data.showtime.startTime);
  const formattedDate = showDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = showDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Showtime Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-surface border border-surface-border p-4 sm:p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative aspect-[2/3] w-14 shrink-0 rounded-lg overflow-hidden border border-surface-border">
            <Image src={data.showtime.movie.posterUrl} alt={data.showtime.movie.title} fill className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-accent-gold bg-black/60 px-1.5 py-0.5 rounded border border-surface-border">
                {data.showtime.movie.rating}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold">{data.showtime.movie.language}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
              {data.showtime.movie.title}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {data.showtime.cinema.name} • <span className="text-accent-cyan font-bold">{data.showtime.auditorium.name}</span> ({data.showtime.auditorium.screenType})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-surface-border pt-3 md:pt-0 md:pl-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Screening</span>
            <span className="font-mono text-sm font-bold text-white">{formattedDate}</span>
            <span className="font-mono text-sm font-bold text-accent-gold block">{formattedTime}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl bg-red-950/60 border border-red-800 p-4 text-xs text-red-300 shadow-lg">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Layout: Seat Map on Left/Center, Live Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Seat Map */}
        <div className="lg:col-span-8 flex justify-center">
          <SeatMap
            seats={data.seats}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
            disabled={isHolding}
          />
        </div>

        {/* Live Order Summary Side Panel */}
        <div className="lg:col-span-4 rounded-2xl bg-surface border border-surface-border p-5 sm:p-6 shadow-2xl space-y-6 sticky top-24">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Ticket className="h-4 w-4 text-accent-cyan" />
              Selected Seats ({selectedSeats.length})
            </h3>
            <span className="text-[11px] font-mono text-gray-400">Max 10</span>
          </div>

          {selectedSeats.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              Click on available seats on the map to reserve them.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {selectedSeats.map((s) => (
                  <span
                    key={s.seatId}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent-cyan/15 border border-accent-cyan/40 px-2.5 py-1 text-xs font-bold text-accent-cyan"
                  >
                    {s.rowLabel}{s.seatNumber}
                    <span className="text-[10px] text-gray-300 font-normal">
                      (${(s.priceCents / 100).toFixed(2)})
                    </span>
                  </span>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-4 border-t border-surface-border text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Tickets Subtotal</span>
                  <span className="font-mono">${(subtotalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Booking Fee (flat)</span>
                  <span className="font-mono">${(bookingFeeCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-mono">${(taxCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-surface-border/60 text-sm font-bold text-white">
                  <span>Total Amount</span>
                  <span className="font-mono text-accent-cyan text-base">
                    ${(totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action CTA */}
          <button
            onClick={handleProceedToCheckout}
            disabled={selectedSeats.length === 0 || isHolding}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-600 py-3.5 text-sm font-bold text-gray-950 shadow-glow-cyan hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer"
          >
            {isHolding ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                Securing 10-Min Hold...
              </span>
            ) : (
              <>
                Hold Seats & Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {!user && selectedSeats.length > 0 && (
            <p className="text-[11px] text-amber-400 text-center">
              * You will be prompted to sign in before holding seats
            </p>
          )}

          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 pt-1">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>Seats are locked for 10 minutes upon checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
