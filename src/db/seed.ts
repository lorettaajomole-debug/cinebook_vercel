import { pool } from "./index";
import { hashPassword } from "../lib/auth";

async function seed() {
  console.log("🌱 [Database Engine Agent] Seeding CineBook database...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Clean up existing data
    console.log("🧹 Clearing old records...");
    await client.query(`
      TRUNCATE TABLE audit_logs, tickets, payments, booking_items, bookings,
                     showtime_seats, showtimes, seats, auditoriums, cinemas,
                     movie_genres, movies, genres, users CASCADE;
    `);

    // 1. Seed Users
    console.log("👤 Creating default admin and demo users...");
    const adminPassHash = await hashPassword("Admin123!");
    const userPassHash = await hashPassword("User123!");

    const adminUserRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('CineBook Administrator', 'admin@cinebook.com', $1, 'ADMIN')
       RETURNING id`,
      [adminPassHash]
    );
    const adminId = adminUserRes.rows[0].id;

    const demoUserRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Alex Johnson', 'demo@cinebook.com', $1, 'USER')
       RETURNING id`,
      [userPassHash]
    );
    const demoUserId = demoUserRes.rows[0].id;

    // 2. Seed Genres
    console.log("🎭 Creating genres...");
    const genresList = [
      { name: "Sci-Fi", slug: "sci-fi" },
      { name: "Action", slug: "action" },
      { name: "Drama", slug: "drama" },
      { name: "Adventure", slug: "adventure" },
      { name: "Animation", slug: "animation" },
      { name: "Thriller", slug: "thriller" },
      { name: "Crime", slug: "crime" },
      { name: "Comedy", slug: "comedy" },
    ];

    const genreMap: Record<string, string> = {};
    for (const g of genresList) {
      const res = await client.query(
        `INSERT INTO genres (name, slug) VALUES ($1, $2) RETURNING id, slug`,
        [g.name, g.slug]
      );
      genreMap[g.slug] = res.rows[0].id;
    }

    // 3. Seed Movies
    console.log("🎬 Creating blockbuster movies...");
    const moviesList = [
      {
        title: "Dune: Part Two",
        slug: "dune-part-two",
        synopsis:
          "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
        posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
        backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
        trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
        durationMins: 166,
        releaseDate: new Date("2024-03-01T00:00:00Z"),
        rating: "PG-13",
        language: "English",
        director: "Denis Villeneuve",
        cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem, Austin Butler",
        genres: ["sci-fi", "adventure", "action"],
      },
      {
        title: "Oppenheimer",
        slug: "oppenheimer",
        synopsis:
          "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, exploring the moral paradoxes and geopolitical consequences of humanity's greatest invention.",
        posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop&q=80",
        backdropUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80",
        trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
        durationMins: 180,
        releaseDate: new Date("2023-07-21T00:00:00Z"),
        rating: "R",
        language: "English",
        director: "Christopher Nolan",
        cast: "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr., Florence Pugh",
        genres: ["drama", "thriller"],
      },
      {
        title: "Spider-Man: Across the Spider-Verse",
        slug: "spider-man-across-the-spider-verse",
        synopsis:
          "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.",
        posterUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&auto=format&fit=crop&q=80",
        backdropUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1600&auto=format&fit=crop&q=80",
        trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
        durationMins: 140,
        releaseDate: new Date("2023-06-02T00:00:00Z"),
        rating: "PG",
        language: "English",
        director: "Joaquim Dos Santos, Kemp Powers",
        cast: "Shameik Moore, Hailee Steinfeld, Oscar Isaac, Daniel Kaluuya",
        genres: ["animation", "action", "adventure"],
      },
      {
        title: "Interstellar: 10th Anniversary IMAX",
        slug: "interstellar-10th-anniversary",
        synopsis:
          "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans across a mysterious wormhole near Saturn.",
        posterUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=80",
        backdropUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&auto=format&fit=crop&q=80",
        trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
        durationMins: 169,
        releaseDate: new Date("2024-11-07T00:00:00Z"),
        rating: "PG-13",
        language: "English",
        director: "Christopher Nolan",
        cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine",
        genres: ["sci-fi", "drama", "adventure"],
      },
      {
        title: "The Dark Knight",
        slug: "the-dark-knight",
        synopsis:
          "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        posterUrl: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&auto=format&fit=crop&q=80",
        backdropUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&auto=format&fit=crop&q=80",
        trailerUrl: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
        durationMins: 152,
        releaseDate: new Date("2023-01-01T00:00:00Z"),
        rating: "PG-13",
        language: "English",
        director: "Christopher Nolan",
        cast: "Christian Bale, Heath Ledger, Aaron Eckhart, Michael Caine, Gary Oldman",
        genres: ["action", "crime", "drama"],
      },
      {
        title: "Cyberpunk: Neon Horizon",
        slug: "cyberpunk-neon-horizon",
        synopsis:
          "In 2099 Neo-Tokyo, an outlaw neural mercenary stumbles upon an artificial intelligence capable of rewriting human consciousness, sparking an all-out war with planetary mega-corporations.",
        posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
        backdropUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80",
        trailerUrl: "https://www.youtube.com/watch?v=qIcTM8WXFjk",
        durationMins: 132,
        releaseDate: new Date("2025-05-15T00:00:00Z"),
        rating: "R",
        language: "English",
        director: "Katsuhiro Otomo",
        cast: "Ken Watanabe, Scarlett Johansson, Hiroyuki Sanada, Rinko Kikuchi",
        genres: ["sci-fi", "thriller", "action"],
      },
    ];

    const movieMap: Record<string, string> = {};
    for (const m of moviesList) {
      const res = await client.query(
        `INSERT INTO movies (
           title, slug, synopsis, poster_url, backdrop_url, trailer_url,
           duration_mins, release_date, rating, language, director, cast_members, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
         RETURNING id, slug`,
        [
          m.title,
          m.slug,
          m.synopsis,
          m.posterUrl,
          m.backdropUrl,
          m.trailerUrl,
          m.durationMins,
          m.releaseDate,
          m.rating,
          m.language,
          m.director,
          m.cast,
        ]
      );
      const movieId = res.rows[0].id;
      movieMap[m.slug] = movieId;

      for (const gSlug of m.genres) {
        if (genreMap[gSlug]) {
          await client.query(
            `INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2)`,
            [movieId, genreMap[gSlug]]
          );
        }
      }
    }

    // 4. Seed Cinemas
    console.log("🏛️ Creating flagship cinemas...");
    const cinemasList = [
      {
        name: "CineBook Grand IMAX Cinema",
        slug: "cinebook-grand-imax-la",
        address: "6801 Hollywood Blvd",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90028",
        latitude: "34.1016000",
        longitude: "-118.3411000",
        phone: "(323) 555-0199",
        facilities: ["IMAX Laser", "Dolby Atmos", "VIP Lounge", "Valet Parking", "Laser 4K"],
      },
      {
        name: "CineBook Dolby Cinema & VIP",
        slug: "cinebook-dolby-nyc",
        address: "234 W 42nd St",
        city: "New York",
        state: "NY",
        postalCode: "10036",
        latitude: "40.7566000",
        longitude: "-73.9885000",
        phone: "(212) 555-0142",
        facilities: ["Dolby Vision", "Dolby Atmos", "Premium Recliner", "Craft Bar", "Gourmet Dining"],
      },
      {
        name: "CineBook Metropolis Luxe",
        slug: "cinebook-metropolis-chicago",
        address: "600 N Michigan Ave",
        city: "Chicago",
        state: "IL",
        postalCode: "60611",
        latitude: "41.8929000",
        longitude: "-87.6244000",
        phone: "(312) 555-0188",
        facilities: ["IMAX Laser", "4DX Motion", "Recliner Seats", "Parking Garage"],
      },
    ];

    const cinemaAuditoriums: Array<{
      auditoriumId: string;
      cinemaId: string;
      cinemaName: string;
      auditoriumName: string;
      screenType: string;
    }> = [];

    for (const c of cinemasList) {
      const res = await client.query(
        `INSERT INTO cinemas (name, slug, address, city, state, postal_code, latitude, longitude, phone, facilities)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, name`,
        [
          c.name,
          c.slug,
          c.address,
          c.city,
          c.state,
          c.postalCode,
          c.latitude,
          c.longitude,
          c.phone,
          JSON.stringify(c.facilities),
        ]
      );
      const cinemaId = res.rows[0].id;

      // Create 2 auditoriums for each cinema
      const auds = [
        {
          name: "Screen 1 - Grand IMAX",
          screenType: "IMAX Laser 70mm",
          soundSystem: "IMAX 12-Channel Audio",
          rows: 8,
          cols: 10,
        },
        {
          name: "Screen 2 - Dolby Atmos Luxe",
          screenType: "Laser 4K HDR",
          soundSystem: "Dolby Atmos 64-Channel",
          rows: 6,
          cols: 8,
        },
      ];

      for (const aud of auds) {
        const totalSeats = aud.rows * aud.cols;
        const audRes = await client.query(
          `INSERT INTO auditoriums (cinema_id, name, total_rows, total_cols, total_seats, sound_system, screen_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, name`,
          [cinemaId, aud.name, aud.rows, aud.cols, totalSeats, aud.soundSystem, aud.screenType]
        );
        const auditoriumId = audRes.rows[0].id;

        cinemaAuditoriums.push({
          auditoriumId,
          cinemaId,
          cinemaName: c.name,
          auditoriumName: aud.name,
          screenType: aud.screenType,
        });

        // 5. Seed Seats for this Auditorium
        const rowLabels = ["A", "B", "C", "D", "E", "F", "G", "H"].slice(0, aud.rows);
        for (let rIdx = 0; rIdx < rowLabels.length; rIdx++) {
          const row = rowLabels[rIdx];
          for (let col = 1; col <= aud.cols; col++) {
            let seatType = "STANDARD";
            let basePriceCents = 1500; // $15.00

            // Front rows accessible ends
            if (row === "A" && (col === 1 || col === aud.cols)) {
              seatType = "ACCESSIBLE";
              basePriceCents = 1500;
            } else if (rIdx >= aud.rows - 2 && rIdx < aud.rows - 1) {
              seatType = "VIP";
              basePriceCents = 2200; // $22.00
            } else if (rIdx === aud.rows - 1) {
              seatType = "RECLINER";
              basePriceCents = 2800; // $28.00
            }

            await client.query(
              `INSERT INTO seats (auditorium_id, row_label, seat_number, seat_type, base_price_cents, is_active)
               VALUES ($1, $2, $3, $4, $5, TRUE)`,
              [auditoriumId, row, col, seatType, basePriceCents]
            );
          }
        }
      }
    }

    // 6. Seed Showtimes and Showtime Seats
    console.log("⏰ Scheduling showtimes and generating seat inventories...");
    const now = new Date();
    const movieKeys = Object.keys(movieMap);

    // Create showtimes for today, tomorrow, and subsequent days
    let totalShowtimesCount = 0;
    let totalShowtimeSeatsCount = 0;

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      for (const aud of cinemaAuditoriums) {
        // Pick 2-3 movies per auditorium per day
        const showSlots = [
          { hour: 11, minute: 30, multiplier: "1.00" },
          { hour: 15, minute: 0, multiplier: "1.10" },
          { hour: 18, minute: 30, multiplier: "1.25" }, // peak evening
          { hour: 21, minute: 45, multiplier: "1.25" },
        ];

        for (let i = 0; i < showSlots.length; i++) {
          const slot = showSlots[i];
          const movieSlug = movieKeys[(dayOffset + i + totalShowtimesCount) % movieKeys.length];
          const movieId = movieMap[movieSlug];

          const startTime = new Date(now);
          startTime.setDate(now.getDate() + dayOffset);
          startTime.setHours(slot.hour, slot.minute, 0, 0);

          const endTime = new Date(startTime.getTime() + 150 * 60 * 1000); // 2.5 hours

          const showtimeRes = await client.query(
            `INSERT INTO showtimes (movie_id, auditorium_id, start_time, end_time, price_multiplier, status)
             VALUES ($1, $2, $3, $4, $5, 'SCHEDULED')
             RETURNING id`,
            [movieId, aud.auditoriumId, startTime, endTime, slot.multiplier]
          );
          const showtimeId = showtimeRes.rows[0].id;
          totalShowtimesCount++;

          // Populate showtime_seats from auditorium seats
          const seatsRes = await client.query(
            `SELECT id, base_price_cents FROM seats WHERE auditorium_id = $1`,
            [aud.auditoriumId]
          );

          const multiplier = parseFloat(slot.multiplier);
          for (const s of seatsRes.rows) {
            const finalPrice = Math.round(s.base_price_cents * multiplier);
            await client.query(
              `INSERT INTO showtime_seats (showtime_id, seat_id, status, price_cents, version)
               VALUES ($1, $2, 'AVAILABLE', $3, 1)`,
              [showtimeId, s.id, finalPrice]
            );
            totalShowtimeSeatsCount++;
          }
        }
      }
    }

    console.log(`✨ Created ${totalShowtimesCount} showtimes with ${totalShowtimeSeatsCount} showtime-seats inventory!`);

    await client.query("COMMIT");
    console.log("🎉 [Database Engine Agent] Database seed completed successfully!");
    console.log("🔑 Default credentials:");
    console.log("   Admin: admin@cinebook.com | Admin123!");
    console.log("   User:  demo@cinebook.com  | User123!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ [Database Engine Agent] Seeding failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
