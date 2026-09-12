import { pool } from "../src/db";
import { holdSeatsTransaction, cancelBookingTransaction } from "../src/lib/booking-engine";

export async function runSecurityIsolationTests() {
  console.log("\n🧪 [QA Agent] Running Security Isolation & Role Protection Tests...");

  const client = await pool.connect();
  try {
    // 1. Fetch User A and User B
    const usersRes = await client.query(`SELECT id, email, role FROM users ORDER BY email ASC LIMIT 2`);
    const userA = usersRes.rows[0];
    const userB = usersRes.rows[1];

    const stRes = await client.query(`SELECT id, start_time FROM showtimes LIMIT 1`);
    const showtimeId = stRes.rows[0].id;

    const seatRes = await client.query(
      `SELECT ss.seat_id FROM showtime_seats ss WHERE ss.showtime_id = $1 AND ss.status = 'AVAILABLE' LIMIT 1`,
      [showtimeId]
    );
    const seatId = seatRes.rows[0].seat_id;

    // Create booking for User A
    const holdA = await holdSeatsTransaction({
      showtimeId,
      seatIds: [seatId],
      userId: userA.id,
      holdDurationMinutes: 10,
    });

    console.log(`  Created booking ${holdA.bookingReference} owned by User A (${userA.email})`);

    // 2. User B tries to cancel User A's booking -> MUST FAIL
    let didFailUnauthorized = false;
    try {
      await cancelBookingTransaction({
        bookingId: holdA.bookingId,
        userId: userB.id, // User B attempting to cancel User A's booking
      });
    } catch (err: any) {
      if (err.message.includes("Unauthorized")) {
        didFailUnauthorized = true;
      }
    }

    if (!didFailUnauthorized) {
      throw new Error("Security breach! User B was able to cancel User A's booking!");
    }
    console.log("  ✓ Cross-tenant security isolation enforced (User B blocked with Unauthorized)");

    // 3. User A cancels their own booking -> MUST SUCCEED and release seats
    const cancelRes = await cancelBookingTransaction({
      bookingId: holdA.bookingId,
      userId: userA.id,
    });

    if (!cancelRes.success) {
      throw new Error("User A failed to cancel own booking!");
    }
    console.log("  ✓ User A successfully cancelled own booking");

    // 4. Verify in DB that seat is back to AVAILABLE
    const seatCheck = await client.query(
      `SELECT status, held_by_user_id FROM showtime_seats WHERE showtime_id = $1 AND seat_id = $2`,
      [showtimeId, seatId]
    );

    if (seatCheck.rows[0].status !== "AVAILABLE" || seatCheck.rows[0].held_by_user_id !== null) {
      throw new Error("Cancelled seat was not released to AVAILABLE!");
    }
    console.log("  ✓ Seat automatically released back to AVAILABLE in auditorium inventory");
  } finally {
    client.release();
  }

  console.log("✅ [QA Agent] Security Isolation Tests Passed!");
}
