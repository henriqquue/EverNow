import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// GET single feature
export async function GET(
  req: Request,
  { params }: { params: Promise<{ featureId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { featureId } = await params;

    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        module: true,
        featureLimits: {
          include: { plan: { select: { id: true, name: true, slug: true } } }
        }
      }
    });

    if (!feature) {
      return NextResponse.json({ error: "Funcionalidade não encontrada" }, { status: 404 });
    }

    return NextResponse.json(feature);
  } catch (error) {
    console.error("Error fetching feature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update feature
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ featureId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { featureId } = await params;
    const body = await req.json();
    const { name, slug, moduleId, description, type, defaultLimit, resetPeriod, showInComparison, comparisonOrder, comparisonLabel } = body;

    const feature = await prisma.feature.update({
      where: { id: featureId },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(moduleId !== undefined && { moduleId }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(defaultLimit !== undefined && { defaultLimit }),
        ...(resetPeriod !== undefined && { resetPeriod }),
        ...(showInComparison !== undefined && { showInComparison }),
        ...(comparisonOrder !== undefined && { comparisonOrder }),
        ...(comparisonLabel !== undefined && { comparisonLabel }),
      },
      include: {
        module: { select: { id: true, name: true, slug: true } },
        featureLimits: {
          include: { plan: { select: { id: true, name: true, slug: true, order: true } } }
        }
      }
    });

    return NextResponse.json(feature);
  } catch (error) {
    console.error("Error updating feature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE feature
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ featureId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { featureId } = await params;

    // Check if feature has usage records
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: { _count: { select: { usageRecords: true, featureLimits: true } } }
    });

    if (!feature) {
      return NextResponse.json({ error: "Funcionalidade não encontrada" }, { status: 404 });
    }

    if (feature._count.usageRecords > 0) {
      return NextResponse.json({ 
        error: "Não é possível excluir uma funcionalidade com registros de uso. Remova os limites dos planos primeiro." 
      }, { status: 400 });
    }

    // Delete associated feature limits first
    await prisma.featureLimit.deleteMany({ where: { featureId } });
    await prisma.feature.delete({ where: { id: featureId } });

    return NextResponse.json({ message: "Funcionalidade excluída" });
  } catch (error) {
    console.error("Error deleting feature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
