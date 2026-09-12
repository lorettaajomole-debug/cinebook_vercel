"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, Play, Ticket, Sparkles, MapPin, Calendar, Film, Star, ChevronRight, User } from "lucide-react";
import TrailerModal from "@/components/TrailerModal";

interface ShowtimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  auditoriumName: string;
  screenType: string;
  soundSystem: string;
  priceMultiplier: string;
}

interface CinemaSchedule {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  dates: Record<string, ShowtimeSlot[]>;
}

interface MovieDetail {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  durationMins: number;
  releaseDate: string;
  rating: string;
  language: string;
  director: string;
  castMembers: string;
  genres: Array<{ id: string; name: string; slug: string }>;
  cinemasWithShowtimes: CinemaSchedule[];
}

export default function MovieDetailPage() {
  const params = useParams<{ slug: string }>();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    if (!params.slug) return;
    setIsLoading(true);

    fetch(`/api/movies/${params.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.movie) {
          setMovie(data.movie);

          // Find first available date across cinemas
          const availableDates = new Set<string>();
          data.movie.cinemasWithShowtimes.forEach((c: CinemaSchedule) => {
            Object.keys(c.dates).forEach((d) => availableDates.add(d));
          });
          const sortedDates = Array.from(availableDates).sort();
          if (sortedDates.length > 0) {
            setSelectedDate(sortedDates[0]);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading movie:", err);
        setIsLoading(false);
      });
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-4">
        <div className="h-64 rounded-3xl bg-surface-raised/40 animate-pulse" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Movie Not Found</h1>
        <Link href="/movies" className="mt-4 inline-block text-accent-cyan underline text-sm">
          Return to Movies
        </Link>
      </div>
    );
  }

  // Extract all distinct dates across cinemas
  const allDates = Array.from(
    new Set(
      movie.cinemasWithShowtimes.flatMap((c) => Object.keys(c.dates))
    )
  ).sort();

  return (
    <div className="space-y-12 pb-20">
      {/* Movie Hero Banner */}
      <section className="relative w-full overflow-hidden bg-surface-raised">
        <div className="absolute inset-0">
          <Image
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            fill
            priority
            className="object-cover object-top filter brightness-[0.25]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 items-start">
          {/* Poster */}
          <div className="relative aspect-[2/3] w-48 sm:w-64 shrink-0 rounded-2xl overflow-hidden border border-surface-border shadow-2xl bg-surface">
            <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" />
            <span className="absolute top-3 left-3 rounded-md bg-black/80 px-2.5 py-1 text-xs font-bold text-accent-cyan border border-accent-cyan/30">
              {movie.rating}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span
                  key={g.id}
                  className="rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 px-2.5 py-1 text-xs font-semibold text-accent-cyan"
                >
                  {g.name}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-accent-cyan" />
                {Math.floor(movie.durationMins / 60)}h {movie.durationMins % 60}m
              </span>
              <span>•</span>
              <span>Language: {movie.language}</span>
              <span>•</span>
              <span>
                Released: {new Date(movie.releaseDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl">
              {movie.synopsis}
            </p>

            {/* Director & Cast */}
            <div className="pt-2 border-t border-surface-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 font-semibold block">Director:</span>
                <span className="text-white font-medium">{movie.director || "Not Specified"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block">Starring Cast:</span>
                <span className="text-white font-medium">{movie.castMembers || "Featured Cast"}</span>
              </div>
            </div>

            {movie.trailerUrl && (
              <div className="pt-2">
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/40 px-4 py-2 text-xs font-bold text-accent-cyan hover:bg-accent-cyan hover:text-gray-950 transition-all cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Watch Official Trailer
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Showtimes & Booking Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Ticket className="h-6 w-6 text-accent-cyan" />
                Select Cinema & Showtime
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Pick a screening date and click any showtime to choose your seats.
              </p>
            </div>

            {/* Date Picker Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {allDates.map((dateStr) => {
                const d = new Date(dateStr);
                const isSelected = selectedDate === dateStr;
                const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-accent-cyan border-cyan-400 text-gray-950 shadow-glow-cyan"
                        : "bg-surface border-surface-border text-gray-300 hover:border-accent-cyan/40"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold">{dayName}</span>
                    <span className="font-mono text-xs">{dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cinemas & Showtime Cards */}
          {movie.cinemasWithShowtimes.length === 0 ? (
            <div className="rounded-2xl bg-surface border border-surface-border p-8 text-center text-xs text-gray-400">
              No scheduled showtimes currently available for this movie.
            </div>
          ) : (
            <div className="space-y-6">
              {movie.cinemasWithShowtimes.map((cinema) => {
                const slotsForDate = cinema.dates[selectedDate] || [];

                return (
                  <div
                    key={cinema.id}
                    className="rounded-2xl bg-surface border border-surface-border p-5 sm:p-6 shadow-xl space-y-4"
                  >
                    {/* Cinema Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-accent-cyan" />
                          {cinema.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {cinema.address}, {cinema.city}, {cinema.state}
                        </p>
                      </div>

                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit">
                        {slotsForDate.length} Screenings on this day
                      </span>
                    </div>

                    {/* Showtimes Grid */}
                    {slotsForDate.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">
                        No screenings scheduled at this location on the selected date.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {slotsForDate.map((slot) => {
                          const slotTime = new Date(slot.startTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });

                          return (
                            <Link
                              key={slot.id}
                              href={`/showtimes/${slot.id}/seats`}
                              className="group flex flex-col items-center justify-center p-3 rounded-xl bg-surface-raised border border-surface-border hover:border-accent-cyan hover:bg-surface-raised/90 transition-all shadow-sm"
                            >
                              <span className="font-mono text-base font-extrabold text-white group-hover:text-accent-cyan transition-colors">
                                {slotTime}
                              </span>
                              <span className="text-[10px] font-bold text-accent-gold mt-1">
                                {slot.screenType}
                              </span>
                              <span className="text-[9px] text-gray-400 truncate max-w-full">
                                {slot.auditoriumName}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {movie.trailerUrl && (
        <TrailerModal
          isOpen={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          trailerUrl={movie.trailerUrl}
          movieTitle={movie.title}
        />
      )}
    </div>
  );
}
