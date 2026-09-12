import { runAuthTests } from "./auth.test";
import { runConcurrencyTests } from "./booking-concurrency.test";
import { runHoldExpiryTests } from "./hold-expiry.test";
import { runPricingAndPaymentTests } from "./pricing-and-payment.test";
import { runSecurityIsolationTests } from "./security-isolation.test";
import { pool } from "../src/db";

async function runAllTests() {
  console.log("===============================================================");
  console.log("🎬 TEAM CINEBOOK: AUTOMATED QA VALIDATION SUITE");
  console.log("===============================================================");
  const startTime = Date.now();

  try {
    // 1. Auth Tests
    await runAuthTests();

    // 2. Concurrency & Race Condition Tests
    await runConcurrencyTests();

    // 3. Hold Expiry & Automatic Cleanup Worker Tests
    await runHoldExpiryTests();

    // 4. Financial Calculations & Payment Idempotency Tests
    await runPricingAndPaymentTests();

    // 5. Security Isolation & Role Protection Tests
    await runSecurityIsolationTests();

    console.log("\n===============================================================");
    console.log(`🎉 ALL QA VALIDATION SUITES PASSED (100%) in ${Date.now() - startTime}ms!`);
    console.log("===============================================================\n");
  } catch (err) {
    console.error("\n❌ [QA Agent] Test Suite Encountered a Failure:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAllTests();
