"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  TrendingUp,
  Ticket,
  Film,
  Compass,
  Clock,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
  FileText,
  Users,
} from "lucide-react";

interface AdminOverviewData {
  metrics: {
    totalRevenueCents: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalTicketsSold: number;
    activeShowtimes: number;
    totalShowtimes: number;
    occupancyPercent: string;
  };
  recentBookings: Array<{
    id: string;
    booking_reference: string;
    total_seats: number;
    total_cents: number;
    status: string;
    created_at: string;
    user_name: string;
    user_email: string;
    movie_title: string;
    cinema_name: string;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [showtimesList, setShowtimesList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "MOVIES" | "SHOWTIMES" | "LOGS">("OVERVIEW");
  const [isLoading, setIsLoading] = useState(true);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  // New Movie Form State
  const [newMovie, setNewMovie] = useState({
    title: "",
    synopsis: "",
    posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
    trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
    durationMins: 120,
    rating: "PG-13",
    language: "English",
    director: "",
    castMembers: "",
    genreIds: [] as string[],
  });
  const [movieCreating, setMovieCreating] = useState(false);
  const [movieSuccess, setMovieSuccess] = useState<string | null>(null);

  // New Showtime Form State
  const [newShowtime, setNewShowtime] = useState({
    movieId: "",
    auditoriumId: "",
    startTime: "",
    priceMultiplier: "1.00",
  });
  const [showtimeCreating, setShowtimeCreating] = useState(false);
  const [showtimeSuccess, setShowtimeSuccess] = useState<string | null>(null);

  const fetchOverview = () => {
    setIsLoading(true);
    fetch("/api/admin/overview")
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          router.push("/login?redirect=/admin");
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((resData) => {
        if (resData.metrics) setData(resData);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.message !== "Unauthorized") setIsLoading(false);
      });
  };

  const fetchSupportingData = () => {
    fetch("/api/admin/movies").then((r) => r.json()).then((d) => setMoviesList(d.movies || []));
    fetch("/api/admin/showtimes").then((r) => r.json()).then((d) => setShowtimesList(d.showtimes || []));
    fetch("/api/admin/audit-logs").then((r) => r.json()).then((d) => setAuditLogs(d.logs || []));
    fetch("/api/cinemas").then((r) => r.json()).then((d) => setCinemas(d.cinemas || []));
    fetch("/api/genres").then((r) => r.json()).then((d) => setGenres(d.genres || []));
  };

  useEffect(() => {
    fetchOverview();
    fetchSupportingData();
  }, [router]);

  const handleRunCronCleanup = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      const res = await fetch("/api/cron/release-holds", { method: "POST" });
      const resData = await res.json();
      setCronResult(
        `Released ${resData.releasedSeatsCount || 0} expired seat holds (${resData.expiredBookingsCount || 0} expired bookings)`
      );
      fetchOverview();
      fetchSupportingData();
    } catch (err: any) {
      setCronResult("Failed to trigger cron hold release");
    } finally {
      setCronRunning(false);
    }
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovieCreating(true);
    setMovieSuccess(null);
    try {
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMovie),
      });
      const data = await res.json();
      if (res.ok) {
        setMovieSuccess("Movie added successfully!");
        setNewMovie({
          title: "",
          synopsis: "",
          posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
          trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
          durationMins: 120,
          rating: "PG-13",
          language: "English",
          director: "",
          castMembers: "",
          genreIds: [],
        });
        fetchSupportingData();
      }
    } finally {
      setMovieCreating(false);
    }
  };

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowtimeCreating(true);
    setShowtimeSuccess(null);
    try {
      const res = await fetch("/api/admin/showtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShowtime),
      });
      const data = await res.json();
      if (res.ok) {
        setShowtimeSuccess(`Showtime scheduled & generated ${data.seatsGenerated} seats inventory!`);
        fetchSupportingData();
        fetchOverview();
      }
    } finally {
      setShowtimeCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-4">
        <div className="h-96 rounded-3xl bg-surface-raised/40 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Shield className="h-12 w-12 text-accent-gold mx-auto mb-3" />
        <h1 className="text-xl font-bold text-white">Access Denied</h1>
        <p className="text-xs text-gray-400 mt-1">
          You must be logged in as an Administrator (`admin@cinebook.com`) to access this portal.
        </p>
      </div>
    );
  }

  const allAuditoriums = cinemas.flatMap((c) =>
    (c.auditoriums || []).map((a: any) => ({
      ...a,
      cinemaName: c.name,
    }))
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      {/* Admin Header & Tool Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-accent-gold/20 border border-accent-gold/40 px-2.5 py-0.5 text-[10px] font-bold text-accent-gold uppercase">
              Admin Access Active
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-accent-gold" />
            CineBook Control Centre
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage theatre capacity, schedules, movie inventories, and monitor real-time bookings.
          </p>
        </div>

        {/* Manual Cron Trigger */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={handleRunCronCleanup}
            disabled={cronRunning}
            className="flex items-center gap-2 rounded-xl bg-surface-raised border border-surface-border px-4 py-2.5 text-xs font-bold text-white hover:border-accent-cyan transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-accent-cyan ${cronRunning ? "animate-spin" : ""}`} />
            {cronRunning ? "Releasing Expired Holds..." : "Release Expired Holds"}
          </button>
        </div>
      </div>

      {cronResult && (
        <div className="rounded-xl bg-emerald-950/60 border border-emerald-800 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{cronResult}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "OVERVIEW"
              ? "bg-accent-gold text-gray-950 shadow-glow-gold"
              : "text-gray-400 hover:text-white hover:bg-surface-raised"
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab("MOVIES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "MOVIES"
              ? "bg-accent-gold text-gray-950 shadow-glow-gold"
              : "text-gray-400 hover:text-white hover:bg-surface-raised"
          }`}
        >
          Manage Movies ({moviesList.length})
        </button>
        <button
          onClick={() => setActiveTab("SHOWTIMES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "SHOWTIMES"
              ? "bg-accent-gold text-gray-950 shadow-glow-gold"
              : "text-gray-400 hover:text-white hover:bg-surface-raised"
          }`}
        >
          Schedule Showtimes
        </button>
        <button
          onClick={() => setActiveTab("LOGS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "LOGS"
              ? "bg-accent-gold text-gray-950 shadow-glow-gold"
              : "text-gray-400 hover:text-white hover:bg-surface-raised"
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-8">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-surface border border-surface-border p-5 shadow-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Total Revenue
              </span>
              <p className="text-2xl font-black text-white font-mono">
                ${(data.metrics.totalRevenueCents / 100).toFixed(2)}
              </p>
              <span className="text-[11px] text-emerald-400 font-semibold">
                {data.metrics.confirmedBookings} Confirmed Orders
              </span>
            </div>

            <div className="rounded-2xl bg-surface border border-surface-border p-5 shadow-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Tickets Sold
              </span>
              <p className="text-2xl font-black text-accent-cyan font-mono">
                {data.metrics.totalTicketsSold}
              </p>
              <span className="text-[11px] text-gray-400">
                Across all screenings
              </span>
            </div>

            <div className="rounded-2xl bg-surface border border-surface-border p-5 shadow-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Auditorium Occupancy
              </span>
              <p className="text-2xl font-black text-accent-gold font-mono">
                {data.metrics.occupancyPercent}
              </p>
              <span className="text-[11px] text-gray-400">
                Real-time seat utilization
              </span>
            </div>

            <div className="rounded-2xl bg-surface border border-surface-border p-5 shadow-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Active Showtimes
              </span>
              <p className="text-2xl font-black text-white font-mono">
                {data.metrics.activeShowtimes}
              </p>
              <span className="text-[11px] text-gray-400">
                Scheduled this week
              </span>
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="rounded-2xl bg-surface border border-surface-border p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-accent-cyan" />
              Recent Customer Bookings
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-surface-raised text-[10px] uppercase font-bold text-gray-400 border-b border-surface-border">
                  <tr>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Movie & Cinema</th>
                    <th className="p-3">Tickets</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60">
                  {data.recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-raised/50">
                      <td className="p-3 font-mono font-bold text-accent-cyan">
                        {b.booking_reference}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-white block">{b.user_name}</span>
                        <span className="text-[10px] text-gray-400">{b.user_email}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-white block">{b.movie_title}</span>
                        <span className="text-[10px] text-gray-400">{b.cinema_name}</span>
                      </td>
                      <td className="p-3 font-bold text-white">{b.total_seats}</td>
                      <td className="p-3 font-mono font-bold text-white">
                        ${(b.total_cents / 100).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : b.status === "PENDING"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">
                        {new Date(b.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE MOVIES */}
      {activeTab === "MOVIES" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Movie Form */}
          <div className="lg:col-span-5 rounded-2xl bg-surface border border-surface-border p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent-cyan" />
              Add New Movie
            </h2>

            {movieSuccess && (
              <div className="rounded-xl bg-emerald-950/60 border border-emerald-800 p-3 text-xs text-emerald-300">
                {movieSuccess}
              </div>
            )}

            <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={newMovie.title}
                  onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                  placeholder="e.g. Gladiator II"
                  className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Synopsis</label>
                <textarea
                  required
                  rows={3}
                  value={newMovie.synopsis}
                  onChange={(e) => setNewMovie({ ...newMovie, synopsis: e.target.value })}
                  placeholder="Detailed synopsis..."
                  className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    required
                    value={newMovie.durationMins}
                    onChange={(e) => setNewMovie({ ...newMovie, durationMins: parseInt(e.target.value, 10) })}
                    className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Rating</label>
                  <select
                    value={newMovie.rating}
                    onChange={(e) => setNewMovie({ ...newMovie, rating: e.target.value })}
                    className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-white"
                  >
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                    <option value="NC-17">NC-17</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Poster Image URL</label>
                <input
                  type="url"
                  required
                  value={newMovie.posterUrl}
                  onChange={(e) => setNewMovie({ ...newMovie, posterUrl: e.target.value })}
                  className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Trailer URL (YouTube)</label>
                <input
                  type="url"
                  required
                  value={newMovie.trailerUrl}
                  onChange={(e) => setNewMovie({ ...newMovie, trailerUrl: e.target.value })}
                  className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={movieCreating}
                className="w-full rounded-xl bg-accent-cyan py-2.5 font-bold text-gray-950 shadow-glow-cyan hover:bg-cyan-300 transition-all cursor-pointer"
              >
                {movieCreating ? "Creating Movie..." : "Create Movie"}
              </button>
            </form>
          </div>

          {/* Current Movies List */}
          <div className="lg:col-span-7 rounded-2xl bg-surface border border-surface-border p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="h-5 w-5 text-accent-gold" />
              Active Movie Library ({moviesList.length})
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {moviesList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-surface-border text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-8 rounded bg-gray-800 overflow-hidden relative shrink-0">
                      <img src={m.posterUrl} alt={m.title} className="object-cover h-full w-full" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">{m.title}</span>
                      <span className="text-gray-400">
                        {m.rating} • {m.durationMins} mins • {m.language}
                      </span>
                    </div>
                  </div>

                  <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-bold text-[10px]">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULE SHOWTIMES */}
      {activeTab === "SHOWTIMES" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Schedule Form */}
          <div className="lg:col-span-5 rounded-2xl bg-surface border border-surface-border p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent-gold" />
              Schedule New Showtime
            </h2>

            {showtimeSuccess && (
              <div className="rounded-xl bg-emerald-950/60 border border-emerald-800 p-3 text-xs text-emerald-300">
                {showtimeSuccess}
              </div>
            )}

            <form onSubmit={handleCreateShowtime} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Select Movie</label>
                <select
                  required
                  value={newShowtime.movieId}
                  onChange={(e) => setNewShowtime({ ...newShowtime, movieId: e.target.value })}
                  className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-white"
                >
                  <option value="">Choose Movie...</option>
                  {moviesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Select Auditorium</label>
                <select
                  required
                  value={newShowtime.auditoriumId}
                  onChange={(e) => setNewShowtime({ ...newShowtime, auditoriumId: e.target.value })}
                  className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-white"
                >
                  <option value="">Choose Auditorium...</option>
                  {allAuditoriums.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.cinemaName} — {a.name} ({a.screenType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newShowtime.startTime}
                  onChange={(e) => setNewShowtime({ ...newShowtime, startTime: e.target.value })}
                  className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Price Multiplier</label>
                <select
                  value={newShowtime.priceMultiplier}
                  onChange={(e) => setNewShowtime({ ...newShowtime, priceMultiplier: e.target.value })}
                  className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-white"
                >
                  <option value="1.00">1.00x (Standard)</option>
                  <option value="1.10">1.10x (Matinee)</option>
                  <option value="1.25">1.25x (Prime Evening)</option>
                  <option value="1.50">1.50x (Weekend Blockbuster)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={showtimeCreating}
                className="w-full rounded-xl bg-accent-gold py-2.5 font-bold text-gray-950 shadow-glow-gold hover:bg-amber-400 transition-all cursor-pointer"
              >
                {showtimeCreating ? "Creating & Generating Seats..." : "Schedule Showtime"}
              </button>
            </form>
          </div>

          {/* Upcoming Showtimes List */}
          <div className="lg:col-span-7 rounded-2xl bg-surface border border-surface-border p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent-cyan" />
              Scheduled Screenings ({showtimesList.length})
            </h2>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {showtimesList.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-surface-border text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{st.movie?.title}</span>
                    <span className="text-gray-400 text-[11px]">
                      {st.auditorium?.cinema?.name} • {st.auditorium?.name}
                    </span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-accent-cyan block">
                      {new Date(st.startTime).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[10px] text-accent-gold">{st.priceMultiplier}x Tier</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === "LOGS" && (
        <div className="rounded-2xl bg-surface border border-surface-border p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent-cyan" />
            System Audit Trail
          </h2>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-surface-raised text-[10px] uppercase font-bold text-gray-400 border-b border-surface-border">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Entity ID</th>
                  <th className="p-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-raised/50">
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-accent-cyan/15 text-accent-cyan px-2 py-0.5 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-white">{log.entityType}</td>
                    <td className="p-3 text-gray-400 truncate max-w-xs">{log.entityId}</td>
                    <td className="p-3 text-gray-400 max-w-md truncate">
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
