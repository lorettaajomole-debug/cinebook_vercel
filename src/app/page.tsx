"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Ticket, Sparkles, Compass, Film, Star, ChevronRight, CheckCircle } from "lucide-react";
import MovieCard, { MovieCardProps } from "@/components/MovieCard";
import FiltersBar from "@/components/FiltersBar";
import TrailerModal from "@/components/TrailerModal";

export default function HomePage() {
  const [movies, setMovies] = useState<MovieCardProps[]>([]);
  const [cinemas, setCinemas] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [genres, setGenres] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroTrailerOpen, setHeroTrailerOpen] = useState(false);

  const fetchMovies = (filterParams = "") => {
    setIsLoading(true);
    fetch(`/api/movies${filterParams}`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.movies || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching movies:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchMovies();

    // Fetch cinemas for filter
    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => setCinemas(data.cinemas || []))
      .catch(() => {});

    // Fetch genres for filter
    fetch("/api/genres")
      .then((res) => res.json())
      .then((data) => setGenres(data.genres || []))
      .catch(() => {});
  }, []);

  const handleFilterChange = (filters: {
    search: string;
    genre: string;
    language: string;
    cinema: string;
    date: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.genre) params.set("genre", filters.genre);
    if (filters.language) params.set("language", filters.language);
    if (filters.cinema) params.set("cinema", filters.cinema);
    if (filters.date) params.set("date", filters.date);

    const qs = params.toString() ? `?${params.toString()}` : "";
    fetchMovies(qs);
  };

  const heroMovie = movies.length > 0 ? movies[0] : null;

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner */}
      {heroMovie && (
        <section className="relative w-full h-[550px] sm:h-[650px] overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={heroMovie.backdropUrl || heroMovie.posterUrl}
              alt={heroMovie.title}
              fill
              priority
              className="object-cover object-top filter brightness-50"
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-cyan/20 border border-accent-cyan/40 px-3 py-1 text-xs font-bold text-accent-cyan backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" /> Featured Spotlight
                </span>
                <span className="rounded-md bg-black/60 border border-surface-border px-2 py-0.5 text-xs font-semibold text-accent-gold">
                  {heroMovie.rating}
                </span>
                <span className="text-xs text-gray-300 font-medium">
                  {Math.floor(heroMovie.durationMins / 60)}h {heroMovie.durationMins % 60}m • {heroMovie.language}
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-lg">
                {heroMovie.title}
              </h1>

              <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed drop-shadow">
                {heroMovie.synopsis}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={`/movies/${heroMovie.slug}`}
                  className="flex items-center gap-2 rounded-xl bg-accent-cyan px-6 py-3 text-sm font-bold text-gray-950 shadow-glow-cyan hover:bg-cyan-300 transition-all cursor-pointer"
                >
                  <Ticket className="h-4 w-4" />
                  Select Showtimes & Seats
                </Link>

                {heroMovie.trailerUrl && (
                  <button
                    onClick={() => setHeroTrailerOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-surface-raised/80 border border-surface-border px-5 py-3 text-sm font-semibold text-white hover:bg-surface-raised transition-all cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    Watch Trailer
                  </button>
                )}
              </div>
            </div>
          </div>

          {heroMovie.trailerUrl && (
            <TrailerModal
              isOpen={heroTrailerOpen}
              onClose={() => setHeroTrailerOpen(false)}
              trailerUrl={heroMovie.trailerUrl}
              movieTitle={heroMovie.title}
            />
          )}
        </section>
      )}

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Dynamic Filters Bar */}
        <section>
          <FiltersBar
            onFilterChange={handleFilterChange}
            cinemas={cinemas}
            genres={genres}
          />
        </section>

        {/* Movies Catalog Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Film className="h-6 w-6 text-accent-cyan" />
                Now Showing in Theatres
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Explore real-time seat availability across IMAX, Dolby Atmos, and Luxe screens.
              </p>
            </div>

            <span className="text-xs font-semibold text-accent-cyan bg-accent-cyan/10 px-3 py-1 rounded-full border border-accent-cyan/20">
              {movies.length} Movies Available
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[420px] rounded-2xl bg-surface-raised/40 animate-pulse border border-surface-border"
                />
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-surface border border-surface-border p-8">
              <Film className="h-12 w-12 text-gray-600 mb-3" />
              <h3 className="text-base font-bold text-white">No Movies Match Your Criteria</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Try selecting a different genre, language, cinema location, or date.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} {...movie} />
              ))}
            </div>
          )}
        </section>

        {/* Featured Cinemas Banner */}
        <section className="rounded-3xl bg-gradient-to-r from-surface to-surface-raised border border-surface-border p-6 sm:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent-gold">
                <Compass className="h-4 w-4" /> Flagship Locations
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                World-Class Cinematic Auditoriums
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Step into custom-engineered auditoriums featuring 70mm IMAX Laser projection, multi-dimensional Dolby Atmos 64-channel sound, and ultra-plush motorized VIP Recliners.
              </p>
            </div>

            <Link
              href="/cinemas"
              className="flex items-center gap-2 rounded-xl bg-surface-raised border border-surface-border px-5 py-3 text-xs font-bold text-white hover:border-accent-cyan/40 transition-all shrink-0"
            >
              Browse All Cinemas & Schedules
              <ChevronRight className="h-4 w-4 text-accent-cyan" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
