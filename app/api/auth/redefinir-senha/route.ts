import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token e senha são obrigatórios" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 8 caracteres" }, { status: 400 });
    }

    // Find user by token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true, message: "Senha redefinida com sucesso" });
  } catch (error) {
    console.error("Redefinir senha error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
