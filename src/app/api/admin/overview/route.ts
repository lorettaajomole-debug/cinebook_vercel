import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { pool } from "@/db";

export async function GET() {
  try {
    await requireAdmin();

    const client = await pool.connect();
    try {
      // 1. Total Revenue
      const revRes = await client.query(`
        SELECT COALESCE(SUM(amount_cents), 0) as total_revenue_cents
        FROM payments
        WHERE status = 'SUCCEEDED'
      `);

      // 2. Total Bookings & Tickets
      const countRes = await client.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_bookings,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_bookings,
          COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_bookings,
          COALESCE(SUM(total_seats) FILTER (WHERE status = 'CONFIRMED'), 0) as total_tickets_sold
        FROM bookings
      `);

      // 3. Active Showtimes & Total Capacity
      const showtimesRes = await client.query(`
        SELECT
          COUNT(*) as total_showtimes,
          COUNT(*) FILTER (WHERE status = 'SCHEDULED') as active_showtimes
        FROM showtimes
      `);

      // 4. Seat Occupancy Rate
      const occupancyRes = await client.query(`
        SELECT
          COUNT(*) as total_seats_count,
          COUNT(*) FILTER (WHERE status = 'BOOKED') as booked_seats_count,
          COUNT(*) FILTER (WHERE status = 'HELD') as held_seats_count
        FROM showtime_seats
      `);

      // 5. Recent bookings
      const recentBookingsRes = await client.query(`
        SELECT b.id, b.booking_reference, b.total_seats, b.total_cents, b.status, b.created_at,
               u.name as user_name, u.email as user_email,
               m.title as movie_title, c.name as cinema_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN showtimes s ON b.showtime_id = s.id
        JOIN movies m ON s.movie_id = m.id
        JOIN auditoriums a ON s.auditorium_id = a.id
        JOIN cinemas c ON a.cinema_id = c.id
        ORDER BY b.created_at DESC
        LIMIT 10
      `);

      const totalSeats = parseInt(occupancyRes.rows[0].total_seats_count || "0", 10);
      const bookedSeats = parseInt(occupancyRes.rows[0].booked_seats_count || "0", 10);
      const occupancyPercent = totalSeats > 0 ? ((bookedSeats / totalSeats) * 100).toFixed(1) : "0.0";

      return NextResponse.json({
        metrics: {
          totalRevenueCents: parseInt(revRes.rows[0].total_revenue_cents || "0", 10),
          confirmedBookings: parseInt(countRes.rows[0].confirmed_bookings || "0", 10),
          pendingBookings: parseInt(countRes.rows[0].pending_bookings || "0", 10),
          cancelledBookings: parseInt(countRes.rows[0].cancelled_bookings || "0", 10),
          totalTicketsSold: parseInt(countRes.rows[0].total_tickets_sold || "0", 10),
          activeShowtimes: parseInt(showtimesRes.rows[0].active_showtimes || "0", 10),
          totalShowtimes: parseInt(showtimesRes.rows[0].total_showtimes || "0", 10),
          occupancyPercent: `${occupancyPercent}%`,
        },
        recentBookings: recentBookingsRes.rows,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN_ADMIN_ONLY") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Failed to load admin overview" }, { status: 500 });
  }
}
