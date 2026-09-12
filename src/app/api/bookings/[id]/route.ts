import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { generateQrDataUrl } from "@/lib/qr";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
      with: {
        user: true,
        showtime: {
          with: {
            movie: true,
            auditorium: {
              with: {
                cinema: true,
              },
            },
          },
        },
        bookingItems: {
          with: {
            seat: true,
          },
        },
        payments: true,
        tickets: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Security isolation: regular user can only view their own bookings
    if (booking.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate QR Data URL if ticket exists
    let qrDataUrl = null;
    if (booking.tickets && booking.tickets.length > 0) {
      qrDataUrl = await generateQrDataUrl(booking.tickets[0].qrCodeData);
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        userId: booking.userId,
        status: booking.status,
        totalSeats: booking.totalSeats,
        subtotalCents: booking.subtotalCents,
        bookingFeeCents: booking.bookingFeeCents,
        taxCents: booking.taxCents,
        totalCents: booking.totalCents,
        expiresAt: booking.expiresAt,
        createdAt: booking.createdAt,
        showtime: {
          id: booking.showtime.id,
          startTime: booking.showtime.startTime,
          endTime: booking.showtime.endTime,
          movie: {
            id: booking.showtime.movie.id,
            title: booking.showtime.movie.title,
            slug: booking.showtime.movie.slug,
            posterUrl: booking.showtime.movie.posterUrl,
            backdropUrl: booking.showtime.movie.backdropUrl,
            durationMins: booking.showtime.movie.durationMins,
            rating: booking.showtime.movie.rating,
          },
          cinema: {
            name: booking.showtime.auditorium.cinema.name,
            address: booking.showtime.auditorium.cinema.address,
            city: booking.showtime.auditorium.cinema.city,
            state: booking.showtime.auditorium.cinema.state,
          },
          auditorium: {
            name: booking.showtime.auditorium.name,
            screenType: booking.showtime.auditorium.screenType,
            soundSystem: booking.showtime.auditorium.soundSystem,
          },
        },
        items: booking.bookingItems.map((bi) => ({
          id: bi.id,
          seatId: bi.seat.id,
          rowLabel: bi.seat.rowLabel,
          seatNumber: bi.seat.seatNumber,
          seatType: bi.seat.seatType,
          priceCents: bi.priceCents,
        })),
        ticket: booking.tickets[0]
          ? {
              id: booking.tickets[0].id,
              ticketCode: booking.tickets[0].ticketCode,
              qrDataUrl,
              isUsed: booking.tickets[0].isUsed,
            }
          : null,
        payments: booking.payments,
      },
    });
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    return NextResponse.json({ error: "Failed to fetch booking details" }, { status: 500 });
  }
}
