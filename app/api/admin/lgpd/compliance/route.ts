import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma as db } from '@/lib/db';

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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallelize all statistics queries
    const [
      totalUsers,
      usersWithConsent,
      lgpdStats,
      requestsByType,
      recentRequests,
      recentAuditLogs,
      compliance,
      criticalCompliance
    ] = await Promise.all([
      db.user.count(),
      db.userConsent.count(),
      db.lGPDRequest.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      db.lGPDRequest.groupBy({
        by: ['requestType'],
        _count: { id: true },
      }),
      db.lGPDRequest.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      db.lGPDAuditLog.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      db.lGPDCompliance.aggregate({
        _avg: { complianceScore: true },
        _min: { complianceScore: true },
        _max: { complianceScore: true },
      }),
      db.lGPDCompliance.count({
        where: { complianceScore: { lt: 50 } },
      }),
    ]);

    const consentPercentage = totalUsers > 0 ? ((usersWithConsent / totalUsers) * 100).toFixed(2) : 0;

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
    const recommendations: string[] = [];
    if (Number(consentPercentage) < 80) {
      recommendations.push('⚠️ Menos de 80% dos usuários com consentimento. Considere enviar campanha de re-consentimento.');
    }

    if (criticalCompliance > 0) {
      recommendations.push(`⚠️ ${criticalCompliance} usuários com score de conformidade crítico. Revisar e auditar.`);
    }

    const pendingRequests = lgpdStats.find(s => s.status === 'PENDING')?._count.id || 0;
    if (pendingRequests > 10) {
      recommendations.push(`⚠️ ${pendingRequests} requisições LGPD pendentes. Requer ação rápida.`);
    }
    report.recommendations = recommendations;

    return NextResponse.json(report);
  } catch (error) {
    console.error('LGPD compliance report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
