import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { holdSeatsTransaction } from "@/lib/booking-engine";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to hold and book seats" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { showtimeId, seatIds } = body;

    if (!showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: "Showtime ID and at least one seat are required" },
        { status: 400 }
      );
    }

    const result = await holdSeatsTransaction({
      showtimeId,
      seatIds,
      userId: user.id,
      holdDurationMinutes: 10,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Hold seats error:", error);
    const message = error.message || "Failed to hold seats";
    const status = message.includes("no longer available") || message.includes("not open for booking") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
