import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// GET all features with module and plan limits
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const features = await prisma.feature.findMany({
      include: {
        module: { select: { id: true, name: true, slug: true } },
        featureLimits: {
          include: {
            plan: { select: { id: true, name: true, slug: true, order: true } }
          },
          orderBy: { plan: { order: "asc" } }
        }
      },
      orderBy: [{ module: { order: "asc" } }, { comparisonOrder: "asc" }, { slug: "asc" }]
    });

    return NextResponse.json(features);
  } catch (error) {
    console.error("Error fetching features:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create new feature
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, moduleId, description, type, defaultLimit, resetPeriod, showInComparison, comparisonOrder, comparisonLabel } = body;

    if (!name || !slug || !moduleId) {
      return NextResponse.json({ error: "Nome, slug e módulo são obrigatórios" }, { status: 400 });
    }

    const feature = await prisma.feature.create({
      data: {
        name,
        slug,
        moduleId,
        description: description || null,
        type: type || "BOOLEAN",
        defaultLimit: defaultLimit ?? 0,
        resetPeriod: resetPeriod || "NEVER",
        showInComparison: showInComparison !== false,
        comparisonOrder: comparisonOrder || 0,
        comparisonLabel: comparisonLabel || null,
      },
      include: {
        module: { select: { id: true, name: true, slug: true } },
        featureLimits: {
          include: { plan: { select: { id: true, name: true, slug: true, order: true } } }
        }
      }
    });

    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    console.error("Error creating feature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
