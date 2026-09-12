import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cinemas, showtimes, movies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const cinema = await db.query.cinemas.findFirst({
      where: eq(cinemas.slug, slug),
      with: {
        auditoriums: {
          with: {
            showtimes: {
              where: eq(showtimes.status, "SCHEDULED"),
              with: {
                movie: true,
              },
              orderBy: (showtimes, { asc }) => [asc(showtimes.startTime)],
            },
          },
        },
      },
    });

    if (!cinema) {
      return NextResponse.json({ error: "Cinema not found" }, { status: 404 });
    }

    return NextResponse.json({ cinema });
  } catch (error: any) {
    console.error("Error fetching cinema:", error);
    return NextResponse.json({ error: "Failed to fetch cinema" }, { status: 500 });
  }
}
