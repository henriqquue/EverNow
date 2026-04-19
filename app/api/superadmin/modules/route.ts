import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// GET all modules with features
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const modules = await prisma.module.findMany({
      include: {
        features: {
          orderBy: { slug: "asc" }
        }
      },
      orderBy: { order: "asc" }
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create new module
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, description, icon, order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e slug são obrigatórios" }, { status: 400 });
    }

    const module = await prisma.module.create({
      data: {
        name,
        slug,
        description,
        icon,
        order: order || 0,
        status: "ACTIVE"
      }
    });

    return NextResponse.json(module, { status: 201 });
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
