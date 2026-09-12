import { pool, db } from "../src/db";
import { holdSeatsTransaction, confirmBookingTransaction } from "../src/lib/booking-engine";
import { processTestPayment } from "../src/lib/payment-provider";

export async function runPricingAndPaymentTests() {
  console.log("\n🧪 [QA Agent] Running Financial Arithmetic & Payment Flow Tests...");

  const client = await pool.connect();
  try {
    // 1. Fetch user and showtime
    const userRes = await client.query(`SELECT id FROM users WHERE email = 'demo@cinebook.com'`);
    const userId = userRes.rows[0].id;

    const stRes = await client.query(`
      SELECT s.id, s.price_multiplier, m.title
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      LIMIT 1
    `);
    const showtime = stRes.rows[0];

    // Pick 2 available seats
    const seatsRes = await client.query(
      `SELECT ss.seat_id, s.base_price_cents
       FROM showtime_seats ss
       JOIN seats s ON ss.seat_id = s.id
       WHERE ss.showtime_id = $1 AND ss.status = 'AVAILABLE'
       LIMIT 2`,
      [showtime.id]
    );

    const seatIds = seatsRes.rows.map((r: any) => r.seat_id);
    const multiplier = parseFloat(showtime.price_multiplier);

    // Calculate expected pricing in integer minor units
    let expectedSubtotal = 0;
    for (const s of seatsRes.rows) {
      expectedSubtotal += Math.round(s.base_price_cents * multiplier);
    }
    const expectedFee = 150;
    const expectedTax = Math.round((expectedSubtotal + expectedFee) * 0.08);
    const expectedTotal = expectedSubtotal + expectedFee + expectedTax;

    console.log(`  Expected Subtotal: $${(expectedSubtotal / 100).toFixed(2)}, Fee: $${(expectedFee / 100).toFixed(2)}, Tax: $${(expectedTax / 100).toFixed(2)}, Total: $${(expectedTotal / 100).toFixed(2)}`);

    // 2. Perform hold
    const hold = await holdSeatsTransaction({
      showtimeId: showtime.id,
      seatIds,
      userId,
      holdDurationMinutes: 10,
    });

    if (
      hold.subtotalCents !== expectedSubtotal ||
      hold.bookingFeeCents !== expectedFee ||
      hold.taxCents !== expectedTax ||
      hold.totalCents !== expectedTotal
    ) {
      throw new Error("Financial calculation precision mismatch!");
    }
    console.log("  ✓ Server-side price calculation with integer cents verified");

    // 3. Process Test Payment with Idempotency Key
    const idempotencyKey = `qa_test_idemp_${Date.now()}`;
    const paymentResult = await processTestPayment({
      bookingId: hold.bookingId,
      userId,
      amountCents: hold.totalCents,
      cardNumber: "4242 4242 4242 4242",
      cardExpMonth: "12",
      cardExpYear: "28",
      cardCvc: "123",
      idempotencyKey,
    });

    if (!paymentResult.success || paymentResult.status !== "SUCCEEDED") {
      throw new Error("Test payment failed unexpectedly!");
    }
    console.log("  ✓ Test mode payment processed successfully");

    // 4. Confirm Booking & Issue Ticket
    const confirmation = await confirmBookingTransaction({
      bookingId: hold.bookingId,
      userId,
      paymentId: paymentResult.paymentId,
      providerPaymentId: paymentResult.providerPaymentId,
      idempotencyKey,
    });

    if (!confirmation.success || confirmation.status !== "CONFIRMED" || !confirmation.ticket) {
      throw new Error("Booking confirmation or ticket generation failed!");
    }
    console.log(`  ✓ Booking confirmed (Ref: ${confirmation.bookingReference}) with Ticket Code (${confirmation.ticket.ticket_code})`);

    // 5. Test Payment Idempotency: Try paying again with duplicate idempotency key
    const duplicatePayment = await processTestPayment({
      bookingId: hold.bookingId,
      userId,
      amountCents: hold.totalCents,
      cardNumber: "4242 4242 4242 4242",
      cardExpMonth: "12",
      cardExpYear: "28",
      cardCvc: "123",
      idempotencyKey,
    });

    if (!duplicatePayment.isDuplicate || duplicatePayment.paymentId !== paymentResult.paymentId) {
      throw new Error("Payment idempotency safeguard failed!");
    }
    console.log("  ✓ Payment idempotency verified: duplicate key returns existing payment without re-charging");

    // 6. Test Card Decline Simulator
    const declineIdempKey = `qa_decline_${Date.now()}`;
    const declinedPayment = await processTestPayment({
      bookingId: hold.bookingId,
      userId,
      amountCents: hold.totalCents,
      cardNumber: "4000 0000 0000 0002", // Test declined card
      cardExpMonth: "12",
      cardExpYear: "28",
      cardCvc: "123",
      idempotencyKey: declineIdempKey,
    });

    if (declinedPayment.success || declinedPayment.status !== "FAILED") {
      throw new Error("Card decline simulation failed!");
    }
    console.log("  ✓ Card decline simulation verified (status: FAILED, error message captured)");
  } finally {
    client.release();
  }

  console.log("✅ [QA Agent] Pricing & Payment Tests Passed!");
}
