import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { bannerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const banner = await prisma.banner.findUnique({
      where: { id: params.bannerId },
      include: {
        targetPlan: { select: { id: true, name: true } },
      },
    });

    if (!banner) {
      return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { bannerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const banner = await prisma.banner.update({
      where: { id: params.bannerId },
      data: {
        name: body.name,
        slug: body.slug,
        title: body.title,
        subtitle: body.subtitle,
        ctaText: body.ctaText,
        ctaUrl: body.ctaUrl,
        imageUrl: body.imageUrl,
        backgroundColor: body.backgroundColor,
        textColor: body.textColor,
        position: body.position,
        pages: body.pages,
        dismissible: body.dismissible,
        targetPlanId: body.targetPlanId || null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        isActive: body.isActive,
        priority: body.priority,
      },
      include: {
        targetPlan: { select: { id: true, name: true } },
      },
    });

    // Log audit
    await prisma.lGPDAuditLog.create({
      data: {
        userId: user.id,
        actionType: 'BANNER_UPDATED',
        entityType: 'Banner',
        entityId: banner.id,
        description: `Banner "${banner.name}" atualizado por ${user.email}`,
        performedBy: user.id,
      },
    }).catch(() => {});

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { bannerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.banner.delete({
      where: { id: params.bannerId },
    });

    // Log audit
    await prisma.lGPDAuditLog.create({
      data: {
        userId: user.id,
        actionType: 'BANNER_DELETED',
        entityType: 'Banner',
        entityId: params.bannerId,
        description: `Banner (ID: ${params.bannerId}) deletado por ${user.email}`,
        performedBy: user.id,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}
