"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Ticket as TicketIcon } from "lucide-react";
import TicketCard from "@/components/TicketCard";

interface TicketPayload {
  booking: {
    bookingReference: string;
    totalCents: number;
    status: string;
    showtime: {
      startTime: string;
      endTime: string;
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

export default function TicketConfirmationPage({
  params,
}: {
  params: Promise<{ bookingReference: string }>;
}) {
  const resolvedParams = use(params);
  const bookingReference = resolvedParams.bookingReference;

  const [data, setData] = useState<TicketPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/tickets/${bookingReference}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.booking) {
          setData(resData);
        } else {
          setErrorMessage(resData.error || "Ticket not found");
        }
        setIsLoading(false);
      })
      .catch(() => {
        setErrorMessage("Network error loading ticket");
        setIsLoading(false);
      });
  }, [bookingReference]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <div className="h-96 rounded-3xl bg-surface-raised/40 animate-pulse" />
      </div>
    );
  }

  if (!data || errorMessage) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <div className="rounded-2xl bg-surface border border-surface-border p-8">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-white">Ticket Not Found</h1>
          <p className="text-xs text-red-300 mt-2">{errorMessage}</p>
          <Link
            href="/movies"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent-cyan px-5 py-2.5 text-xs font-bold text-gray-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      <TicketCard booking={data.booking} />
    </div>
  );
}
