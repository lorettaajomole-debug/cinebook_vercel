"use client";

import { Search, Calendar, Film, Compass, Languages, X } from "lucide-react";
import { useEffect, useState } from "react";

interface FiltersBarProps {
  onFilterChange: (filters: {
    search: string;
    genre: string;
    language: string;
    cinema: string;
    date: string;
  }) => void;
  cinemas: Array<{ id: string; name: string; slug: string }>;
  genres: Array<{ id: string; name: string; slug: string }>;
}

export default function FiltersBar({ onFilterChange, cinemas, genres }: FiltersBarProps) {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedCinema, setSelectedCinema] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Generate next 5 dates
  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel =
      i === 0
        ? "Today"
        : i === 1
        ? "Tomorrow"
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return { dateStr, dayLabel };
  });

  const handleUpdate = (updated: Partial<{
    search: string;
    genre: string;
    language: string;
    cinema: string;
    date: string;
  }>) => {
    const newFilters = {
      search: updated.search !== undefined ? updated.search : search,
      genre: updated.genre !== undefined ? updated.genre : selectedGenre,
      language: updated.language !== undefined ? updated.language : selectedLanguage,
      cinema: updated.cinema !== undefined ? updated.cinema : selectedCinema,
      date: updated.date !== undefined ? updated.date : selectedDate,
    };
    onFilterChange(newFilters);
  };

  const handleClearAll = () => {
    setSearch("");
    setSelectedGenre("");
    setSelectedLanguage("");
    setSelectedCinema("");
    setSelectedDate("");
    onFilterChange({
      search: "",
      genre: "",
      language: "",
      cinema: "",
      date: "",
    });
  };

  const hasActiveFilters = Boolean(search || selectedGenre || selectedLanguage || selectedCinema || selectedDate);

  return (
    <div className="w-full space-y-4 rounded-2xl bg-surface border border-surface-border p-4 sm:p-5 shadow-xl">
      {/* Top Search and Selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search movie title, cast, director..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleUpdate({ search: e.target.value });
            }}
            className="w-full rounded-xl bg-surface-raised border border-surface-border pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none transition-colors"
          />
        </div>

        {/* Genre Select */}
        <div className="relative">
          <Film className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              handleUpdate({ genre: e.target.value });
            }}
            aria-label="Filter by genre"
            className="w-full appearance-none rounded-xl bg-surface-raised border border-surface-border pl-10 pr-8 py-2.5 text-xs sm:text-sm text-white focus:border-accent-cyan focus:outline-none transition-colors cursor-pointer"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Language Select */}
        <div className="relative">
          <Languages className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              handleUpdate({ language: e.target.value });
            }}
            aria-label="Filter by language"
            className="w-full appearance-none rounded-xl bg-surface-raised border border-surface-border pl-10 pr-8 py-2.5 text-xs sm:text-sm text-white focus:border-accent-cyan focus:outline-none transition-colors cursor-pointer"
          >
            <option value="">All Languages</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="Japanese">Japanese</option>
            <option value="French">French</option>
          </select>
        </div>

        {/* Cinema Location Select */}
        <div className="relative">
          <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={selectedCinema}
            onChange={(e) => {
              setSelectedCinema(e.target.value);
              handleUpdate({ cinema: e.target.value });
            }}
            aria-label="Filter by cinema"
            className="w-full appearance-none rounded-xl bg-surface-raised border border-surface-border pl-10 pr-8 py-2.5 text-xs sm:text-sm text-white focus:border-accent-cyan focus:outline-none transition-colors cursor-pointer"
          >
            <option value="">All Cinemas</option>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Tabs Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-border/60">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mr-1">
            <Calendar className="h-3.5 w-3.5 text-accent-cyan" />
            Date:
          </span>

          <button
            onClick={() => {
              setSelectedDate("");
              handleUpdate({ date: "" });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              selectedDate === ""
                ? "bg-accent-cyan text-gray-950 font-bold shadow-sm"
                : "bg-surface-raised text-gray-300 hover:text-white"
            }`}
          >
            Any Date
          </button>

          {dates.map((d) => (
            <button
              key={d.dateStr}
              onClick={() => {
                const nextDate = selectedDate === d.dateStr ? "" : d.dateStr;
                setSelectedDate(nextDate);
                handleUpdate({ date: nextDate });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedDate === d.dateStr
                  ? "bg-accent-cyan text-gray-950 font-bold shadow-sm"
                  : "bg-surface-raised text-gray-300 hover:text-white"
              }`}
            >
              {d.dayLabel}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs text-accent-ruby hover:underline ml-auto font-medium"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
