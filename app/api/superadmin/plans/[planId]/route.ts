import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// GET single plan
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

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        planIntervals: true,
        planModules: {
          include: { module: true }
        },
        featureLimits: {
          include: { feature: { include: { module: true } } }
        },
        _count: {
          select: { users: true, subscriptions: true }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update plan
export async function PUT(
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

    const {
      name,
      slug,
      shortDescription,
      longDescription,
      price,
      discountPrice,
      badge,
      highlightColor,
      status,
      order,
      popular,
      isHighlighted,
      showOnLanding,
      showInComparison,
      hasTrial,
      trialDays,
      internalNotes
    } = body;

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await prisma.plan.findFirst({
        where: { slug, id: { not: planId } }
      });
      if (existing) {
        return NextResponse.json({ error: "Slug já existe" }, { status: 400 });
      }
    }

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(longDescription !== undefined && { longDescription }),
        ...(price !== undefined && { price }),
        ...(discountPrice !== undefined && { discountPrice }),
        ...(badge !== undefined && { badge }),
        ...(highlightColor !== undefined && { highlightColor }),
        ...(status !== undefined && { status }),
        ...(order !== undefined && { order }),
        ...(popular !== undefined && { popular }),
        ...(isHighlighted !== undefined && { isHighlighted }),
        ...(showOnLanding !== undefined && { showOnLanding }),
        ...(showInComparison !== undefined && { showInComparison }),
        ...(hasTrial !== undefined && { hasTrial }),
        ...(trialDays !== undefined && { trialDays }),
        ...(internalNotes !== undefined && { internalNotes: internalNotes || null })
      },
      include: {
        planIntervals: true,
        planModules: { include: { module: true } },
        featureLimits: { include: { feature: true } }
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE plan (soft delete - archive)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await params;

    // Check if plan has active subscribers
    const activeSubscribers = await prisma.subscription.count({
      where: { planId, status: "ACTIVE" }
    });

    if (activeSubscribers > 0) {
      return NextResponse.json(
        { error: `Este plano tem ${activeSubscribers} assinantes ativos. Migre-os antes de arquivar.` },
        { status: 400 }
      );
    }

    // Soft delete - archive the plan
    await prisma.plan.update({
      where: { id: planId },
      data: { status: "ARCHIVED" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error archiving plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
