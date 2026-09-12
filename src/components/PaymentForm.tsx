"use client";

import { useState } from "react";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Smartphone,
  Gift,
  Tag,
} from "lucide-react";

interface PaymentFormProps {
  bookingId: string;
  totalCents: number;
  onSuccess: (data: { bookingReference: string; ticket: any }) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

type PaymentMethod = "card" | "apple_pay" | "google_pay" | "paypal" | "voucher";

export default function PaymentForm({
  bookingId,
  totalCents,
  onSuccess,
  onError,
  disabled,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  // Card fields
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("28");
  const [cvc, setCvc] = useState("888");
  const [cardholderName, setCardholderName] = useState("Alex Johnson");

  // Voucher field
  const [voucherCode, setVoucherCode] = useState("CINE100");

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate unique idempotency key for this payment attempt
  const [idempotencyKey] = useState(() => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  const formattedTotal = `$${(totalCents / 100).toFixed(2)}`;

  const setTestCard = (num: string, name: string) => {
    setCardNumber(num);
    setCardholderName(name);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentMethod,
          cardNumber: paymentMethod === "card" ? cardNumber : undefined,
          cardExpMonth: paymentMethod === "card" ? expMonth : undefined,
          cardExpYear: paymentMethod === "card" ? expYear : undefined,
          cardCvc: paymentMethod === "card" ? cvc : undefined,
          voucherCode: paymentMethod === "voucher" ? voucherCode : undefined,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const err = data.error || "Payment processing failed";
        setErrorMessage(err);
        onError(err);
        return;
      }

      onSuccess({
        bookingReference: data.bookingReference,
        ticket: data.ticket,
      });
    } catch (err: any) {
      const msg = err.message || "Network error while processing payment";
      setErrorMessage(msg);
      onError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-surface border border-surface-border p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Payment Method</h3>
            <p className="text-[11px] text-gray-400">Encrypted 256-bit SSL in Test Mode</p>
          </div>
        </div>

        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
          <ShieldCheck className="h-3 w-3" /> Test Mode
        </span>
      </div>

      {/* Payment Method Selector Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => {
            setPaymentMethod("card");
            setErrorMessage(null);
          }}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
            paymentMethod === "card"
              ? "bg-accent-cyan border-cyan-400 text-gray-950 shadow-glow-cyan"
              : "bg-surface-raised border-surface-border text-gray-300 hover:border-accent-cyan/40"
          }`}
        >
          <CreditCard className="h-4 w-4 mb-1" />
          <span>Card</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPaymentMethod("apple_pay");
            setErrorMessage(null);
          }}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
            paymentMethod === "apple_pay"
              ? "bg-white border-gray-200 text-black shadow-lg"
              : "bg-surface-raised border-surface-border text-gray-300 hover:border-white/40"
          }`}
        >
          <Smartphone className="h-4 w-4 mb-1" />
          <span>Apple Pay</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPaymentMethod("google_pay");
            setErrorMessage(null);
          }}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
            paymentMethod === "google_pay"
              ? "bg-blue-600 border-blue-400 text-white shadow-glow-cyan"
              : "bg-surface-raised border-surface-border text-gray-300 hover:border-blue-400/40"
          }`}
        >
          <Smartphone className="h-4 w-4 mb-1" />
          <span>Google Pay</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPaymentMethod("paypal");
            setErrorMessage(null);
          }}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
            paymentMethod === "paypal"
              ? "bg-amber-400 border-amber-300 text-gray-950 shadow-glow-gold"
              : "bg-surface-raised border-surface-border text-gray-300 hover:border-amber-400/40"
          }`}
        >
          <Sparkles className="h-4 w-4 mb-1" />
          <span>PayPal</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPaymentMethod("voucher");
            setErrorMessage(null);
          }}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            paymentMethod === "voucher"
              ? "bg-purple-600 border-purple-400 text-white shadow-lg"
              : "bg-surface-raised border-surface-border text-gray-300 hover:border-purple-400/40"
          }`}
        >
          <Gift className="h-4 w-4 mb-1" />
          <span>Voucher</span>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-800 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Method 1: Credit / Debit Card Form */}
      {paymentMethod === "card" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick 1-Click Test Cards */}
          <div className="rounded-xl bg-surface-raised/80 border border-surface-border p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
              1-Click Test Cards:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTestCard("4242 4242 4242 4242", "Success Card")}
                className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-900/50 transition-colors"
              >
                <CheckCircle className="h-3 w-3" /> Success (4242)
              </button>
              <button
                type="button"
                onClick={() => setTestCard("4000 0000 0000 0002", "Declined Card")}
                className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-red-950/40 border border-red-800/60 text-[10px] font-semibold text-red-400 hover:bg-red-900/50 transition-colors"
              >
                <AlertCircle className="h-3 w-3" /> Declined (...0002)
              </button>
              <button
                type="button"
                onClick={() => setTestCard("4000 0000 0000 0069", "Fraud Card")}
                className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-[10px] font-semibold text-amber-400 hover:bg-amber-900/50 transition-colors"
              >
                <AlertCircle className="h-3 w-3" /> Fraud (...0069)
              </button>
              <button
                type="button"
                onClick={() => setTestCard("4000 0000 0000 0999", "Timeout Card")}
                className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-purple-950/40 border border-purple-800/60 text-[10px] font-semibold text-purple-400 hover:bg-purple-900/50 transition-colors"
              >
                <AlertCircle className="h-3 w-3" /> Timeout (...0999)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Cardholder Name</label>
            <input
              type="text"
              required
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className="w-full rounded-xl bg-surface-raised border border-surface-border px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Card Number</label>
            <div className="relative">
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full rounded-xl bg-surface-raised border border-surface-border pl-10 pr-3.5 py-2 text-xs font-mono text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none"
              />
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Exp Month</label>
              <input
                type="text"
                maxLength={2}
                required
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value)}
                className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-xs text-center font-mono text-white focus:border-accent-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Exp Year</label>
              <input
                type="text"
                maxLength={2}
                required
                value={expYear}
                onChange={(e) => setExpYear(e.target.value)}
                className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-xs text-center font-mono text-white focus:border-accent-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">CVC</label>
              <input
                type="password"
                maxLength={4}
                required
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                className="w-full rounded-xl bg-surface-raised border border-surface-border px-3 py-2 text-xs text-center font-mono text-white focus:border-accent-cyan focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled || isProcessing}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-600 py-3 text-sm font-bold text-gray-950 shadow-glow-cyan hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                Processing Card Payment...
              </span>
            ) : (
              <>
                <Lock className="h-4 w-4 text-gray-950" />
                Pay {formattedTotal} with Card
              </>
            )}
          </button>
        </form>
      )}

      {/* Method 2: Apple Pay Form */}
      {paymentMethod === "apple_pay" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-black border border-gray-800 p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center mx-auto text-xl font-bold">
              
            </div>
            <h4 className="text-sm font-bold text-white">Pay with Apple Pay</h4>
            <p className="text-xs text-gray-400">
              Confirm your purchase of <strong className="text-white">{formattedTotal}</strong> using Touch ID or Face ID.
            </p>
          </div>

          <button
            type="submit"
            disabled={disabled || isProcessing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-gray-100 text-black py-3.5 text-sm font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? "Authorizing Apple Pay..." : ` Pay ${formattedTotal}`}
          </button>
        </form>
      )}

      {/* Method 3: Google Pay Form */}
      {paymentMethod === "google_pay" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-surface-raised border border-surface-border p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-lg font-bold">
              G
            </div>
            <h4 className="text-sm font-bold text-white">Google Pay Express</h4>
            <p className="text-xs text-gray-400">
              Instant checkout using your saved cards on Google Account for <strong className="text-white">{formattedTotal}</strong>.
            </p>
          </div>

          <button
            type="submit"
            disabled={disabled || isProcessing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white py-3.5 text-sm font-bold shadow-glow-cyan transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? "Authorizing Google Pay..." : `G Pay ${formattedTotal}`}
          </button>
        </form>
      )}

      {/* Method 4: PayPal Form */}
      {paymentMethod === "paypal" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-amber-950/20 border border-amber-800/40 p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto text-lg font-bold">
              P
            </div>
            <h4 className="text-sm font-bold text-white">PayPal Express Checkout</h4>
            <p className="text-xs text-gray-400">
              Pay with your PayPal balance or linked bank account.
            </p>
          </div>

          <button
            type="submit"
            disabled={disabled || isProcessing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 py-3.5 text-sm font-bold shadow-glow-gold transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? "Connecting to PayPal..." : `PayPal Checkout (${formattedTotal})`}
          </button>
        </form>
      )}

      {/* Method 5: Gift Card / Voucher Promo Form */}
      {paymentMethod === "voucher" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-purple-950/30 border border-purple-800/50 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Test Voucher Codes:
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setVoucherCode("CINE100")}
                className="px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-700 text-purple-200 text-[11px] font-mono font-bold hover:bg-purple-800"
              >
                CINE100 (100% Off)
              </button>
              <button
                type="button"
                onClick={() => setVoucherCode("VIP50")}
                className="px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-700 text-purple-200 text-[11px] font-mono font-bold hover:bg-purple-800"
              >
                VIP50 (Pass VIP)
              </button>
              <button
                type="button"
                onClick={() => setVoucherCode("GOLDMEMBER")}
                className="px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-700 text-purple-200 text-[11px] font-mono font-bold hover:bg-purple-800"
              >
                GOLDMEMBER
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Enter Gift Card or Voucher Code
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="e.g. CINE100"
                className="w-full rounded-xl bg-surface-raised border border-surface-border pl-10 pr-3.5 py-2.5 text-xs font-mono uppercase text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled || isProcessing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white py-3.5 text-sm font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? "Redeeming Voucher..." : "Redeem Voucher & Issue Ticket"}
          </button>
        </form>
      )}
    </div>
  );
}
