"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, MapPin, Phone, Sparkles, ChevronRight, Check } from "lucide-react";

interface Cinema {
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
  }>;
}

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => {
        setCinemas(data.cinemas || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Compass className="h-7 w-7 text-accent-cyan" />
          Flagship Cinema Theatres
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Explore theatre locations, auditorium specifications, and format capabilities.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-surface-raised/40 animate-pulse border border-surface-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="flex flex-col justify-between rounded-2xl bg-surface border border-surface-border p-6 shadow-xl hover:border-accent-cyan/40 transition-all"
            >
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent-gold">
                    {cinema.city}, {cinema.state}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">{cinema.name}</h2>
                </div>

                <div className="space-y-1.5 text-xs text-gray-300">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent-cyan shrink-0" />
                    {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-accent-cyan shrink-0" />
                    {cinema.phone}
                  </p>
                </div>

                {/* Facilities */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">
                    Facilities & Technology
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(cinema.facilities || []).map((f, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-surface-raised border border-surface-border px-2 py-0.5 text-[10px] font-semibold text-accent-cyan"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Auditoriums count */}
                <div className="pt-2 border-t border-surface-border/60 text-xs text-gray-400">
                  <span>{cinema.auditoriums?.length || 2} Premium Auditoriums</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/cinemas/${cinema.slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-raised border border-surface-border py-2.5 text-xs font-bold text-white hover:bg-accent-cyan hover:text-gray-950 transition-all"
                >
                  View Screenings & Schedules
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
