import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredHoldsWorker } from "@/lib/booking-engine";

function verifyCronSecret(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // If not configured in local dev, allow execution

  const authHeader = req.headers.get("authorization");
  const xCronSecret = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");

  if (authHeader && authHeader.startsWith("Bearer ") && authHeader.substring(7) === cronSecret) {
    return true;
  }

  if (xCronSecret === cronSecret || querySecret === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
  }

  try {
    const result = await releaseExpiredHoldsWorker();
    return NextResponse.json({
      success: true,
      message: "Expired seat holds released successfully",
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("Cron release-holds error:", error);
    return NextResponse.json({ error: "Failed to release expired holds" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
