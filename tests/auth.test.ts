import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../src/lib/auth";
import { pool } from "../src/db";

export async function runAuthTests() {
  console.log("\n🧪 [QA Agent] Running Authentication & Session Tests...");

  // 1. Password hashing & verification
  const password = "SuperSecretPassword123!";
  const hash = await hashPassword(password);
  const isValid = await verifyPassword(password, hash);
  const isInvalid = await verifyPassword("WrongPassword!", hash);

  if (!isValid || isInvalid) {
    throw new Error("Password verification failed!");
  }
  console.log("  ✓ Password hashing and bcrypt verification pass");

  // 2. JWT Session Signing & Verification
  const testUser = {
    id: "a0000000-0000-0000-0000-000000000001",
    email: "test@cinebook.com",
    name: "Test User",
    role: "USER" as const,
  };

  const token = await signSessionToken(testUser);
  const decoded = await verifySessionToken(token);

  if (!decoded || decoded.email !== testUser.email || decoded.role !== "USER") {
    throw new Error("JWT token signing or verification failed!");
  }
  console.log("  ✓ JWT session token signing and verification pass");

  // 3. User Lookup from DB
  const client = await pool.connect();
  try {
    const adminRes = await client.query(`SELECT id, email, role FROM users WHERE email = 'admin@cinebook.com'`);
    if (adminRes.rows.length === 0 || adminRes.rows[0].role !== "ADMIN") {
      throw new Error("Admin user seed verification failed!");
    }
    console.log("  ✓ Admin account exists in database with ADMIN role");

    const demoUserRes = await client.query(`SELECT id, email, role FROM users WHERE email = 'demo@cinebook.com'`);
    if (demoUserRes.rows.length === 0 || demoUserRes.rows[0].role !== "USER") {
      throw new Error("Demo user seed verification failed!");
    }
    console.log("  ✓ Demo user account exists in database with USER role");
  } finally {
    client.release();
  }

  console.log("✅ [QA Agent] All Authentication Tests Passed!");
}
