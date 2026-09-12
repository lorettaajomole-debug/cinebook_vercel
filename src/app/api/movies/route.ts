import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { movies, movieGenres, genres, showtimes, auditoriums, cinemas } from "@/db/schema";
import { eq, ilike, and, gte, lte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const genreSlug = searchParams.get("genre") || "";
    const language = searchParams.get("language") || "";
    const cinemaId = searchParams.get("cinema") || "";
    const dateStr = searchParams.get("date") || "";

    // Fetch active movies
    const allMovies = await db.query.movies.findMany({
      where: eq(movies.isActive, true),
      with: {
        movieGenres: {
          with: {
            genre: true,
          },
        },
        showtimes: {
          where: eq(showtimes.status, "SCHEDULED"),
          with: {
            auditorium: {
              with: {
                cinema: true,
              },
            },
          },
        },
      },
      orderBy: (movies, { desc }) => [desc(movies.releaseDate)],
    });

    // Filter in memory for multi-dimensional criteria
    const filtered = allMovies.filter((movie) => {
      // 1. Search term match
      if (search) {
        const query = search.toLowerCase();
        const matchTitle = movie.title.toLowerCase().includes(query);
        const matchDirector = movie.director?.toLowerCase().includes(query) || false;
        const matchCast = movie.castMembers?.toLowerCase().includes(query) || false;
        if (!matchTitle && !matchDirector && !matchCast) return false;
      }

      // 2. Genre match
      if (genreSlug) {
        const hasGenre = movie.movieGenres.some(
          (mg) => mg.genre.slug.toLowerCase() === genreSlug.toLowerCase()
        );
        if (!hasGenre) return false;
      }

      // 3. Language match
      if (language && movie.language.toLowerCase() !== language.toLowerCase()) {
        return false;
      }

      // 4. Cinema match
      if (cinemaId) {
        const hasShowtimeAtCinema = movie.showtimes.some(
          (st) => st.auditorium.cinema.id === cinemaId || st.auditorium.cinema.slug === cinemaId
        );
        if (!hasShowtimeAtCinema) return false;
      }

      // 5. Date match
      if (dateStr) {
        const targetDate = new Date(dateStr).toISOString().slice(0, 10);
        const hasShowtimeOnDate = movie.showtimes.some((st) => {
          const stDate = new Date(st.startTime).toISOString().slice(0, 10);
          return stDate === targetDate;
        });
        if (!hasShowtimeOnDate) return false;
      }

      return true;
    });

    // Clean response format
    const formatted = filtered.map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      synopsis: m.synopsis,
      posterUrl: m.posterUrl,
      backdropUrl: m.backdropUrl,
      trailerUrl: m.trailerUrl,
      durationMins: m.durationMins,
      releaseDate: m.releaseDate,
      rating: m.rating,
      language: m.language,
      director: m.director,
      castMembers: m.castMembers,
      genres: m.movieGenres.map((mg) => ({
        id: mg.genre.id,
        name: mg.genre.name,
        slug: mg.genre.slug,
      })),
      showtimesCount: m.showtimes.length,
    }));

    return NextResponse.json({ movies: formatted });
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 });
  }
}
