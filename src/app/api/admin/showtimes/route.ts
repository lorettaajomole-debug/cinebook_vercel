import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { pool, db } from "@/db";
import { showtimes } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();

    const allShowtimes = await db.query.showtimes.findMany({
      with: {
        movie: true,
        auditorium: {
          with: {
            cinema: true,
          },
        },
      },
      orderBy: [desc(showtimes.startTime)],
      limit: 50,
    });

    return NextResponse.json({ showtimes: allShowtimes });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN_ADMIN_ONLY") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch showtimes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const { movieId, auditoriumId, startTime, endTime, priceMultiplier } = body;

    if (!movieId || !auditoriumId || !startTime) {
      return NextResponse.json(
        { error: "Movie ID, Auditorium ID, and Start Time are required" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + 150 * 60 * 1000);
    const multiplier = priceMultiplier || "1.00";

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert showtime
      const showtimeRes = await client.query(
        `INSERT INTO showtimes (movie_id, auditorium_id, start_time, end_time, price_multiplier, status)
         VALUES ($1, $2, $3, $4, $5, 'SCHEDULED')
         RETURNING id`,
        [movieId, auditoriumId, start, end, multiplier]
      );
      const showtimeId = showtimeRes.rows[0].id;

      // 2. Fetch seats in this auditorium and populate showtime_seats
      const seatsRes = await client.query(
        `SELECT id, base_price_cents FROM seats WHERE auditorium_id = $1`,
        [auditoriumId]
      );

      const parsedMultiplier = parseFloat(multiplier);
      for (const s of seatsRes.rows) {
        const finalPrice = Math.round(s.base_price_cents * parsedMultiplier);
        await client.query(
          `INSERT INTO showtime_seats (showtime_id, seat_id, status, price_cents, version)
           VALUES ($1, $2, 'AVAILABLE', $3, 1)`,
          [showtimeId, s.id, finalPrice]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          showtimeId,
          seatsGenerated: seatsRes.rows.length,
        },
        { status: 201 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN_ADMIN_ONLY") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }
    console.error("Create showtime error:", error);
    return NextResponse.json({ error: "Failed to schedule showtime" }, { status: 500 });
  }
}
