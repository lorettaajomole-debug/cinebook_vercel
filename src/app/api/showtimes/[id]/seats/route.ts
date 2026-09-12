import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { showtimes, showtimeSeats, seats, auditoriums, movies, cinemas } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;
    const currentUser = await getCurrentUser();

    // 1. Fetch showtime with movie and auditorium details
    const showtime = await db.query.showtimes.findFirst({
      where: eq(showtimes.id, showtimeId),
      with: {
        movie: true,
        auditorium: {
          with: {
            cinema: true,
          },
        },
      },
    });

    if (!showtime) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }

    // 2. Fetch all showtime_seats joined with seat data
    const showtimeSeatsList = await db.query.showtimeSeats.findMany({
      where: eq(showtimeSeats.showtimeId, showtimeId),
      with: {
        seat: true,
      },
    });

    const now = new Date();

    // 3. Format seats for UI layout
    const formattedSeats = showtimeSeatsList.map((ss) => {
      let currentStatus = ss.status;

      // If hold has expired, treat it as AVAILABLE in real-time
      if (currentStatus === "HELD" && ss.holdExpiresAt && new Date(ss.holdExpiresAt) < now) {
        currentStatus = "AVAILABLE";
      }

      const isHeldByMe =
        currentStatus === "HELD" &&
        currentUser?.id &&
        ss.heldByUserId === currentUser.id &&
        ss.holdExpiresAt &&
        new Date(ss.holdExpiresAt) >= now;

      return {
        showtimeSeatId: ss.id,
        seatId: ss.seat.id,
        rowLabel: ss.seat.rowLabel,
        seatNumber: ss.seat.seatNumber,
        seatType: ss.seat.seatType,
        priceCents: ss.priceCents,
        status: currentStatus,
        isHeldByMe: Boolean(isHeldByMe),
        holdExpiresAt: ss.holdExpiresAt,
      };
    });

    // Sort by rowLabel then seatNumber
    formattedSeats.sort((a, b) => {
      if (a.rowLabel === b.rowLabel) {
        return a.seatNumber - b.seatNumber;
      }
      return a.rowLabel.localeCompare(b.rowLabel);
    });

    return NextResponse.json({
      showtime: {
        id: showtime.id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        priceMultiplier: showtime.priceMultiplier,
        status: showtime.status,
        movie: {
          id: showtime.movie.id,
          title: showtime.movie.title,
          slug: showtime.movie.slug,
          posterUrl: showtime.movie.posterUrl,
          durationMins: showtime.movie.durationMins,
          rating: showtime.movie.rating,
          language: showtime.movie.language,
        },
        cinema: {
          id: showtime.auditorium.cinema.id,
          name: showtime.auditorium.cinema.name,
          address: showtime.auditorium.cinema.address,
          city: showtime.auditorium.cinema.city,
        },
        auditorium: {
          id: showtime.auditorium.id,
          name: showtime.auditorium.name,
          soundSystem: showtime.auditorium.soundSystem,
          screenType: showtime.auditorium.screenType,
          totalRows: showtime.auditorium.totalRows,
          totalCols: showtime.auditorium.totalCols,
          totalSeats: showtime.auditorium.totalSeats,
        },
      },
      seats: formattedSeats,
    });
  } catch (error: any) {
    console.error("Error fetching showtime seats:", error);
    return NextResponse.json({ error: "Failed to fetch seat map" }, { status: 500 });
  }
}
