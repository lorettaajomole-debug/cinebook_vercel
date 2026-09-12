"use client";

import Image from "next/image";
import Link from "next/link";
import { Printer, Calendar, CheckCircle2, Ticket as TicketIcon, MapPin, Clock, Film } from "lucide-react";

interface TicketCardProps {
  booking: {
    bookingReference: string;
    totalCents: number;
    showtime: {
      startTime: string | Date;
      endTime: string | Date;
      movie: {
        title: string;
        posterUrl: string;
        rating: string;
        durationMins: number;
        language: string;
      };
      cinema: {
        name: string;
        address: string;
        city: string;
        state: string;
        postalCode?: string;
      };
      auditorium: {
        name: string;
        screenType: string;
        soundSystem: string;
      };
    };
    seats: Array<{
      rowLabel: string;
      seatNumber: number;
      seatType: string;
    }>;
    ticket: {
      ticketCode: string;
      qrDataUrl: string;
      isUsed: boolean;
    } | null;
  };
}

export default function TicketCard({ booking }: TicketCardProps) {
  const showDate = new Date(booking.showtime.startTime);
  const formattedDate = showDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = showDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const seatLabels = booking.seats
    .map((s) => `${s.rowLabel}${s.seatNumber}`)
    .join(", ");

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCalendar = () => {
    const startIso = new Date(booking.showtime.startTime)
      .toISOString()
      .replace(/-|:|\.\d+/g, "");
    const endIso = new Date(booking.showtime.endTime)
      .toISOString()
      .replace(/-|:|\.\d+/g, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CineBook//Cinema Ticket//EN",
      "BEGIN:VEVENT",
      `SUMMARY:Movie: ${booking.showtime.movie.title}`,
      `DESCRIPTION:Booking Ref: ${booking.bookingReference} | Seats: ${seatLabels} | Auditorium: ${booking.showtime.auditorium.name}`,
      `LOCATION:${booking.showtime.cinema.name}, ${booking.showtime.cinema.address}, ${booking.showtime.cinema.city}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `cinebook-${booking.bookingReference}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Confirmation Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-emerald-950/40 border border-emerald-800/80 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Booking Confirmed!</h2>
            <p className="text-xs text-emerald-400/90">
              Your digital ticket is ready. Present this QR code at the cinema entrance.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-block font-mono text-xs font-bold text-emerald-300 bg-emerald-900/40 px-3 py-1 rounded-lg border border-emerald-700/50">
          REF: {booking.bookingReference}
        </span>
      </div>

      {/* Printable Digital Boarding-Pass Ticket */}
      <div
        id="printable-ticket"
        className="relative rounded-3xl bg-surface border border-surface-border overflow-hidden shadow-2xl flex flex-col md:flex-row"
      >
        {/* Left Side: Movie Artwork & Core Details */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent-cyan">
                <Film className="h-4 w-4" /> CineBook Pass
              </span>
              <span className="rounded-md bg-surface-raised border border-surface-border px-2 py-0.5 text-[11px] font-bold text-accent-gold">
                {booking.showtime.movie.rating}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {booking.showtime.movie.title}
            </h1>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Cinema</span>
                <span className="font-bold text-gray-200 mt-0.5 block">
                  {booking.showtime.cinema.name}
                </span>
                <span className="text-gray-400 text-[11px] block">
                  {booking.showtime.cinema.address}, {booking.showtime.cinema.city}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Auditorium</span>
                <span className="font-bold text-accent-cyan mt-0.5 block">
                  {booking.showtime.auditorium.name}
                </span>
                <span className="text-gray-400 text-[11px] block">
                  {booking.showtime.auditorium.screenType}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Date & Time</span>
                <span className="font-bold text-white mt-0.5 block">{formattedDate}</span>
                <span className="text-accent-gold font-bold text-sm block">{formattedTime}</span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Seats Reserved</span>
                <span className="font-mono text-base font-extrabold text-white mt-0.5 block">
                  {seatLabels}
                </span>
                <span className="text-gray-400 text-[11px] block">
                  {booking.seats.length} Ticket(s)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-surface-border flex items-center justify-between text-xs text-gray-400">
            <div>
              <span className="text-[10px] uppercase font-semibold block">Booking Reference</span>
              <span className="font-mono text-sm font-bold text-accent-cyan">
                {booking.bookingReference}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold block">Total Paid</span>
              <span className="text-sm font-bold text-white">
                ${(booking.totalCents / 100).toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>

        {/* Perforated Stub Divider (on Desktop) */}
        <div className="hidden md:flex flex-col justify-between items-center py-2 relative">
          <div className="h-5 w-5 rounded-full bg-background -mt-4 border border-surface-border" />
          <div className="border-l-2 border-dashed border-surface-border h-full my-2" />
          <div className="h-5 w-5 rounded-full bg-background -mb-4 border border-surface-border" />
        </div>

        {/* Right Side: QR Code Stub */}
        <div className="w-full md:w-64 bg-surface-raised/60 p-6 sm:p-8 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-surface-border text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Digital Entry Pass
          </span>

          {booking.ticket?.qrDataUrl ? (
            <div className="relative p-2 bg-white rounded-2xl shadow-xl">
              <img
                src={booking.ticket.qrDataUrl}
                alt={`QR code for booking ${booking.bookingReference}`}
                className="h-36 w-36 sm:h-40 sm:w-40 object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="h-36 w-36 flex items-center justify-center bg-gray-800 rounded-xl text-xs text-gray-400">
              Generating QR...
            </div>
          )}

          {booking.ticket?.ticketCode && (
            <span className="font-mono text-xs font-bold text-gray-300 mt-3 block">
              {booking.ticket.ticketCode}
            </span>
          )}

          <p className="text-[10px] text-gray-500 mt-2">
            Scan at terminal for admittance
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-raised border border-surface-border text-xs font-semibold text-white hover:border-accent-cyan/50 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4 text-accent-cyan" />
            Print Ticket
          </button>
          <button
            onClick={handleDownloadCalendar}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-raised border border-surface-border text-xs font-semibold text-white hover:border-accent-gold/50 transition-all cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-accent-gold" />
            Add to Calendar (.ics)
          </button>
        </div>

        <Link
          href="/profile/bookings"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-cyan text-gray-950 text-xs font-bold shadow-glow-cyan hover:bg-cyan-300 transition-all"
        >
          <TicketIcon className="h-4 w-4" />
          View All Bookings
        </Link>
      </div>
    </div>
  );
}
