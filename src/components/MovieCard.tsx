"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Clock, Play, Ticket, Sparkles } from "lucide-react";
import TrailerModal from "./TrailerModal";

export interface MovieCardProps {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl?: string;
  durationMins: number;
  rating: string;
  language: string;
  genres: Array<{ id: string; name: string; slug: string }>;
  showtimesCount?: number;
}

export default function MovieCard({
  title,
  slug,
  synopsis,
  posterUrl,
  trailerUrl,
  durationMins,
  rating,
  language,
  genres,
  showtimesCount = 0,
}: MovieCardProps) {
  const [trailerOpen, setTrailerOpen] = useState(false);

  return (
    <>
      <div className="group relative flex flex-col rounded-2xl bg-surface border border-surface-border overflow-hidden glass-panel-hover transition-all duration-300">
        {/* Poster Container */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-raised">
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="rounded-md bg-black/70 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-accent-cyan border border-accent-cyan/30">
              {rating}
            </span>
            <span className="rounded-md bg-black/70 backdrop-blur-md px-2 py-1 text-[11px] font-semibold text-gray-200">
              {language}
            </span>
          </div>

          {/* Quick Play Trailer Overlay Button */}
          {trailerUrl && (
            <button
              onClick={() => setTrailerOpen(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-cyan/90 text-white shadow-glow-cyan hover:scale-110 transition-transform">
                <Play className="h-6 w-6 fill-white translate-x-0.5" />
              </div>
            </button>
          )}

          {/* Runtime bottom indicator */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-gray-300">
            <Clock className="h-3 w-3 text-accent-cyan" />
            {Math.floor(durationMins / 60)}h {durationMins % 60}m
          </div>
        </div>

        {/* Content Details */}
        <div className="flex flex-1 flex-col p-4">
          {/* Genre Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {genres.slice(0, 3).map((g) => (
              <span
                key={g.id}
                className="text-[10px] font-medium uppercase tracking-wider text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded"
              >
                {g.name}
              </span>
            ))}
          </div>

          <Link href={`/movies/${slug}`}>
            <h3 className="text-base font-bold text-white tracking-tight hover:text-accent-cyan transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>

          <p className="mt-1.5 text-xs text-gray-400 line-clamp-2 leading-relaxed flex-1">
            {synopsis}
          </p>

          {/* Action Row */}
          <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between gap-2">
            <div className="text-[11px] text-gray-400">
              {showtimesCount > 0 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {showtimesCount} Showtimes
                </span>
              ) : (
                "Upcoming"
              )}
            </div>

            <Link
              href={`/movies/${slug}`}
              className="flex items-center gap-1.5 rounded-xl bg-accent-cyan px-3.5 py-1.5 text-xs font-semibold text-gray-900 hover:bg-cyan-300 shadow-sm transition-all"
            >
              <Ticket className="h-3.5 w-3.5" />
              Book Seats
            </Link>
          </div>
        </div>
      </div>

      {trailerUrl && (
        <TrailerModal
          isOpen={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          trailerUrl={trailerUrl}
          movieTitle={title}
        />
      )}
    </>
  );
}
