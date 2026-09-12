import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { movies, showtimes, auditoriums, cinemas } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const movie = await db.query.movies.findFirst({
      where: eq(movies.slug, slug),
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
          orderBy: (showtimes, { asc }) => [asc(showtimes.startTime)],
        },
      },
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Group showtimes by Cinema and Date
    const cinemasMap: Record<
      string,
      {
        id: string;
        name: string;
        slug: string;
        address: string;
        city: string;
        state: string;
        dates: Record<
          string,
          Array<{
            id: string;
            startTime: Date;
            endTime: Date;
            auditoriumName: string;
            screenType: string;
            soundSystem: string;
            priceMultiplier: string;
          }>
        >;
      }
    > = {};

    for (const st of movie.showtimes) {
      const cinema = st.auditorium.cinema;
      const dateKey = new Date(st.startTime).toISOString().slice(0, 10);

      if (!cinemasMap[cinema.id]) {
        cinemasMap[cinema.id] = {
          id: cinema.id,
          name: cinema.name,
          slug: cinema.slug,
          address: cinema.address,
          city: cinema.city,
          state: cinema.state,
          dates: {},
        };
      }

      if (!cinemasMap[cinema.id].dates[dateKey]) {
        cinemasMap[cinema.id].dates[dateKey] = [];
      }

      cinemasMap[cinema.id].dates[dateKey].push({
        id: st.id,
        startTime: st.startTime,
        endTime: st.endTime,
        auditoriumName: st.auditorium.name,
        screenType: st.auditorium.screenType,
        soundSystem: st.auditorium.soundSystem,
        priceMultiplier: st.priceMultiplier,
      });
    }

    return NextResponse.json({
      movie: {
        id: movie.id,
        title: movie.title,
        slug: movie.slug,
        synopsis: movie.synopsis,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        trailerUrl: movie.trailerUrl,
        durationMins: movie.durationMins,
        releaseDate: movie.releaseDate,
        rating: movie.rating,
        language: movie.language,
        director: movie.director,
        castMembers: movie.castMembers,
        genres: movie.movieGenres.map((mg) => ({
          id: mg.genre.id,
          name: mg.genre.name,
          slug: mg.genre.slug,
        })),
        cinemasWithShowtimes: Object.values(cinemasMap),
      },
    });
  } catch (error: any) {
    console.error("Error fetching movie details:", error);
    return NextResponse.json({ error: "Failed to fetch movie details" }, { status: 500 });
  }
}
