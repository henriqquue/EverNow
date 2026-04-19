import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export async function GET(req: Request) {
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

    const banners = await prisma.banner.findMany({
      include: {
        targetPlan: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const banner = await prisma.banner.create({
      data: {
        name: body.name,
        slug: body.slug,
        title: body.title,
        subtitle: body.subtitle,
        ctaText: body.ctaText || "Saiba mais",
        ctaUrl: body.ctaUrl,
        imageUrl: body.imageUrl,
        backgroundColor: body.backgroundColor,
        textColor: body.textColor,
        position: body.position || "top",
        pages: body.pages || [],
        dismissible: body.dismissible ?? true,
        targetPlanId: body.targetPlanId || null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        isActive: body.isActive ?? true,
        priority: body.priority || 0,
      },
      include: {
        targetPlan: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json({ error: "Erro ao criar banner" }, { status: 500 });
  }
}
