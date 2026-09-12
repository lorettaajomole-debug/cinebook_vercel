import { NextResponse } from "next/server";
import { db } from "@/db";
import { cinemas, auditoriums } from "@/db/schema";

export async function GET() {
  try {
    const allCinemas = await db.query.cinemas.findMany({
      with: {
        auditoriums: true,
      },
      orderBy: (cinemas, { asc }) => [asc(cinemas.name)],
    });

    return NextResponse.json({ cinemas: allCinemas });
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    return NextResponse.json({ error: "Failed to fetch cinemas" }, { status: 500 });
  }
}
