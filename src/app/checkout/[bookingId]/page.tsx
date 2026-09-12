"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, MapPin, Clock, Ticket, AlertCircle, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import HoldCountdown from "@/components/HoldCountdown";
import PaymentForm from "@/components/PaymentForm";

interface BookingDetail {
  id: string;
  bookingReference: string;
  status: string;
  totalSeats: number;
  subtotalCents: number;
  bookingFeeCents: number;
  taxCents: number;
  totalCents: number;
  expiresAt: string;
  showtime: {
    id: string;
    startTime: string;
    endTime: string;
    movie: {
      id: string;
      title: string;
      slug: string;
      posterUrl: string;
      rating: string;
      durationMins: number;
    };
    cinema: {
      name: string;
      address: string;
      city: string;
      state: string;
    };
    auditorium: {
      name: string;
      screenType: string;
      soundSystem: string;
    };
  };
  items: Array<{
    id: string;
    seatId: string;
    rowLabel: string;
    seatNumber: number;
    seatType: string;
    priceCents: number;
  }>;
}

export default function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.bookingId;
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => {
        if (res.status === 401) {
          router.push(`/login?redirect=/checkout/${bookingId}`);
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        if (data.booking) {
          setBooking(data.booking);
          if (data.booking.status === "CONFIRMED") {
            router.push(`/tickets/${data.booking.bookingReference}`);
          } else if (new Date(data.booking.expiresAt) < new Date() || data.booking.status === "EXPIRED") {
            setIsExpired(true);
          }
        } else {
          setErrorMessage(data.error || "Booking not found");
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.message !== "Unauthorized") {
          setErrorMessage("Failed to load checkout details");
          setIsLoading(false);
        }
      });
  }, [bookingId, router]);

  const handlePaymentSuccess = (result: { bookingReference: string }) => {
    router.push(`/tickets/${result.bookingReference}`);
  };

  const handlePaymentError = (msg: string) => {
    setErrorMessage(msg);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <div className="h-96 rounded-3xl bg-surface-raised/40 animate-pulse" />
      </div>
    );
  }

  if (!booking || errorMessage) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <div className="rounded-2xl bg-surface border border-surface-border p-8">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-white">Booking Unavailable</h1>
          <p className="text-xs text-red-300 mt-2">{errorMessage || "This reservation could not be found."}</p>
          <Link
            href="/movies"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent-cyan px-5 py-2.5 text-xs font-bold text-gray-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Other Movies
          </Link>
        </div>
      </div>
    );
  }

  const showDate = new Date(booking.showtime.startTime);
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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Checkout Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Ticket className="h-6 w-6 text-accent-cyan" />
            Complete Your Reservation
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Review order details and process payment to generate your digital tickets.
          </p>
        </div>

        {/* Hold Expiry Countdown Timer */}
        {!isExpired && (
          <HoldCountdown
            expiresAt={booking.expiresAt}
            onExpire={() => setIsExpired(true)}
          />
        )}
      </div>

      {isExpired && (
        <div className="rounded-2xl bg-red-950/60 border border-red-800 p-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Seat Hold Expired</h2>
          <p className="text-xs text-red-300 max-w-md mx-auto">
            Your 10-minute reservation window has expired. The seats have been released back to other cinema guests.
          </p>
          <Link
            href={`/showtimes/${booking.showtime.id}/seats`}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-cyan px-5 py-2.5 text-xs font-bold text-gray-950 shadow-glow-cyan"
          >
            <RefreshCw className="h-4 w-4" />
            Re-Select Seats
          </Link>
        </div>
      )}

      {/* Main Checkout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Summary Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl bg-surface border border-surface-border p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                Screening Summary
              </h2>
              <span className="font-mono text-xs text-accent-cyan font-bold">
                REF: {booking.bookingReference}
              </span>
            </div>

            {/* Movie Info */}
            <div className="flex gap-4">
              <div className="relative aspect-[2/3] w-20 shrink-0 rounded-xl overflow-hidden border border-surface-border bg-surface-raised">
                <Image
                  src={booking.showtime.movie.posterUrl}
                  alt={booking.showtime.movie.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-1 text-xs">
                <h3 className="text-base font-bold text-white">
                  {booking.showtime.movie.title}
                </h3>
                <p className="text-accent-gold font-semibold">
                  {booking.showtime.auditorium.name} ({booking.showtime.auditorium.screenType})
                </p>
                <p className="text-gray-400">
                  {booking.showtime.cinema.name}
                </p>
                <p className="text-gray-400">
                  {formattedDate} • <span className="text-white font-bold">{formattedTime}</span>
                </p>
              </div>
            </div>

            {/* Reserved Seats List */}
            <div className="pt-4 border-t border-surface-border space-y-2">
              <span className="text-xs font-bold text-gray-300 block">
                Reserved Seats ({booking.items.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {booking.items.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-surface-raised border border-surface-border px-2.5 py-1 text-xs font-mono font-bold text-accent-cyan"
                  >
                    {item.rowLabel}{item.seatNumber}
                    <span className="text-[10px] text-gray-400 font-normal capitalize">
                      ({item.seatType.toLowerCase()})
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="pt-4 border-t border-surface-border space-y-2.5 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Seats Subtotal ({booking.items.length} tickets)</span>
                <span className="font-mono">${(booking.subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Booking Fee (Flat)</span>
                <span className="font-mono">${(booking.bookingFeeCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span className="font-mono">${(booking.taxCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-surface-border text-base font-extrabold text-white">
                <span>Total Amount Due</span>
                <span className="font-mono text-accent-cyan text-lg">
                  ${(booking.totalCents / 100).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Form */}
        <div className="lg:col-span-6">
          <PaymentForm
            bookingId={booking.id}
            totalCents={booking.totalCents}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            disabled={isExpired}
          />
        </div>
      </div>
    </div>
  );
}
