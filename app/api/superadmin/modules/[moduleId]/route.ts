import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// GET single module
export async function GET(
  req: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId } = await params;

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        features: { orderBy: { slug: "asc" } },
        planModules: { include: { plan: { select: { id: true, name: true } } } }
      }
    });

    if (!mod) {
      return NextResponse.json({ error: "Módulo não encontrado" }, { status: 404 });
    }

    return NextResponse.json(mod);
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update module
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId } = await params;
    const body = await req.json();
    const { name, slug, description, icon, status, order } = body;

    const mod = await prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(status !== undefined && { status }),
        ...(order !== undefined && { order }),
      },
      include: {
        features: { orderBy: { slug: "asc" } }
      }
    });

    return NextResponse.json(mod);
  } catch (error) {
    console.error("Error updating module:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE module (soft: set to INACTIVE, or hard delete if no features)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId } = await params;

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { _count: { select: { features: true } } }
    });

    if (!mod) {
      return NextResponse.json({ error: "Módulo não encontrado" }, { status: 404 });
    }

    if (mod._count.features > 0) {
      // Soft delete: set to INACTIVE
      await prisma.module.update({
        where: { id: moduleId },
        data: { status: "INACTIVE" }
      });
      return NextResponse.json({ message: "Módulo desativado (possui funcionalidades vinculadas)" });
    }

    await prisma.module.delete({ where: { id: moduleId } });
    return NextResponse.json({ message: "Módulo excluído" });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
