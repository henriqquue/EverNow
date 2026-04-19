import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// GET plan intervals
export async function GET(
  req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await params;

    const intervals = await prisma.planInterval.findMany({
      where: { planId },
      orderBy: { interval: "asc" }
    });

    return NextResponse.json(intervals);
  } catch (error) {
    console.error("Error fetching intervals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST add/update intervals
export async function POST(
  req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await params;
    const body = await req.json();
    const { intervals } = body;

    if (!Array.isArray(intervals)) {
      return NextResponse.json({ error: "intervals deve ser um array" }, { status: 400 });
    }

    // Delete existing intervals and create new ones
    await prisma.planInterval.deleteMany({ where: { planId } });

    if (intervals.length > 0) {
      for (const interval of intervals) {
        await prisma.planInterval.create({
          data: {
            planId,
            interval: interval.interval as "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY",
            price: interval.price || 0,
            discountPrice: interval.discountPrice,
            discountPercent: interval.discountPercent,
            isDefault: interval.isDefault || false,
            isActive: interval.isActive !== false,
            bestOffer: interval.bestOffer || false,
            billingLabel: interval.billingLabel || null,
          }
        });
      }
    }

    const updatedIntervals = await prisma.planInterval.findMany({
      where: { planId },
      orderBy: { interval: "asc" }
    });

    return NextResponse.json(updatedIntervals);
  } catch (error) {
    console.error("Error updating intervals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
