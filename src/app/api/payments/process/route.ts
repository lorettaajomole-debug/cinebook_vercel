import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processTestPayment } from "@/lib/payment-provider";
import { confirmBookingTransaction } from "@/lib/booking-engine";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      bookingId,
      paymentMethod = "card",
      cardNumber,
      cardExpMonth,
      cardExpYear,
      cardCvc,
      voucherCode,
      idempotencyKey,
    } = body;

    if (!bookingId || !idempotencyKey) {
      return NextResponse.json(
        { error: "Booking ID and Idempotency Key are required" },
        { status: 400 }
      );
    }

    // 1. Fetch booking to verify ownership and total amount
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized for this booking" }, { status: 403 });
    }

    if (booking.status === "CONFIRMED") {
      // Idempotent recovery
      const confirmation = await confirmBookingTransaction({
        bookingId,
        userId: user.id,
        paymentId: "already_confirmed",
        idempotencyKey,
      });
      return NextResponse.json({
        success: true,
        bookingReference: booking.bookingReference,
        ticket: confirmation.ticket,
      });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: `Booking cannot be paid (status: ${booking.status})` },
        { status: 400 }
      );
    }

    // 2. Process Payment through Test Provider
    const paymentResult = await processTestPayment({
      bookingId,
      userId: user.id,
      amountCents: booking.totalCents,
      paymentMethod,
      cardNumber: cardNumber || "4242424242424242",
      cardExpMonth: cardExpMonth || "12",
      cardExpYear: cardExpYear || "28",
      cardCvc: cardCvc || "123",
      voucherCode,
      idempotencyKey,
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        {
          error: paymentResult.errorMessage || "Payment declined",
          paymentId: paymentResult.paymentId,
          status: paymentResult.status,
        },
        { status: 402 } // Payment Required
      );
    }

    // 3. Confirm booking & issue tickets inside atomic transaction
    const confirmation = await confirmBookingTransaction({
      bookingId,
      userId: user.id,
      paymentId: paymentResult.paymentId,
      providerPaymentId: paymentResult.providerPaymentId,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      bookingReference: confirmation.bookingReference,
      ticket: confirmation.ticket,
    });
  } catch (error: any) {
    console.error("Payment processing error:", error);
    const message = error.message || "Failed to process payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
