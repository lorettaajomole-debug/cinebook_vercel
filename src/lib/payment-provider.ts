import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export interface ProcessPaymentParams {
  bookingId: string;
  userId: string;
  amountCents: number;
  paymentMethod?: "card" | "apple_pay" | "google_pay" | "paypal" | "voucher";
  cardNumber?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  cardCvc?: string;
  voucherCode?: string;
  idempotencyKey: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  providerPaymentId?: string;
  status: "SUCCEEDED" | "FAILED" | "PENDING";
  errorMessage?: string;
  isDuplicate?: boolean;
}

/**
 * Process a payment in Test Mode across multiple payment methods with Idempotency Key protection
 */
export async function processTestPayment({
  bookingId,
  userId,
  amountCents,
  paymentMethod = "card",
  cardNumber = "4242424242424242",
  cardExpMonth = "12",
  cardExpYear = "28",
  cardCvc = "123",
  voucherCode,
  idempotencyKey,
}: ProcessPaymentParams): Promise<PaymentResult> {
  // 1. Check idempotency key first to prevent double-billing
  const existingPayment = await db.query.payments.findFirst({
    where: eq(payments.idempotencyKey, idempotencyKey),
  });

  if (existingPayment) {
    return {
      success: existingPayment.status === "SUCCEEDED",
      paymentId: existingPayment.id,
      providerPaymentId: existingPayment.providerPaymentId || undefined,
      status: existingPayment.status as "SUCCEEDED" | "FAILED" | "PENDING",
      errorMessage: existingPayment.status === "FAILED" ? "Payment failed previously" : undefined,
      isDuplicate: true,
    };
  }

  let status: "SUCCEEDED" | "FAILED" = "SUCCEEDED";
  let errorMessage: string | undefined;
  let metadata: Record<string, any> = {
    method: paymentMethod,
    processedAt: new Date().toISOString(),
  };

  const providerPaymentId = `${paymentMethod}_test_${crypto.randomBytes(12).toString("hex")}`;

  if (paymentMethod === "card") {
    const sanitizedCard = cardNumber.replace(/\s+/g, "");
    if (sanitizedCard.endsWith("0002")) {
      status = "FAILED";
      errorMessage = "Card declined: Your card was rejected by your bank.";
    } else if (sanitizedCard.endsWith("0069")) {
      status = "FAILED";
      errorMessage = "Transaction declined: Insufficient funds or fraud suspicion.";
    } else if (sanitizedCard.endsWith("0999")) {
      status = "FAILED";
      errorMessage = "Payment network timeout. Please retry your payment.";
    } else if (sanitizedCard.length < 13 || sanitizedCard.length > 19) {
      status = "FAILED";
      errorMessage = "Invalid card number format.";
    }

    metadata = {
      ...metadata,
      last4: sanitizedCard.slice(-4),
      exp: `${cardExpMonth}/${cardExpYear}`,
      errorMessage: errorMessage || null,
    };
  } else if (paymentMethod === "apple_pay") {
    // Apple Pay Simulation
    status = "SUCCEEDED";
    metadata = {
      ...metadata,
      device: "Apple Pay (Touch ID / Face ID Token)",
      cardBrand: "Apple Card MasterCard",
      last4: "8899",
    };
  } else if (paymentMethod === "google_pay") {
    // Google Pay Simulation
    status = "SUCCEEDED";
    metadata = {
      ...metadata,
      wallet: "Google Wallet Verified",
      cardBrand: "Visa Direct",
      last4: "4321",
    };
  } else if (paymentMethod === "paypal") {
    // PayPal Simulation
    status = "SUCCEEDED";
    metadata = {
      ...metadata,
      payerEmail: "user-paypal@cinebook.com",
      expressCheckout: true,
    };
  } else if (paymentMethod === "voucher") {
    const code = (voucherCode || "").trim().toUpperCase();
    const validVouchers = ["VIP50", "CINE100", "FREEMOVIE", "GOLDMEMBER", "CINEPASS"];
    if (!validVouchers.includes(code)) {
      status = "FAILED";
      errorMessage = "Invalid or expired CineBook voucher code. Try 'CINE100' or 'VIP50'.";
    } else {
      status = "SUCCEEDED";
      metadata = {
        ...metadata,
        voucherCode: code,
        discountApplied: "100%",
      };
    }
  }

  // Create payment record in DB
  const [newPayment] = await db
    .insert(payments)
    .values({
      bookingId,
      userId,
      amountCents,
      currency: "USD",
      provider: `cinebook_${paymentMethod}`,
      idempotencyKey,
      providerPaymentId: status === "SUCCEEDED" ? providerPaymentId : null,
      status,
      metadata,
    })
    .returning();

  return {
    success: status === "SUCCEEDED",
    paymentId: newPayment.id,
    providerPaymentId: status === "SUCCEEDED" ? providerPaymentId : undefined,
    status,
    errorMessage,
    isDuplicate: false,
  };
}
