import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// GET plan modules
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

    const planModules = await prisma.planModule.findMany({
      where: { planId },
      include: { module: true },
      orderBy: { module: { order: "asc" } }
    });

    return NextResponse.json(planModules);
  } catch (error) {
    console.error("Error fetching plan modules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST update plan modules
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
    const { modules } = body;

    if (!Array.isArray(modules)) {
      return NextResponse.json({ error: "modules deve ser um array" }, { status: 400 });
    }

    // Upsert each plan module
    for (const m of modules) {
      await prisma.planModule.upsert({
        where: {
          planId_moduleId: {
            planId,
            moduleId: m.moduleId
          }
        },
        update: {
          isEnabled: m.isEnabled !== false,
          isVisibleLocked: m.isVisibleLocked || false,
          blockMessage: m.blockMessage,
          ctaText: m.ctaText
        },
        create: {
          planId,
          moduleId: m.moduleId,
          isEnabled: m.isEnabled !== false,
          isVisibleLocked: m.isVisibleLocked || false,
          blockMessage: m.blockMessage,
          ctaText: m.ctaText
        }
      });
    }

    const updatedModules = await prisma.planModule.findMany({
      where: { planId },
      include: { module: true }
    });

    return NextResponse.json(updatedModules);
  } catch (error) {
    console.error("Error updating plan modules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
