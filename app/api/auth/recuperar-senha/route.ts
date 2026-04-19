import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendResetPasswordEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // We return 200 even if user doesn't exist for security (avoid email enumeration)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    // Save to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // Send Email
    try {
      await sendResetPasswordEmail(user.email, token);
    } catch (mailError) {
      console.error("Mail error:", mailError);
      // Still return 200 in dev if we logged the link, but in prod we might want to warn
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Erro ao enviar e-mail. Tente novamente mais tarde." }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recuperar senha error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
