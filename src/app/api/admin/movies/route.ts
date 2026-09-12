import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { movies, movieGenres } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();

    const allMovies = await db.query.movies.findMany({
      with: {
        movieGenres: {
          with: {
            genre: true,
          },
        },
      },
      orderBy: (movies, { desc }) => [desc(movies.createdAt)],
    });

    return NextResponse.json({ movies: allMovies });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN_ADMIN_ONLY") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const {
      title,
      synopsis,
      posterUrl,
      backdropUrl,
      trailerUrl,
      durationMins,
      releaseDate,
      rating,
      language,
      director,
      castMembers,
      genreIds,
    } = body;

    if (!title || !synopsis || !posterUrl || !durationMins) {
      return NextResponse.json({ error: "Title, synopsis, poster URL, and duration are required" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") + "-" + Math.floor(100 + Math.random() * 900);

    const [newMovie] = await db
      .insert(movies)
      .values({
        title,
        slug,
        synopsis,
        posterUrl,
        backdropUrl: backdropUrl || posterUrl,
        trailerUrl: trailerUrl || "https://www.youtube.com",
        durationMins: parseInt(durationMins, 10),
        releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
        rating: rating || "PG-13",
        language: language || "English",
        director: director || "Director",
        castMembers: castMembers || "",
        isActive: true,
      })
      .returning();

    // Link genres
    if (genreIds && Array.isArray(genreIds)) {
      for (const genreId of genreIds) {
        await db.insert(movieGenres).values({
          movieId: newMovie.id,
          genreId,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ movie: newMovie }, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN_ADMIN_ONLY") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }
    console.error("Add movie error:", error);
    return NextResponse.json({ error: "Failed to create movie" }, { status: 500 });
  }
}
