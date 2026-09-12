"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, Clock, MapPin, Calendar, AlertCircle, XCircle, CheckCircle, ChevronRight } from "lucide-react";

interface UserBooking {
  id: string;
  bookingReference: string;
  status: string;
  totalSeats: number;
  totalCents: number;
  createdAt: string;
  showtime: {
    id: string;
    startTime: string;
    endTime: string;
    movie: {
      title: string;
      posterUrl: string;
      rating: string;
      durationMins: number;
    };
    cinema: {
      name: string;
      address: string;
      city: string;
    };
    auditorium: {
      name: string;
      screenType: string;
    };
  };
  seats: Array<{
    rowLabel: string;
    seatNumber: number;
    seatType: string;
  }>;
}

export default function ProfileBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PAST" | "CANCELLED">("ACTIVE");
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<UserBooking | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchBookings = () => {
    setIsLoading(true);
    fetch("/api/profile/bookings")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login?redirect=/profile/bookings");
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        setBookings(data.bookings || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [router]);

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingBookingId(bookingId);
    setCancelError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User requested self-service cancellation" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || "Failed to cancel booking");
        setCancellingBookingId(null);
        return;
      }

      setCancelModalBooking(null);
      setCancellingBookingId(null);
      fetchBookings();
    } catch (err: any) {
      setCancelError(err.message || "Failed to process cancellation");
      setCancellingBookingId(null);
    }
  };

  const now = new Date();

  const activeBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.showtime.startTime) >= now
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.showtime.startTime) < now
  );
  const cancelledBookings = bookings.filter(
    (b) => b.status === "CANCELLED" || b.status === "EXPIRED" || b.status === "REFUNDED"
  );

  const currentList =
    activeTab === "ACTIVE"
      ? activeBookings
      : activeTab === "PAST"
      ? pastBookings
      : cancelledBookings;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Ticket className="h-7 w-7 text-accent-cyan" />
          My Cinema Bookings
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          View your confirmed digital passes, receipts, and manage upcoming reservations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3">
        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ACTIVE"
              ? "bg-accent-cyan text-gray-950 shadow-glow-cyan"
              : "text-gray-400 hover:text-white hover:bg-surface-raised"
          }`}
        >
          Active Passes ({activeBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("PAST")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "PAST"
              ? "bg-accent-cyan text-gray-950 shadow-glow-cyan"
              : "text-gray-400 hover:text-white hover:bg-surface-raised"
          }`}
        >
          Past Screenings ({pastBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("CANCELLED")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "CANCELLED"
              ? "bg-accent-cyan text-gray-950 shadow-glow-cyan"
              : "text-gray-400 hover:text-white hover:bg-surface-raised"
          }`}
        >
          Cancelled & Expired ({cancelledBookings.length})
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-surface-raised/40 animate-pulse border border-surface-border" />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="rounded-2xl bg-surface border border-surface-border p-12 text-center space-y-3">
          <Ticket className="h-10 w-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            You don't have any bookings in this section. Browse upcoming movies and reserve your seats!
          </p>
          <Link
            href="/movies"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent-cyan px-4 py-2 text-xs font-bold text-gray-950 shadow-glow-cyan mt-2"
          >
            Explore Movies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((b) => {
            const showTime = new Date(b.showtime.startTime);
            const isEligibleForCancel =
              b.status === "CONFIRMED" &&
              showTime.getTime() - Date.now() > 2 * 60 * 60 * 1000;

            const seatLabels = b.seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(", ");

            return (
              <div
                key={b.id}
                className="rounded-2xl bg-surface border border-surface-border p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-surface-border/90 transition-all"
              >
                {/* Movie & Cinema Details */}
                <div className="flex gap-4">
                  <div className="relative aspect-[2/3] w-16 sm:w-20 shrink-0 rounded-xl overflow-hidden border border-surface-border bg-surface-raised">
                    <Image
                      src={b.showtime.movie.posterUrl}
                      alt={b.showtime.movie.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-accent-cyan">
                        REF: {b.bookingReference}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : b.status === "CANCELLED"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {b.showtime.movie.title}
                    </h3>

                    <p className="text-gray-300 font-medium">
                      {b.showtime.cinema.name} • <span className="text-accent-gold">{b.showtime.auditorium.name}</span>
                    </p>

                    <p className="text-gray-400">
                      {showTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at{" "}
                      <span className="text-white font-bold">
                        {showTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>

                    <p className="text-gray-400 pt-0.5">
                      Seats: <span className="font-mono font-bold text-white">{seatLabels}</span> ({b.totalSeats} tickets) • Total: ${(b.totalCents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                  <Link
                    href={`/tickets/${b.bookingReference}`}
                    className="flex items-center gap-1.5 rounded-xl bg-accent-cyan px-4 py-2 text-xs font-bold text-gray-950 shadow-glow-cyan hover:bg-cyan-300 transition-all"
                  >
                    <Ticket className="h-4 w-4" />
                    Digital Pass
                  </Link>

                  {isEligibleForCancel && (
                    <button
                      onClick={() => {
                        setCancelModalBooking(b);
                        setCancelError(null);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 hover:underline font-semibold"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal Confirmation */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-surface-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Cancellation</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to cancel booking{" "}
              <strong className="text-white font-mono">{cancelModalBooking.bookingReference}</strong> for{" "}
              <strong className="text-white">{cancelModalBooking.showtime.movie.title}</strong>?
            </p>

            <p className="text-[11px] text-gray-400">
              Your reserved seats will be immediately released back to the auditorium inventory, and your payment (${(cancelModalBooking.totalCents / 100).toFixed(2)}) will be recorded as refunded.
            </p>

            {cancelError && (
              <div className="rounded-xl bg-red-950/60 border border-red-800 p-3 text-xs text-red-300">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl bg-surface-raised border border-surface-border text-xs font-semibold text-gray-300 hover:text-white"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancellingBookingId !== null}
                onClick={() => handleCancelBooking(cancelModalBooking.id)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white disabled:opacity-50 transition-all cursor-pointer"
              >
                {cancellingBookingId ? "Cancelling..." : "Confirm & Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
