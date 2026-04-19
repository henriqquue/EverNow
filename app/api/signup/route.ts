export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { isValidEmail } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body ?? {};

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Nome deve ter pelo menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }

    // Get free plan
    const freePlan = await prisma.plan.findFirst({
      where: { slug: "gratuito" },
    });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "USER",
        status: "ACTIVE",
        planId: freePlan?.id,
      },
    });

    // Create subscription for free plan
    if (freePlan) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: "ACTIVE",
          billingInterval: "MONTHLY",
        },
      });
    }

    // Log analytics event
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventType: "SIGNUP",
        eventData: { source: "web" },
      },
    });

    return NextResponse.json(
      { success: true, message: "Conta criada com sucesso" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
