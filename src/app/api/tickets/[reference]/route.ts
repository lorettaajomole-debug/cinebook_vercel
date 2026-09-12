import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateQrDataUrl } from "@/lib/qr";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const currentUser = await getCurrentUser();

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.bookingReference, reference.toUpperCase()),
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
        tickets: true,
        payments: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Authorization: User must own the booking OR be Admin OR allow viewing if confirmed ticket
    if (currentUser && booking.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let qrDataUrl = null;
    if (booking.tickets && booking.tickets.length > 0) {
      qrDataUrl = await generateQrDataUrl(booking.tickets[0].qrCodeData);
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        totalSeats: booking.totalSeats,
        totalCents: booking.totalCents,
        createdAt: booking.createdAt,
        user: {
          name: booking.user.name,
          email: booking.user.email,
        },
        showtime: {
          id: booking.showtime.id,
          startTime: booking.showtime.startTime,
          endTime: booking.showtime.endTime,
          movie: {
            title: booking.showtime.movie.title,
            slug: booking.showtime.movie.slug,
            posterUrl: booking.showtime.movie.posterUrl,
            backdropUrl: booking.showtime.movie.backdropUrl,
            rating: booking.showtime.movie.rating,
            durationMins: booking.showtime.movie.durationMins,
            language: booking.showtime.movie.language,
          },
          cinema: {
            name: booking.showtime.auditorium.cinema.name,
            address: booking.showtime.auditorium.cinema.address,
            city: booking.showtime.auditorium.cinema.city,
            state: booking.showtime.auditorium.cinema.state,
            postalCode: booking.showtime.auditorium.cinema.postalCode,
          },
          auditorium: {
            name: booking.showtime.auditorium.name,
            screenType: booking.showtime.auditorium.screenType,
            soundSystem: booking.showtime.auditorium.soundSystem,
          },
        },
        seats: booking.bookingItems.map((bi) => ({
          rowLabel: bi.seat.rowLabel,
          seatNumber: bi.seat.seatNumber,
          seatType: bi.seat.seatType,
          priceCents: bi.priceCents,
        })),
        ticket: booking.tickets[0]
          ? {
              ticketCode: booking.tickets[0].ticketCode,
              qrDataUrl,
              isUsed: booking.tickets[0].isUsed,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}
