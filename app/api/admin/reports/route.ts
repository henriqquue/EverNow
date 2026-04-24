export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/admin/reports - List reports with filters
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status !== 'ALL') {
      where.status = status;
    }

    const [rawReports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, name: true, email: true },
          },
          reportedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              verificationStatus: true,
              userPhotos: { take: 1, orderBy: { order: 'asc' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.report.count({ where }),
    ]);

    // Map reportedUser -> reported to match frontend ReportItem interface
    const reports = rawReports.map((r) => ({
      ...r,
      reported: r.reportedUser
        ? {
            id: r.reportedUser.id,
            name: r.reportedUser.name,
            email: r.reportedUser.email,
            photoUrl: r.reportedUser.userPhotos?.[0]?.url ?? null,
            verificationStatus: r.reportedUser.verificationStatus,
            status: r.reportedUser.status,
          }
        : { id: '', name: 'Usuário removido', email: '', photoUrl: null, verificationStatus: null, status: null },
    }));

    return NextResponse.json({ reports, total, page, limit });
  } catch (error: any) {
    console.error('Admin reports list error:', error);
    return NextResponse.json(
      { error: 'Falha ao listar denúncias' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/reports - Resolve a report
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mod = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (mod?.role !== 'ADMIN' && mod?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reportId, action, notes, actionType, moderationAction } = await request.json();

    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'reportId and action are required' },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Frontend sends 'RESOLVED' or 'DISMISSED'
    const isResolve = action === 'RESOLVED' || action === 'resolve';
    const newStatus = isResolve ? 'RESOLVED' : 'DISMISSED';
    // Support both field names: moderationAction (sent by frontend) and actionType (legacy)
    const resolvedActionType = moderationAction || actionType;

    // Update report
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus as any,
        adminNotes: notes || null,
        resolvedById: session.user.id,
        resolvedAt: new Date(),
      },
    });

    // If resolving with a moderation action on the reported user
    if (isResolve && resolvedActionType) {
      await prisma.moderationAction.create({
        data: {
          targetUserId: report.reportedUserId,
          moderatorId: session.user.id,
          actionType: resolvedActionType as any,
          reason: `Denúncia resolvida: ${report.reason}`,
          notes,
          reportId: reportId,
        },
      });

      // Apply moderation action
      if (resolvedActionType === 'WARNING') {
        // Decrease trust score
        await prisma.user.update({
          where: { id: report.reportedUserId },
          data: { trustScore: { decrement: 10 } },
        });
      } else if (resolvedActionType === 'TEMP_SUSPENSION') {
        await prisma.user.update({
          where: { id: report.reportedUserId },
          data: { status: 'SUSPENDED', trustScore: { decrement: 25 } },
        });
      } else if (resolvedActionType === 'PERMANENT_BAN') {
        await prisma.user.update({
          where: { id: report.reportedUserId },
          data: { status: 'SUSPENDED', trustScore: 0 },
        });
      }
    }

    // Log LGPD Audit for Report Resolution
    await prisma.lGPDAuditLog.create({
      data: {
        userId: report.reportedUserId,
        actionType: 'REPORT_RESOLVED',
        entityType: 'Report',
        entityId: reportId,
        description: `Denúncia resolvida/arquivada por ${session.user.email}. Ação: ${isResolve ? resolvedActionType || 'RESOLVIDA' : 'ARQUIVADA'}`,
        performedBy: session.user.id,
      },
    }).catch((e) => console.error('Failed to log report resolution:', e));

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error('Admin report action error:', error);
    return NextResponse.json(
      { error: 'Falha ao processar denúncia' },
      { status: 500 }
    );
  }
}

