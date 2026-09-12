import { pool } from "@/db";
import { db } from "@/db";
import {
  bookings,
  bookingItems,
  showtimeSeats,
  seats,
  showtimes,
  movies,
  cinemas,
  auditoriums,
  tickets,
  payments,
  auditLogs,
  users,
} from "@/db/schema";
import { eq, and, inArray, lt, sql } from "drizzle-orm";
import crypto from "crypto";

export interface HoldSeatsParams {
  showtimeId: string;
  seatIds: string[];
  userId: string;
  holdDurationMinutes?: number;
}

export interface HoldSeatsResult {
  bookingId: string;
  bookingReference: string;
  expiresAt: Date;
  totalSeats: number;
  subtotalCents: number;
  bookingFeeCents: number;
  taxCents: number;
  totalCents: number;
  heldSeats: Array<{
    showtimeSeatId: string;
    seatId: string;
    rowLabel: string;
    seatNumber: number;
    seatType: string;
    priceCents: number;
  }>;
}

export interface ConfirmBookingParams {
  bookingId: string;
  userId: string;
  paymentId: string;
  providerPaymentId?: string;
  idempotencyKey: string;
}

/**
 * Generate human-friendly, uppercase alphanumeric booking reference (e.g. CB-9F28A1)
 */
export function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "CB-";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

/**
 * Generate unique ticket code (e.g. TCK-8921-9943)
 */
export function generateTicketCode(): string {
  const randomPart1 = Math.floor(1000 + Math.random() * 9000);
  const randomPart2 = Math.floor(1000 + Math.random() * 9000);
  return `TCK-${randomPart1}-${randomPart2}`;
}

/**
 * ATOMIC SEAT HOLDING ENGINE
 * Uses PostgreSQL row-level locks (SELECT ... FOR UPDATE) inside a transaction
 * to prevent double-booking race conditions.
 */
export async function holdSeatsTransaction({
  showtimeId,
  seatIds,
  userId,
  holdDurationMinutes = 10,
}: HoldSeatsParams): Promise<HoldSeatsResult> {
  if (!seatIds || seatIds.length === 0) {
    throw new Error("No seats specified for reservation");
  }
  if (seatIds.length > 10) {
    throw new Error("Cannot book more than 10 seats at once");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Fetch showtime details
    const showtimeRes = await client.query(
      `SELECT id, movie_id, auditorium_id, price_multiplier, status FROM showtimes WHERE id = $1`,
      [showtimeId]
    );

    if (showtimeRes.rows.length === 0) {
      throw new Error("Showtime not found");
    }

    const showtime = showtimeRes.rows[0];
    if (showtime.status !== "SCHEDULED") {
      throw new Error(`Showtime is not open for booking (status: ${showtime.status})`);
    }

    const multiplier = parseFloat(showtime.price_multiplier || "1.00");

    // 2. Lock requested showtime-seat records with FOR UPDATE
    const seatIdPlaceholders = seatIds.map((_, i) => `$${i + 2}`).join(", ");
    const lockSeatsQuery = `
      SELECT ss.id as showtime_seat_id, ss.showtime_id, ss.seat_id, ss.status,
             ss.hold_expires_at, ss.held_by_user_id, ss.price_cents, ss.version,
             s.row_label, s.seat_number, s.seat_type, s.base_price_cents
      FROM showtime_seats ss
      JOIN seats s ON ss.seat_id = s.id
      WHERE ss.showtime_id = $1 AND ss.seat_id IN (${seatIdPlaceholders})
      FOR UPDATE
    `;

    const lockResult = await client.query(lockSeatsQuery, [showtimeId, ...seatIds]);
    const lockedRows = lockResult.rows;

    if (lockedRows.length !== seatIds.length) {
      throw new Error("One or more selected seats do not exist for this showtime");
    }

    const now = new Date();

    // 3. Verify that all seats are either AVAILABLE or currently held by this same user
    for (const seatRow of lockedRows) {
      const isAvailable = seatRow.status === "AVAILABLE";
      const isExpiredHold =
        seatRow.status === "HELD" &&
        seatRow.hold_expires_at &&
        new Date(seatRow.hold_expires_at) < now;
      const isHeldByCurrentUser =
        seatRow.status === "HELD" &&
        seatRow.held_by_user_id === userId &&
        seatRow.hold_expires_at &&
        new Date(seatRow.hold_expires_at) >= now;

      if (!isAvailable && !isExpiredHold && !isHeldByCurrentUser) {
        throw new Error(
          `Seat ${seatRow.row_label}${seatRow.seat_number} is no longer available (status: ${seatRow.status})`
        );
      }
    }

    // 4. Calculate prices on server
    let subtotalCents = 0;
    const heldSeatsInfo = [];
    const holdExpiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);

    for (const seatRow of lockedRows) {
      // Calculate seat price = base_price * multiplier
      const calculatedPrice = Math.round(seatRow.base_price_cents * multiplier);
      subtotalCents += calculatedPrice;

      // Update showtime_seat to HELD
      await client.query(
        `UPDATE showtime_seats
         SET status = 'HELD',
             hold_expires_at = $1,
             held_by_user_id = $2,
             price_cents = $3,
             version = version + 1,
             updated_at = NOW()
         WHERE id = $4`,
        [holdExpiresAt, userId, calculatedPrice, seatRow.showtime_seat_id]
      );

      heldSeatsInfo.push({
        showtimeSeatId: seatRow.showtime_seat_id,
        seatId: seatRow.seat_id,
        rowLabel: seatRow.row_label,
        seatNumber: seatRow.seat_number,
        seatType: seatRow.seat_type,
        priceCents: calculatedPrice,
      });
    }

    // Fixed booking fee per order: $1.50 (150 cents)
    const bookingFeeCents = 150;
    // 8% tax calculation
    const taxCents = Math.round((subtotalCents + bookingFeeCents) * 0.08);
    const totalCents = subtotalCents + bookingFeeCents + taxCents;

    // 5. Create PENDING booking
    const bookingReference = generateBookingReference();
    const insertBookingRes = await client.query(
      `INSERT INTO bookings (
         booking_reference, user_id, showtime_id, total_seats,
         subtotal_cents, booking_fee_cents, tax_cents, total_cents,
         status, expires_at, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, NOW(), NOW())
       RETURNING id`,
      [
        bookingReference,
        userId,
        showtimeId,
        seatIds.length,
        subtotalCents,
        bookingFeeCents,
        taxCents,
        totalCents,
        holdExpiresAt,
      ]
    );

    const bookingId = insertBookingRes.rows[0].id;

    // 6. Create booking_items
    for (const seatInfo of heldSeatsInfo) {
      await client.query(
        `INSERT INTO booking_items (booking_id, showtime_seat_id, seat_id, price_cents, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [bookingId, seatInfo.showtimeSeatId, seatInfo.seatId, seatInfo.priceCents]
      );
    }

    // 7. Write audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, 'HOLD_SEATS', 'BOOKING', $2, $3, NOW())`,
      [
        userId,
        bookingId,
        JSON.stringify({
          seatsCount: seatIds.length,
          totalCents,
          bookingReference,
        }),
      ]
    );

    await client.query("COMMIT");

    return {
      bookingId,
      bookingReference,
      expiresAt: holdExpiresAt,
      totalSeats: seatIds.length,
      subtotalCents,
      bookingFeeCents,
      taxCents,
      totalCents,
      heldSeats: heldSeatsInfo,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * CONFIRM BOOKING AFTER PAYMENT
 * Locks booking and showtime_seats, transitions to CONFIRMED / BOOKED, generates digital tickets
 */
export async function confirmBookingTransaction({
  bookingId,
  userId,
  paymentId,
  providerPaymentId,
  idempotencyKey,
}: ConfirmBookingParams) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Lock booking record
    const bookingRes = await client.query(
      `SELECT id, booking_reference, user_id, showtime_id, total_cents, status, expires_at
       FROM bookings
       WHERE id = $1
       FOR UPDATE`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookingRes.rows[0];

    // Check ownership
    if (booking.user_id !== userId) {
      throw new Error("Unauthorized to confirm this booking");
    }

    // Check if already confirmed (idempotent confirmation)
    if (booking.status === "CONFIRMED") {
      // Find existing ticket
      const ticketRes = await client.query(
        `SELECT ticket_code, qr_code_data FROM tickets WHERE booking_id = $1`,
        [bookingId]
      );
      await client.query("COMMIT");
      return {
        success: true,
        bookingReference: booking.booking_reference,
        status: "CONFIRMED",
        ticket: ticketRes.rows[0] || null,
        alreadyConfirmed: true,
      };
    }

    if (booking.status !== "PENDING") {
      throw new Error(`Cannot confirm booking with status ${booking.status}`);
    }

    // Check if hold has expired
    if (new Date(booking.expires_at) < new Date()) {
      await client.query(
        `UPDATE bookings SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
        [bookingId]
      );
      throw new Error("Seat hold has expired. Please select your seats again.");
    }

    // 2. Fetch and lock booking items and showtime seats
    const itemsRes = await client.query(
      `SELECT bi.showtime_seat_id, ss.status, ss.held_by_user_id
       FROM booking_items bi
       JOIN showtime_seats ss ON bi.showtime_seat_id = ss.id
       WHERE bi.booking_id = $1
       FOR UPDATE OF ss`,
      [bookingId]
    );

    // Verify all seats are still held by this user
    for (const item of itemsRes.rows) {
      if (item.status !== "HELD" || item.held_by_user_id !== userId) {
        throw new Error("One or more seats are no longer reserved for your session");
      }
    }

    // 3. Mark showtime_seats as BOOKED
    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE showtime_seats
         SET status = 'BOOKED',
             hold_expires_at = NULL,
             held_by_user_id = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [userId, item.showtime_seat_id]
      );
    }

    // 4. Mark booking as CONFIRMED
    await client.query(
      `UPDATE bookings
       SET status = 'CONFIRMED',
           updated_at = NOW()
       WHERE id = $1`,
      [bookingId]
    );

    // 5. Update payment record to SUCCEEDED
    await client.query(
      `UPDATE payments
       SET status = 'SUCCEEDED',
           provider_payment_id = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [providerPaymentId || `pay_${Date.now()}`, paymentId]
    );

    // 6. Generate digital ticket
    const ticketCode = generateTicketCode();
    const qrPayload = JSON.stringify({
      ref: booking.booking_reference,
      tck: ticketCode,
      uid: userId,
      showtimeId: booking.showtime_id,
      ts: Date.now(),
    });

    const ticketRes = await client.query(
      `INSERT INTO tickets (booking_id, ticket_code, qr_code_data, is_used, created_at)
       VALUES ($1, $2, $3, FALSE, NOW())
       RETURNING id, ticket_code, qr_code_data, created_at`,
      [bookingId, ticketCode, qrPayload]
    );

    // 7. Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, 'CONFIRM_BOOKING', 'BOOKING', $2, $3, NOW())`,
      [
        userId,
        bookingId,
        JSON.stringify({
          ticketCode,
          bookingReference: booking.booking_reference,
          idempotencyKey,
        }),
      ]
    );

    await client.query("COMMIT");

    return {
      success: true,
      bookingReference: booking.booking_reference,
      status: "CONFIRMED",
      ticket: ticketRes.rows[0],
      alreadyConfirmed: false,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * CANCEL BOOKING
 * Releases seats back to AVAILABLE, marks booking as CANCELLED, updates payment to REFUNDED
 */
export async function cancelBookingTransaction({
  bookingId,
  userId,
  reason = "User requested cancellation",
}: {
  bookingId: string;
  userId: string;
  reason?: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock booking
    const bookingRes = await client.query(
      `SELECT b.id, b.booking_reference, b.user_id, b.status, s.start_time
       FROM bookings b
       JOIN showtimes s ON b.showtime_id = s.id
       WHERE b.id = $1
       FOR UPDATE OF b`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookingRes.rows[0];

    // Authorization
    if (booking.user_id !== userId) {
      throw new Error("Unauthorized to cancel this booking");
    }

    if (booking.status === "CANCELLED") {
      await client.query("COMMIT");
      return { success: true, alreadyCancelled: true };
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
      throw new Error(`Cannot cancel booking with status ${booking.status}`);
    }

    // Policy: Cancellation is allowed up to 2 hours before showtime
    const showtimeStart = new Date(booking.start_time);
    const minCancelTime = new Date(showtimeStart.getTime() - 2 * 60 * 60 * 1000);
    if (new Date() > minCancelTime && booking.status === "CONFIRMED") {
      throw new Error("Bookings can only be cancelled up to 2 hours before showtime.");
    }

    // Lock and release showtime seats
    const itemsRes = await client.query(
      `SELECT bi.showtime_seat_id
       FROM booking_items bi
       WHERE bi.booking_id = $1`,
      [bookingId]
    );

    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE showtime_seats
         SET status = 'AVAILABLE',
             hold_expires_at = NULL,
             held_by_user_id = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [item.showtime_seat_id]
      );
    }

    // Update booking status
    await client.query(
      `UPDATE bookings
       SET status = 'CANCELLED',
           updated_at = NOW()
       WHERE id = $1`,
      [bookingId]
    );

    // Update payment to REFUNDED if was SUCCEEDED
    await client.query(
      `UPDATE payments
       SET status = 'REFUNDED',
           updated_at = NOW()
       WHERE booking_id = $1 AND status = 'SUCCEEDED'`,
      [bookingId]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, 'CANCEL_BOOKING', 'BOOKING', $2, $3, NOW())`,
      [
        userId,
        bookingId,
        JSON.stringify({
          bookingReference: booking.booking_reference,
          reason,
        }),
      ]
    );

    await client.query("COMMIT");
    return { success: true, bookingReference: booking.booking_reference };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * IDEMPOTENT HOLD CLEANUP WORKER
 * Releases all expired HELD seats and marks corresponding PENDING bookings as EXPIRED
 */
export async function releaseExpiredHoldsWorker(): Promise<{
  releasedSeatsCount: number;
  expiredBookingsCount: number;
}> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const now = new Date();

    // 1. Find all expired HELD showtime seats
    const expiredSeatsRes = await client.query(
      `UPDATE showtime_seats
       SET status = 'AVAILABLE',
           hold_expires_at = NULL,
           held_by_user_id = NULL,
           updated_at = NOW()
       WHERE status = 'HELD' AND hold_expires_at < $1
       RETURNING id`,
      [now]
    );

    // 2. Find and expire all PENDING bookings that have past expires_at
    const expiredBookingsRes = await client.query(
      `UPDATE bookings
       SET status = 'EXPIRED',
           updated_at = NOW()
       WHERE status = 'PENDING' AND expires_at < $1
       RETURNING id`,
      [now]
    );

    const releasedSeatsCount = expiredSeatsRes.rows.length;
    const expiredBookingsCount = expiredBookingsRes.rows.length;

    if (releasedSeatsCount > 0 || expiredBookingsCount > 0) {
      await client.query(
        `INSERT INTO audit_logs (action, entity_type, entity_id, metadata, created_at)
         VALUES ('RELEASE_EXPIRED_HOLDS', 'SYSTEM', 'CRON', $1, NOW())`,
        [
          JSON.stringify({
            releasedSeatsCount,
            expiredBookingsCount,
            timestamp: now.toISOString(),
          }),
        ]
      );
    }

    await client.query("COMMIT");

    return {
      releasedSeatsCount,
      expiredBookingsCount,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
