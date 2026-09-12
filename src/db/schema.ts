import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -------------------------------------------------------------
// ENUMS
// -------------------------------------------------------------
export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);
export const seatTypeEnum = pgEnum("seat_type", ["STANDARD", "VIP", "RECLINER", "ACCESSIBLE"]);
export const seatStatusEnum = pgEnum("seat_status", ["AVAILABLE", "HELD", "BOOKED", "BLOCKED"]);
export const showtimeStatusEnum = pgEnum("showtime_status", ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"]);
export const bookingStatusEnum = pgEnum("booking_status", ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED", "REFUNDED"]);
export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"]);

// -------------------------------------------------------------
// 1. USERS
// -------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("USER").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ]
);

// -------------------------------------------------------------
// 2. GENRES
// -------------------------------------------------------------
export const genres = pgTable(
  "genres",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("genres_slug_idx").on(table.slug),
  ]
);

// -------------------------------------------------------------
// 3. MOVIES
// -------------------------------------------------------------
export const movies = pgTable(
  "movies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    synopsis: text("synopsis").notNull(),
    posterUrl: text("poster_url").notNull(),
    backdropUrl: text("backdrop_url").notNull(),
    trailerUrl: text("trailer_url").notNull(),
    durationMins: integer("duration_mins").notNull(),
    releaseDate: timestamp("release_date", { withTimezone: true, mode: "date" }).notNull(),
    rating: varchar("rating", { length: 20 }).notNull().default("PG-13"), // G, PG, PG-13, R, NC-17
    language: varchar("language", { length: 50 }).notNull().default("English"),
    director: varchar("director", { length: 255 }),
    castMembers: text("cast_members"), // Comma-separated actor names
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("movies_slug_idx").on(table.slug),
    index("movies_active_idx").on(table.isActive),
    index("movies_release_idx").on(table.releaseDate),
  ]
);

// -------------------------------------------------------------
// 4. MOVIE_GENRES (Many-to-Many)
// -------------------------------------------------------------
export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id").notNull().references(() => movies.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id").notNull().references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.genreId] }),
    index("movie_genres_movie_idx").on(table.movieId),
    index("movie_genres_genre_idx").on(table.genreId),
  ]
);

// -------------------------------------------------------------
// 5. CINEMAS
// -------------------------------------------------------------
export const cinemas = pgTable(
  "cinemas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    address: varchar("address", { length: 255 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 20 }).notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    phone: varchar("phone", { length: 50 }).notNull(),
    facilities: jsonb("facilities").$type<string[]>().default(["IMAX", "Dolby Atmos", "Recliner Seats", "Parking"]),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("cinemas_city_idx").on(table.city),
    index("cinemas_slug_idx").on(table.slug),
  ]
);

// -------------------------------------------------------------
// 6. AUDITORIUMS
// -------------------------------------------------------------
export const auditoriums = pgTable(
  "auditoriums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cinemaId: uuid("cinema_id").notNull().references(() => cinemas.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(), // e.g. "Screen 1 (IMAX)", "Auditorium 2"
    totalRows: integer("total_rows").notNull().default(8),
    totalCols: integer("total_cols").notNull().default(10),
    totalSeats: integer("total_seats").notNull(),
    soundSystem: varchar("sound_system", { length: 100 }).notNull().default("Dolby Atmos 7.1"),
    screenType: varchar("screen_type", { length: 100 }).notNull().default("IMAX Laser"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("auditoriums_cinema_name_unique_idx").on(table.cinemaId, table.name),
    index("auditoriums_cinema_idx").on(table.cinemaId),
  ]
);

// -------------------------------------------------------------
// 7. SEATS
// -------------------------------------------------------------
export const seats = pgTable(
  "seats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditoriumId: uuid("auditorium_id").notNull().references(() => auditoriums.id, { onDelete: "cascade" }),
    rowLabel: varchar("row_label", { length: 5 }).notNull(), // 'A', 'B', etc.
    seatNumber: integer("seat_number").notNull(), // 1, 2, 3...
    seatType: seatTypeEnum("seat_type").default("STANDARD").notNull(),
    basePriceCents: integer("base_price_cents").notNull().default(1400), // $14.00 in minor units
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("seats_auditorium_position_unique_idx").on(table.auditoriumId, table.rowLabel, table.seatNumber),
    index("seats_auditorium_idx").on(table.auditoriumId),
    index("seats_type_idx").on(table.seatType),
  ]
);

// -------------------------------------------------------------
// 8. SHOWTIMES
// -------------------------------------------------------------
export const showtimes = pgTable(
  "showtimes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    movieId: uuid("movie_id").notNull().references(() => movies.id, { onDelete: "cascade" }),
    auditoriumId: uuid("auditorium_id").notNull().references(() => auditoriums.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true, mode: "date" }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true, mode: "date" }).notNull(),
    priceMultiplier: numeric("price_multiplier", { precision: 4, scale: 2 }).notNull().default("1.00"), // 1.00 standard, 1.25 peak/evening
    status: showtimeStatusEnum("status").default("SCHEDULED").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("showtimes_movie_idx").on(table.movieId),
    index("showtimes_auditorium_idx").on(table.auditoriumId),
    index("showtimes_start_time_idx").on(table.startTime),
    index("showtimes_status_idx").on(table.status),
  ]
);

// -------------------------------------------------------------
// 9. SHOWTIME_SEATS
// -------------------------------------------------------------
export const showtimeSeats = pgTable(
  "showtime_seats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showtimeId: uuid("showtime_id").notNull().references(() => showtimes.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id").notNull().references(() => seats.id, { onDelete: "cascade" }),
    status: seatStatusEnum("status").default("AVAILABLE").notNull(),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true, mode: "date" }),
    heldByUserId: uuid("held_by_user_id").references(() => users.id, { onDelete: "set null" }),
    priceCents: integer("price_cents").notNull(), // Final calculated price for this showtime seat
    version: integer("version").default(1).notNull(), // Optimistic locking
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("showtime_seats_unique_idx").on(table.showtimeId, table.seatId),
    index("showtime_seats_showtime_idx").on(table.showtimeId),
    index("showtime_seats_status_idx").on(table.status),
    index("showtime_seats_hold_expires_idx").on(table.holdExpiresAt),
    index("showtime_seats_held_user_idx").on(table.heldByUserId),
  ]
);

// -------------------------------------------------------------
// 10. BOOKINGS
// -------------------------------------------------------------
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingReference: varchar("booking_reference", { length: 32 }).notNull().unique(), // e.g. "CB-9X82K1"
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    showtimeId: uuid("showtime_id").notNull().references(() => showtimes.id, { onDelete: "cascade" }),
    totalSeats: integer("total_seats").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    bookingFeeCents: integer("booking_fee_cents").notNull().default(150), // $1.50 per order
    taxCents: integer("tax_cents").notNull(), // e.g. 8% tax
    totalCents: integer("total_cents").notNull(),
    status: bookingStatusEnum("status").default("PENDING").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(), // 10 minutes from hold
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bookings_reference_idx").on(table.bookingReference),
    index("bookings_user_idx").on(table.userId),
    index("bookings_showtime_idx").on(table.showtimeId),
    index("bookings_status_idx").on(table.status),
    index("bookings_expires_at_idx").on(table.expiresAt),
  ]
);

// -------------------------------------------------------------
// 11. BOOKING_ITEMS
// -------------------------------------------------------------
export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    showtimeSeatId: uuid("showtime_seat_id").notNull().references(() => showtimeSeats.id, { onDelete: "restrict" }),
    seatId: uuid("seat_id").notNull().references(() => seats.id, { onDelete: "restrict" }),
    priceCents: integer("price_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("booking_items_booking_idx").on(table.bookingId),
    index("booking_items_showtime_seat_idx").on(table.showtimeSeatId),
  ]
);

// -------------------------------------------------------------
// 12. PAYMENTS
// -------------------------------------------------------------
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 10 }).default("USD").notNull(),
    provider: varchar("provider", { length: 50 }).default("cinebook_pay_test").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull().unique(),
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("payments_idempotency_key_idx").on(table.idempotencyKey),
    index("payments_booking_idx").on(table.bookingId),
    index("payments_user_idx").on(table.userId),
    index("payments_status_idx").on(table.status),
  ]
);

// -------------------------------------------------------------
// 13. TICKETS
// -------------------------------------------------------------
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    ticketCode: varchar("ticket_code", { length: 64 }).notNull().unique(), // e.g. "TCK-8921-9923"
    qrCodeData: text("qr_code_data").notNull(), // Embedded payload or QR data URL
    isUsed: boolean("is_used").default(false).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tickets_code_idx").on(table.ticketCode),
    index("tickets_booking_idx").on(table.bookingId),
  ]
);

// -------------------------------------------------------------
// 14. AUDIT_LOGS
// -------------------------------------------------------------
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(), // e.g. "HOLD_SEATS", "CONFIRM_BOOKING", "CANCEL_BOOKING", "RELEASE_EXPIRED_HOLDS"
    entityType: varchar("entity_type", { length: 50 }).notNull(), // e.g. "BOOKING", "PAYMENT", "SHOWTIME", "MOVIE"
    entityId: varchar("entity_id", { length: 255 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_user_idx").on(table.userId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_idx").on(table.createdAt),
  ]
);

// -------------------------------------------------------------
// RELATIONS
// -------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  payments: many(payments),
  auditLogs: many(auditLogs),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, { fields: [movieGenres.movieId], references: [movies.id] }),
  genre: one(genres, { fields: [movieGenres.genreId], references: [genres.id] }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, { fields: [auditoriums.cinemaId], references: [cinemas.id] }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, { fields: [seats.auditoriumId], references: [auditoriums.id] }),
  showtimeSeats: many(showtimeSeats),
  bookingItems: many(bookingItems),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, { fields: [showtimes.movieId], references: [movies.id] }),
  auditorium: one(auditoriums, { fields: [showtimes.auditoriumId], references: [auditoriums.id] }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one, many }) => ({
  showtime: one(showtimes, { fields: [showtimeSeats.showtimeId], references: [showtimes.id] }),
  seat: one(seats, { fields: [showtimeSeats.seatId], references: [seats.id] }),
  heldByUser: one(users, { fields: [showtimeSeats.heldByUserId], references: [users.id] }),
  bookingItems: many(bookingItems),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  showtime: one(showtimes, { fields: [bookings.showtimeId], references: [showtimes.id] }),
  bookingItems: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, { fields: [bookingItems.bookingId], references: [bookings.id] }),
  showtimeSeat: one(showtimeSeats, { fields: [bookingItems.showtimeSeatId], references: [showtimeSeats.id] }),
  seat: one(seats, { fields: [bookingItems.seatId], references: [seats.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, { fields: [tickets.bookingId], references: [bookings.id] }),
}));
