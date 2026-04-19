import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// POST record paywall event
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      eventType,
      featureSlug,
      moduleName,
      planRequired,
      sourcePage,
      sourceAction,
      metadata
    } = body;

    const event = await prisma.paywallEvent.create({
      data: {
        userId: user.id,
        eventType: eventType || "VIEW",
        featureSlug,
        moduleName,
        planRequired,
        sourcePage,
        sourceAction,
        metadata: metadata || {}
      }
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error recording paywall event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET paywall events (SuperAdmin)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const eventType = searchParams.get("eventType");
    const featureSlug = searchParams.get("featureSlug");

    const events = await prisma.paywallEvent.findMany({
      where: {
        ...(eventType && { eventType: eventType as "VIEW" | "CLICK_UPGRADE" | "CLOSE" | "SUBSCRIBE" }),
        ...(featureSlug && { featureSlug })
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    // Aggregate stats
    const stats = await prisma.paywallEvent.groupBy({
      by: ["featureSlug", "eventType"],
      _count: true,
      orderBy: { _count: { featureSlug: "desc" } }
    });

    return NextResponse.json({ events, stats });
  } catch (error) {
    console.error("Error fetching paywall events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
