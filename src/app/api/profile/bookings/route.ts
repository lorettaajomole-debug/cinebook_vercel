import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateQrDataUrl } from "@/lib/qr";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userBookings = await db.query.bookings.findMany({
      where: eq(bookings.userId, user.id),
      with: {
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
      orderBy: [desc(bookings.createdAt)],
    });

    const enriched = await Promise.all(
      userBookings.map(async (b) => {
        let qrDataUrl = null;
        if (b.tickets && b.tickets.length > 0) {
          qrDataUrl = await generateQrDataUrl(b.tickets[0].qrCodeData);
        }

        return {
          id: b.id,
          bookingReference: b.bookingReference,
          status: b.status,
          totalSeats: b.totalSeats,
          subtotalCents: b.subtotalCents,
          bookingFeeCents: b.bookingFeeCents,
          taxCents: b.taxCents,
          totalCents: b.totalCents,
          expiresAt: b.expiresAt,
          createdAt: b.createdAt,
          showtime: {
            id: b.showtime.id,
            startTime: b.showtime.startTime,
            endTime: b.showtime.endTime,
            movie: {
              id: b.showtime.movie.id,
              title: b.showtime.movie.title,
              slug: b.showtime.movie.slug,
              posterUrl: b.showtime.movie.posterUrl,
              rating: b.showtime.movie.rating,
              durationMins: b.showtime.movie.durationMins,
            },
            cinema: {
              name: b.showtime.auditorium.cinema.name,
              address: b.showtime.auditorium.cinema.address,
              city: b.showtime.auditorium.cinema.city,
            },
            auditorium: {
              name: b.showtime.auditorium.name,
              screenType: b.showtime.auditorium.screenType,
            },
          },
          seats: b.bookingItems.map((item) => ({
            rowLabel: item.seat.rowLabel,
            seatNumber: item.seat.seatNumber,
            seatType: item.seat.seatType,
          })),
          ticket: b.tickets[0]
            ? {
                ticketCode: b.tickets[0].ticketCode,
                qrDataUrl,
                isUsed: b.tickets[0].isUsed,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ bookings: enriched });
  } catch (error: any) {
    console.error("Profile bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
