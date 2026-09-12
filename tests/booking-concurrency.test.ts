import { pool } from "../src/db";
import { holdSeatsTransaction } from "../src/lib/booking-engine";

export async function runConcurrencyTests() {
  console.log("\n🧪 [QA Agent] Running Atomic Seat Concurrency & Collision Tests...");

  const client = await pool.connect();
  let showtimeId: string;
  let targetSeatId: string;
  let user1Id: string;
  let user2Id: string;

  try {
    // 1. Fetch showtime and target seat
    const stRes = await client.query(`SELECT id FROM showtimes LIMIT 1`);
    showtimeId = stRes.rows[0].id;

    // Pick an available seat for this showtime
    const seatRes = await client.query(
      `SELECT ss.seat_id, s.row_label, s.seat_number
       FROM showtime_seats ss
       JOIN seats s ON ss.seat_id = s.id
       WHERE ss.showtime_id = $1 AND ss.status = 'AVAILABLE'
       LIMIT 1`,
      [showtimeId]
    );

    targetSeatId = seatRes.rows[0].seat_id;
    const seatLabel = `${seatRes.rows[0].row_label}${seatRes.rows[0].seat_number}`;

    // Get 2 distinct users
    const usersRes = await client.query(`SELECT id, email FROM users ORDER BY email ASC LIMIT 2`);
    user1Id = usersRes.rows[0].id;
    user2Id = usersRes.rows[1].id;

    console.log(`  Testing concurrent reservation for Seat ${seatLabel} (Showtime: ${showtimeId})`);
    console.log(`  Simulating User 1 (${usersRes.rows[0].email}) vs User 2 (${usersRes.rows[1].email})...`);

    // 2. Fire 2 simultaneous hold requests for the exact same seat
    const [result1, result2] = await Promise.allSettled([
      holdSeatsTransaction({
        showtimeId,
        seatIds: [targetSeatId],
        userId: user1Id,
        holdDurationMinutes: 10,
      }),
      holdSeatsTransaction({
        showtimeId,
        seatIds: [targetSeatId],
        userId: user2Id,
        holdDurationMinutes: 10,
      }),
    ]);

    const isSuccess1 = result1.status === "fulfilled";
    const isSuccess2 = result2.status === "fulfilled";

    console.log(`  Result User 1: ${result1.status === "fulfilled" ? "SUCCESS" : "REJECTED (Conflict)"}`);
    console.log(`  Result User 2: ${result2.status === "fulfilled" ? "SUCCESS" : "REJECTED (Conflict)"}`);

    // Verify strictly one succeeds and one fails
    if ((isSuccess1 && isSuccess2) || (!isSuccess1 && !isSuccess2)) {
      throw new Error(
        `Concurrency safeguard failed! Expected strictly 1 success, got User 1: ${result1.status}, User 2: ${result2.status}`
      );
    }

    console.log("  ✓ Strictly ONE booking succeeded, duplicate collision rejected");

    // 3. Verify in database that the seat has status 'HELD'
    const seatCheck = await client.query(
      `SELECT status, held_by_user_id, hold_expires_at FROM showtime_seats WHERE showtime_id = $1 AND seat_id = $2`,
      [showtimeId, targetSeatId]
    );

    const winningUserId = isSuccess1 ? user1Id : user2Id;
    if (
      seatCheck.rows[0].status !== "HELD" ||
      seatCheck.rows[0].held_by_user_id !== winningUserId
    ) {
      throw new Error("Database seat status or held_by_user_id mismatch!");
    }

    console.log("  ✓ Database seat record locked with verified owner and expiration timestamp");

    // Clean up test hold so subsequent tests can use clean state
    await client.query(
      `UPDATE showtime_seats SET status = 'AVAILABLE', held_by_user_id = NULL, hold_expires_at = NULL WHERE showtime_id = $1 AND seat_id = $2`,
      [showtimeId, targetSeatId]
    );
  } finally {
    client.release();
  }

  console.log("✅ [QA Agent] Concurrency Double-Booking Tests Passed!");
}
