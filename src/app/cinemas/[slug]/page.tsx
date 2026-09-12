"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Compass, MapPin, Phone, Sparkles, Film, Ticket, ChevronRight } from "lucide-react";

interface CinemaDetail {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  facilities: string[];
  auditoriums: Array<{
    id: string;
    name: string;
    screenType: string;
    soundSystem: string;
    totalSeats: number;
    showtimes: Array<{
      id: string;
      startTime: string;
      movie: {
        id: string;
        title: string;
        slug: string;
        rating: string;
        posterUrl: string;
      };
    }>;
  }>;
}

export default function CinemaDetailPage() {
  const params = useParams<{ slug: string }>();
  const [cinema, setCinema] = useState<CinemaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!params.slug) return;
    setIsLoading(true);

    fetch(`/api/cinemas/${params.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.cinema) setCinema(data.cinema);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="h-64 rounded-3xl bg-surface-raised/40 animate-pulse" />
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Cinema Not Found</h1>
        <Link href="/cinemas" className="mt-4 inline-block text-accent-cyan underline text-sm">
          Return to Cinemas
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Cinema Header */}
      <div className="rounded-3xl bg-surface border border-surface-border p-6 sm:p-10 shadow-2xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-gold flex items-center gap-1.5">
          <Compass className="h-4 w-4" /> Flagship Theatre
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{cinema.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-accent-cyan" />
            {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-accent-cyan" />
            {cinema.phone}
          </span>
        </div>

        <div className="pt-2">
          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Amenities:</span>
          <div className="flex flex-wrap gap-2">
            {(cinema.facilities || []).map((f, i) => (
              <span
                key={i}
                className="rounded-lg bg-surface-raised border border-surface-border px-3 py-1 text-xs font-semibold text-accent-cyan"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Auditoriums & Schedules */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Film className="h-6 w-6 text-accent-cyan" />
          Auditoriums & Active Screenings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cinema.auditoriums.map((aud) => (
            <div
              key={aud.id}
              className="rounded-2xl bg-surface border border-surface-border p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{aud.name}</h3>
                  <span className="text-xs font-bold text-accent-gold">{aud.screenType}</span>
                </div>
                <span className="text-xs text-gray-400">{aud.totalSeats} Total Seats</span>
              </div>

              <div className="text-xs text-gray-400">
                <span className="font-semibold text-gray-300">Sound:</span> {aud.soundSystem}
              </div>

              {/* Showtimes for this auditorium */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase text-gray-400 block">
                  Scheduled Screenings:
                </span>
                {aud.showtimes && aud.showtimes.length > 0 ? (
                  <div className="space-y-2">
                    {aud.showtimes.slice(0, 5).map((st) => (
                      <Link
                        key={st.id}
                        href={`/showtimes/${st.id}/seats`}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-surface-raised border border-surface-border hover:border-accent-cyan transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Ticket className="h-4 w-4 text-accent-cyan" />
                          <div>
                            <span className="text-xs font-bold text-white block">{st.movie.title}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(st.startTime).toLocaleString("en-US", {
                                weekday: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-accent-cyan flex items-center gap-1">
                          Select Seats <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No upcoming showtimes scheduled.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
