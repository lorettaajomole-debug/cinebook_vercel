# 🎬 CineBook — Production-Ready Cinema Ticket-Booking Platform

[![Vercel Ready](https://img.shields.io/badge/Vercel-Deployment%20Ready-000000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15%20App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Neon Serverless PostgreSQL](https://img.shields.io/badge/Neon-Serverless%20PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=for-the-badge)](https://orm.drizzle.team)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

**CineBook** is an ultra-premium, production-grade cinema ticket reservation platform engineered for high-concurrency ticket locking, real-time auditorium seat maps, test-mode payment processing with idempotency keys, digital QR tickets, and self-service booking cancellations.

---

## 👥 Multi-Agent Architecture (Team CineBook)

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TEAM CINEBOOK ARCHITECTURE                              │
├──────────────────────────────┬──────────────────────────────┬───────────────────────────┤
│    AGENT 1: APP AGENT        │  AGENT 2: DATABASE ENGINE    │    AGENT 3: QA AGENT      │
├──────────────────────────────┼──────────────────────────────┼───────────────────────────┤
│ • Cinematic Dark Theme UI    │ • 14 PostgreSQL DB Tables    │ • Auth & Session Tests    │
│ • Real-Time Seat Selection   │ • Row-Level Locks FOR UPDATE │ • Concurrency Race Tests  │
│ • 10-Min Hold Reservation    │ • Atomic Hold Transactions   │ • Hold Expiration Tests   │
│ • Multi-Method Checkout      │ • Idempotent Cleanup Worker  │ • Payment Idempotency     │
│ • Digital Pass with Live QR  │ • 120 Scheduled Showtimes    │ • Tenant Isolation Tests  │
│ • Admin Control Centre       │ • 7,680 Seat Inventories     │ • Next.js Build Verifier  │
└──────────────────────────────┴──────────────────────────────┴───────────────────────────┘
```

### 1. App Agent (Agent 1)
- **Cinematic Responsive UI**: Dark aesthetic (`#080B11`), glowing neon accents (cyan, cinema gold, ruby), glassmorphism cards, and fluid micro-animations.
- **Pages**:
  - `Home (/)`: Hero carousel with trailer video modal, dynamic filter bar (Genre, Language, Cinema, Date), Now Showing & Coming Soon tabs, Featured Flagship Cinemas.
  - `Movies (/movies, /movies/[slug])`: Catalog with multi-dimensional filtering, movie details with trailer, synopsis, cast, ratings, and embedded showtimes selector by cinema & date.
  - `Cinemas (/cinemas, /cinemas/[slug])`: Directory of premium IMAX, Dolby Atmos, and VIP Luxe screens with auditorium schedules.
  - `Seat Map (/showtimes/[id]/seats)`: Real-time visual seat map reflecting auditorium layout with curved glowing screen, live status colors, and instant price calculation.
  - `Checkout (/checkout/[bookingId])`: 10-minute hold countdown timer, order breakdown (tickets, $1.50 fee, 8% tax), and test-mode payment form with 1-click test cards.
  - `Digital Ticket (/tickets/[bookingReference])`: Boarding-pass movie ticket with live QR code, `.ics` calendar export, and print stylesheet.
  - `My Bookings (/profile/bookings)`: Active passes, past screenings, and self-service booking cancellation with automatic seat release.
  - `Authentication (/login, /register)`: Secure auth with 1-click quick credentials for Demo User and Administrator.
  - `Admin Portal (/admin)`: Real-time KPIs (revenue, tickets, occupancy %), movie management, showtime scheduler with automatic seat generation, audit log inspector, and manual hold cleanup trigger.

### 2. Database Engine Agent (Agent 2)
- **Database Schema**: 14 PostgreSQL tables with UUID primary keys, UTC timestamps, integer minor units (cents), unique constraints, foreign keys, cascade rules, and indexes.
  - `users`, `genres`, `movies`, `movie_genres`, `cinemas`, `auditoriums`, `seats`, `showtimes`, `showtime_seats`, `bookings`, `booking_items`, `payments`, `tickets`, `audit_logs`.
- **Atomic Concurrency Engine**:
  - `SELECT ... FOR UPDATE` row locks prevent double-booking race conditions.
  - 10-minute temporary seat hold with automatic expiration.
  - Server-side price calculation with integer minor units.
  - Idempotent seat hold release worker (`/api/cron/release-holds`) protected by `CRON_SECRET`.
- **Seed Data**: 6 blockbuster movies, 3 flagship cinemas, 6 auditoriums, full seat layouts, and 120 scheduled showtimes with 7,680 seat inventories.

### 3. QA Agent (Agent 3)
- **Automated Validation Suite**:
  - `auth.test.ts`: Password hashing, JWT signing/verification, role check.
  - `booking-concurrency.test.ts`: 2 concurrent requests trying to book the exact same seat simultaneously. Verifies strictly 1 succeeds and 1 gets rejected with conflict.
  - `hold-expiry.test.ts`: Hold expiration simulation and cleanup idempotency.
  - `pricing-and-payment.test.ts`: Financial precision, taxes, fees, payment provider test mode, and idempotency key safeguard.
  - `security-isolation.test.ts`: User A vs User B isolation, 2-hour cancellation rule, and admin authorization guard.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Framework** | Next.js 15+ (App Router, Server Actions, Route Handlers) |
| **Language** | TypeScript (Strict mode) |
| **Styling** | Tailwind CSS with custom cinema tokens & glassmorphism |
| **Database** | Neon Serverless PostgreSQL / PostgreSQL 18 |
| **ORM** | Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `pg`, `@neondatabase/serverless`) |
| **Auth** | Secure HTTP-only cookies with signed `jose` JWTs & `bcryptjs` hashing |
| **QR Generation** | `qrcode` SVG / Data URI generation |
| **Deployment** | Vercel Serverless Functions + Vercel Cron Jobs |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ (Tested on Node.js 22 & 26)
- PostgreSQL database (Local PostgreSQL or Neon Serverless instance)

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure the following variables in `.env`:
```env
# Neon Serverless PostgreSQL or Local Connection String
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-1.aws.neon.tech/cinebook?sslmode=require"

# Authentication Secret (min 32 characters)
JWT_SECRET="cinebook_super_secure_jwt_secret_production_key_2026_vercel"

# Cron Secret for /api/cron/release-holds
CRON_SECRET="cinebook_cron_secret_worker_auth_key_998877"

# Payment Engine Mode (test or production)
PAYMENT_PROVIDER_MODE="test"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Migrations & Seed Database
```bash
# Generate SQL migrations and push to database
npm run db:migrate

# Seed movies, cinemas, auditoriums, seats, and showtimes
npm run db:seed
```

### 5. Run Automated QA Test Suite
```bash
npm run test
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@cinebook.com` | `Admin123!` |
| **Demo Customer** | `demo@cinebook.com` | `User123!` |

*(Both accounts feature 1-click quick login buttons on the `/login` page).*

---

## 💳 Test Payment Cards

| Card Number | Expiration | CVC | Expected Result |
|---|---|---|---|
| `4242 4242 4242 4242` | `12/28` | `123` | **Success** (Instant confirmation & QR ticket) |
| `4000 0000 0000 0002` | `12/28` | `123` | **Card Declined** |
| `4000 0000 0000 0069` | `12/28` | `123` | **Insufficient Funds / Fraud Alert** |
| `4000 0000 0000 0999` | `12/28` | `123` | **Payment Timeout (Retryable)** |

---

## 🌐 Deploying to Vercel

### Step 1: Provision Neon PostgreSQL on Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Navigate to the **Storage** / **Marketplace** tab and select **Neon Serverless PostgreSQL**.
3. Create a new database and link it to your project.
4. Vercel will automatically populate `DATABASE_URL` and `POSTGRES_URL` in your project environment variables.

### Step 2: Configure Environment Variables in Vercel
Under **Settings** > **Environment Variables**, ensure the following are set:
- `DATABASE_URL`: Pooled connection string from Neon (`sslmode=require`)
- `JWT_SECRET`: Random 32+ character string
- `CRON_SECRET`: Random secret string
- `PAYMENT_PROVIDER_MODE`: `test`

### Step 3: Run Database Migrations in Vercel Build Step
In your Vercel Project Settings under **Build & Development Settings**, you can set the build command to:
```bash
npm run db:migrate && next build
```
Or run `npm run db:seed` via local CLI pointing to the production database.

### Step 4: Verify Vercel Cron Job
The `vercel.json` file configures the hold release cron:
```json
{
  "crons": [
    {
      "path": "/api/cron/release-holds",
      "schedule": "*/10 * * * *"
    }
  ]
}
```
Vercel Cron will automatically trigger `/api/cron/release-holds` every 10 minutes to release uncompleted seat holds back to the inventory.

---

## 🧪 Verification & QA Summary

Run the comprehensive QA validation script anytime:
```bash
npm run test
```
Sample test run output:
```
===============================================================
🎬 TEAM CINEBOOK: AUTOMATED QA VALIDATION SUITE
===============================================================

🧪 [QA Agent] Running Authentication & Session Tests...
  ✓ Password hashing and bcrypt verification pass
  ✓ JWT session token signing and verification pass
  ✓ Admin account exists in database with ADMIN role
  ✓ Demo user account exists in database with USER role
✅ [QA Agent] All Authentication Tests Passed!

🧪 [QA Agent] Running Atomic Seat Concurrency & Collision Tests...
  Result User 1: SUCCESS
  Result User 2: REJECTED (Conflict)
  ✓ Strictly ONE booking succeeded, duplicate collision rejected
  ✓ Database seat record locked with verified owner and expiration timestamp
✅ [QA Agent] Concurrency Double-Booking Tests Passed!

🧪 [QA Agent] Running Hold Expiration & Automatic Cleanup Tests...
  Worker executed: released 1 seat(s), expired 1 booking(s)
  ✓ Expired seat returned to AVAILABLE in database
  ✓ Expired booking transitioned to EXPIRED status
  ✓ Idempotency verified (repeated runs are safe with 0 side-effects)
✅ [QA Agent] Hold Expiry Tests Passed!

🧪 [QA Agent] Running Financial Arithmetic & Payment Flow Tests...
  ✓ Server-side price calculation with integer cents verified
  ✓ Test mode payment processed successfully
  ✓ Booking confirmed with Ticket Code
  ✓ Payment idempotency verified: duplicate key returns existing payment without re-charging
  ✓ Card decline simulation verified (status: FAILED, error message captured)
✅ [QA Agent] Pricing & Payment Tests Passed!

🧪 [QA Agent] Running Security Isolation & Role Protection Tests...
  ✓ Cross-tenant security isolation enforced (User B blocked with Unauthorized)
  ✓ User A successfully cancelled own booking
  ✓ Seat automatically released back to AVAILABLE in auditorium inventory
✅ [QA Agent] Security Isolation Tests Passed!

===============================================================
🎉 ALL QA VALIDATION SUITES PASSED (100%)
===============================================================
```

---

## 📄 License
MIT License © {new Date().getFullYear()} CineBook Inc.
