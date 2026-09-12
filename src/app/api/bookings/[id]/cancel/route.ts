import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelBookingTransaction } from "@/lib/booking-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "User requested cancellation";

    const result = await cancelBookingTransaction({
      bookingId,
      userId: currentUser.id,
      reason,
    });

    return NextResponse.json({
      message: "Booking cancelled and seats released successfully.",
      ...result,
    });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    const message = error.message || "Failed to cancel booking";
    const status = message.includes("Unauthorized") ? 403 : message.includes("2 hours") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
