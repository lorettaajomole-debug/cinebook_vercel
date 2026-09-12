"use client";

import { useEffect, useState } from "react";
import MovieCard, { MovieCardProps } from "@/components/MovieCard";
import FiltersBar from "@/components/FiltersBar";
import { Film } from "lucide-react";

export default function MoviesCatalogPage() {
  const [movies, setMovies] = useState<MovieCardProps[]>([]);
  const [cinemas, setCinemas] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [genres, setGenres] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovies = (filterParams = "") => {
    setIsLoading(true);
    fetch(`/api/movies${filterParams}`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.movies || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMovies();
    fetch("/api/cinemas").then((res) => res.json()).then((d) => setCinemas(d.cinemas || []));
    fetch("/api/genres").then((res) => res.json()).then((d) => setGenres(d.genres || []));
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
    fetchMovies(params.toString() ? `?${params.toString()}` : "");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Film className="h-7 w-7 text-accent-cyan" />
          Movie Catalog & Showtimes
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Select a movie to explore format options, theatre locations, and book your preferred seats.
        </p>
      </div>

      <FiltersBar onFilterChange={handleFilterChange} cinemas={cinemas} genres={genres} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[420px] rounded-2xl bg-surface-raised/40 animate-pulse border border-surface-border"
            />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="rounded-2xl bg-surface border border-surface-border p-12 text-center">
          <p className="text-sm font-semibold text-gray-300">No movies found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      )}
    </div>
  );
}
