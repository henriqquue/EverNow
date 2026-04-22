import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/settings
 * Buscar configurações do admin logado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    // Buscar user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Retornar configurações (com valores padrão)
    const settings = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      notificationsEmail: true,
      notificationsLGPD: true,
      notificationsReports: true,
      notificationsVerifications: true,
      auditLogRetention: 90,
      enableMFAReminder: true,
      showSensitiveData: false,
      dashboardRefreshRate: 30,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Atualizar configurações do admin
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validar dados
    if (data.auditLogRetention) {
      if (data.auditLogRetention < 30 || data.auditLogRetention > 365) {
        return NextResponse.json(
          { error: "Retenção de log deve estar entre 30 e 365 dias" },
          { status: 400 }
        );
      }
    }

    if (data.dashboardRefreshRate) {
      const validRates = [10, 30, 60, 300];
      if (!validRates.includes(data.dashboardRefreshRate)) {
        return NextResponse.json(
          { error: "Taxa de atualização inválida" },
          { status: 400 }
        );
      }
    }

    // TODO: Salvar em database se tiver tabela de AdminSettings
    // Por enquanto, apenas validamos e retornamos sucesso

    // Registrar auditoria
    await prisma.lGPDAuditLog.create({
      data: {
        userId: session.user.id,
        actionType: "USER_UPDATED",
        entityType: "AdminSettings",
        entityId: session.user.id,
        description: `Admin ${session.user.email} atualizou suas configurações`,
        performedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Configurações atualizadas com sucesso",
      settings: {
        id: session.user.id,
        email: session.user.email,
        notificationsEmail: data.notificationsEmail ?? true,
        notificationsLGPD: data.notificationsLGPD ?? true,
        notificationsReports: data.notificationsReports ?? true,
        notificationsVerifications: data.notificationsVerifications ?? true,
        auditLogRetention: data.auditLogRetention ?? 90,
        enableMFAReminder: data.enableMFAReminder ?? true,
        showSensitiveData: data.showSensitiveData ?? false,
        dashboardRefreshRate: data.dashboardRefreshRate ?? 30,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 }
    );
  }
}
