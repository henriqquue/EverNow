import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

/**
 * GET /api/admin/lgpd/compliance
 * Relatório de conformidade LGPD da plataforma
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await db.user.findUnique({
      where: { email: session.user.email! },
    });

    if (admin?.role !== 'ADMIN' && admin?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Estatísticas gerais
    const totalUsers = await db.user.count();
    const usersWithConsent = await db.userConsent.count();
    const consentPercentage = totalUsers > 0 ? ((usersWithConsent / totalUsers) * 100).toFixed(2) : 0;

    // Requisições LGPD
    const lgpdStats = await db.lGPDRequest.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const requestsByType = await db.lGPDRequest.groupBy({
      by: ['requestType'],
      _count: {
        id: true,
      },
    });

    // Últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentRequests = await db.lGPDRequest.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const recentAuditLogs = await db.lGPDAuditLog.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Conformidade média dos usuários
    const compliance = await db.lGPDCompliance.aggregate({
      _avg: { complianceScore: true },
      _min: { complianceScore: true },
      _max: { complianceScore: true },
    });

    // Usuários com compliance crítico (< 50)
    const criticalCompliance = await db.lGPDCompliance.count({
      where: { complianceScore: { lt: 50 } },
    });

    // Dados para exportação (resumo)
    const report = {
      generatedAt: new Date().toISOString(),
      overview: {
        totalUsers,
        usersWithConsent,
        consentPercentage: `${consentPercentage}%`,
      },
      lgpdRequests: {
        total: (lgpdStats.reduce((sum, s) => sum + s._count.id, 0)),
        byStatus: Object.fromEntries(
          lgpdStats.map(s => [s.status, s._count.id])
        ),
        byType: Object.fromEntries(
          requestsByType.map(t => [t.requestType, t._count.id])
        ),
        last30Days: recentRequests,
      },
      auditActivity: {
        last30Days: recentAuditLogs,
      },
      compliance: {
        averageScore: compliance._avg.complianceScore?.toFixed(2) || 'N/A',
        minScore: compliance._min.complianceScore,
        maxScore: compliance._max.complianceScore,
        criticalUsers: criticalCompliance,
      },
      recommendations: [],
    };

    // Adicionar recomendações
    if (Number(consentPercentage) < 80) {
      report.recommendations.push('⚠️ Menos de 80% dos usuários com consentimento. Considere enviar campanha de re-consentimento.');
    }

    if (criticalCompliance > 0) {
      report.recommendations.push(`⚠️ ${criticalCompliance} usuários com score de conformidade crítico. Revisar e auditar.`);
    }

    const pendingRequests = lgpdStats.find(s => s.status === 'PENDING')?._count.id || 0;
    if (pendingRequests > 10) {
      report.recommendations.push(`⚠️ ${pendingRequests} requisições LGPD pendentes. Requer ação rápida.`);
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('LGPD compliance report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
