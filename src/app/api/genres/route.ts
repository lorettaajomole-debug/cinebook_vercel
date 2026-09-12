import { NextResponse } from "next/server";
import { db } from "@/db";
import { genres } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const allGenres = await db.query.genres.findMany({
      orderBy: [asc(genres.name)],
    });
    return NextResponse.json({ genres: allGenres });
  } catch (error: any) {
    console.error("Error fetching genres:", error);
    return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 });
  }
}
