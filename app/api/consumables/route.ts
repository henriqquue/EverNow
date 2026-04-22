import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * GET /api/consumables
 * Lista todos os consumíveis disponíveis para compra
 */
export async function GET(request: NextRequest) {
  try {
    const consumables = await prisma.consumableItem.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ isPopular: "desc" }, { order: "asc" }],
    });

    return NextResponse.json(consumables);
  } catch (error) {
    console.error("Erro ao listar consumíveis:", error);
    return NextResponse.json(
      { error: "Erro ao listar consumíveis" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/consumables
 * [ADMIN] Criar novo consumível
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    const data = await request.json();

    const consumable = await prisma.consumableItem.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        type: data.type || "BOOST",
        price: data.price,
        currency: data.currency || "BRL",
        quantity: data.quantity,
        durationDays: data.durationDays,
        icon: data.icon,
        color: data.color,
        benefits: data.benefits || {},
        visibility: data.visibility || 1.0,
        isPopular: data.isPopular || false,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(consumable, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar consumível:", error);
    return NextResponse.json(
      { error: "Erro ao criar consumível" },
      { status: 500 }
    );
  }
}
