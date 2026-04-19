import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// GET all plans (with optional filters)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const includeStats = searchParams.get("includeStats") === "true";

    const plans = await prisma.plan.findMany({
      where: status ? { status: status as "ACTIVE" | "INACTIVE" | "ARCHIVED" } : undefined,
      include: {
        planIntervals: true,
        planModules: {
          include: { module: true }
        },
        featureLimits: {
          include: { feature: { include: { module: true } } }
        },
        _count: includeStats ? {
          select: { users: true, subscriptions: true }
        } : undefined
      },
      orderBy: { order: "asc" }
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create new plan
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      shortDescription,
      longDescription,
      price,
      discountPrice,
      badge,
      highlightColor,
      order,
      popular,
      isHighlighted,
      showOnLanding,
      showInComparison,
      hasTrial,
      trialDays,
      internalNotes,
      intervals,
      features,
      modules
    } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e slug são obrigatórios" }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await prisma.plan.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 400 });
    }

    // Create plan with nested creates
    const plan = await prisma.plan.create({
      data: {
        name,
        slug,
        shortDescription,
        longDescription,
        price: price || 0,
        discountPrice,
        badge,
        highlightColor,
        order: order || 0,
        popular: popular || false,
        isHighlighted: isHighlighted || false,
        showOnLanding: showOnLanding !== false,
        showInComparison: showInComparison !== false,
        hasTrial: hasTrial || false,
        trialDays: trialDays || 7,
        internalNotes: internalNotes || null,
        status: "ACTIVE",
        planIntervals: intervals?.length ? {
          create: intervals.map((interval: { interval: string; price: number; discountPrice?: number; discountPercent?: number; isActive?: boolean }) => ({
            interval: interval.interval,
            price: interval.price || 0,
            discountPrice: interval.discountPrice,
            discountPercent: interval.discountPercent,
            isActive: interval.isActive !== false
          }))
        } : undefined,
        planModules: modules?.length ? {
          create: modules.map((m: { moduleId: string; isEnabled?: boolean; isVisibleLocked?: boolean; blockMessage?: string; ctaText?: string }) => ({
            moduleId: m.moduleId,
            isEnabled: m.isEnabled !== false,
            isVisibleLocked: m.isVisibleLocked || false,
            blockMessage: m.blockMessage,
            ctaText: m.ctaText
          }))
        } : undefined,
        featureLimits: features?.length ? {
          create: features.map((f: { featureId: string; limitValue?: number; unlimited?: boolean; enabled?: boolean; isVisibleLocked?: boolean; blockMessage?: string; ctaText?: string }) => ({
            featureId: f.featureId,
            limitValue: f.limitValue || 0,
            unlimited: f.unlimited || false,
            enabled: f.enabled !== false,
            isVisibleLocked: f.isVisibleLocked || false,
            blockMessage: f.blockMessage,
            ctaText: f.ctaText
          }))
        } : undefined
      },
      include: {
        planIntervals: true,
        planModules: { include: { module: true } },
        featureLimits: { include: { feature: true } }
      }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
