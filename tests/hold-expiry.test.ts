import { pool } from "../src/db";
import { releaseExpiredHoldsWorker } from "../src/lib/booking-engine";

export async function runHoldExpiryTests() {
  console.log("\n🧪 [QA Agent] Running Hold Expiration & Automatic Cleanup Tests...");

  const client = await pool.connect();
  try {
    // 1. Setup an expired hold directly
    const stRes = await client.query(`SELECT id FROM showtimes LIMIT 1`);
    const showtimeId = stRes.rows[0].id;

    const seatRes = await client.query(
      `SELECT ss.id as showtime_seat_id, ss.seat_id
       FROM showtime_seats ss
       WHERE ss.showtime_id = $1 AND ss.status = 'AVAILABLE'
       LIMIT 1`,
      [showtimeId]
    );

    const showtimeSeatId = seatRes.rows[0].showtime_seat_id;
    const seatId = seatRes.rows[0].seat_id;

    const userRes = await client.query(`SELECT id FROM users LIMIT 1`);
    const userId = userRes.rows[0].id;

    // Simulate hold expired 5 minutes ago
    const pastDate = new Date(Date.now() - 5 * 60 * 1000);

    await client.query(
      `UPDATE showtime_seats
       SET status = 'HELD',
           hold_expires_at = $1,
           held_by_user_id = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [pastDate, userId, showtimeSeatId]
    );

    const testRef = `CB-EXP${Math.floor(100000 + Math.random() * 900000)}`;
    const bookingRes = await client.query(
      `INSERT INTO bookings (
         booking_reference, user_id, showtime_id, total_seats,
         subtotal_cents, booking_fee_cents, tax_cents, total_cents,
         status, expires_at, created_at, updated_at
       ) VALUES ($1, $2, $3, 1, 1500, 150, 132, 1782, 'PENDING', $4, NOW(), NOW())
       RETURNING id`,
      [testRef, userId, showtimeId, pastDate]
    );
    const bookingId = bookingRes.rows[0].id;

    console.log("  Simulated expired seat hold and pending booking in past timestamp");

    // 2. Run hold release worker
    const workerResult = await releaseExpiredHoldsWorker();
    console.log(`  Worker executed: released ${workerResult.releasedSeatsCount} seat(s), expired ${workerResult.expiredBookingsCount} booking(s)`);

    if (workerResult.releasedSeatsCount < 1 || workerResult.expiredBookingsCount < 1) {
      throw new Error("Cleanup worker failed to release expired records!");
    }

    // 3. Verify seat is now AVAILABLE
    const seatCheck = await client.query(
      `SELECT status, hold_expires_at, held_by_user_id FROM showtime_seats WHERE id = $1`,
      [showtimeSeatId]
    );

    if (
      seatCheck.rows[0].status !== "AVAILABLE" ||
      seatCheck.rows[0].held_by_user_id !== null
    ) {
      throw new Error("Seat status was not reset to AVAILABLE!");
    }
    console.log("  ✓ Expired seat returned to AVAILABLE in database");

    // 4. Verify booking is now EXPIRED
    const bookingCheck = await client.query(
      `SELECT status FROM bookings WHERE id = $1`,
      [bookingId]
    );

    if (bookingCheck.rows[0].status !== "EXPIRED") {
      throw new Error("Booking status was not updated to EXPIRED!");
    }
    console.log("  ✓ Expired booking transitioned to EXPIRED status");

    // 5. Test Idempotency: Running worker again immediately should release 0
    const secondRun = await releaseExpiredHoldsWorker();
    if (secondRun.releasedSeatsCount !== 0 || secondRun.expiredBookingsCount !== 0) {
      throw new Error("Cleanup worker is not idempotent!");
    }
    console.log("  ✓ Idempotency verified (repeated runs are safe with 0 side-effects)");
  } finally {
    client.release();
  }

  console.log("✅ [QA Agent] Hold Expiry Tests Passed!");
}
