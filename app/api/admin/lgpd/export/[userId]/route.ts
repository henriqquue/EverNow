import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma as db } from '@/lib/db';

/**
 * GET /api/admin/lgpd/export/[userId]
 * Exportar todos os dados de um usuário (incluindo dados relacionados)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    // Buscar todos os dados do usuário
    const user = await (db.user.findUnique as any)({
      where: { id: params.userId },
      include: {
        accounts: true,
        sessions: true,
        subscription: true,
        profile: true,
        notifications: true,
        lgpdRequests: true,
        lgpdAuditLogs: true,
        userConsent: true,
        lgpdCompliance: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cast to any to allow access to all included relations
    const u = user as any;

    // Compilar dados para exportação
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        nickname: u.nickname,
        bio: u.bio,
        birthDate: u.birthDate,
        gender: u.gender,
        orientation: u.orientation,
        city: u.city,
        state: u.state,
        country: u.country,
        latitude: u.latitude,
        longitude: u.longitude,
        photos: u.photos,
        interests: u.interests,
        languages: u.languages,
        work: u.work,
        education: u.education,
        createdAt: u.createdAt,
        verificationStatus: u.verificationStatus,
        trustScore: u.trustScore,
      },
      accounts: (u.accounts || []).map((a: any) => ({
        provider: a.provider,
        createdAt: a.createdAt,
      })),
      subscription: u.subscription,
      interactions: {
        likesSent: (u.likesSent || []).length,
        likesReceived: (u.likesReceived || []).length,
        matches: ((u.matchesAsUser1 || []).length + (u.matchesAsUser2 || []).length),
        messagesReceived: (u.chatMessages || []).length,
      },
      preferences: u.discoveryPreference,
      photos: u.userPhotos,
      consent: u.userConsent,
      compliance: u.lgpdCompliance,
      auditLog: (u.lgpdAuditLogs || []).slice(0, 100),
    };

    // Log de auditoria
    await db.lGPDAuditLog.create({
      data: {
        userId: params.userId,
        actionType: 'DATA_EXPORTED',
        entityType: 'User',
        entityId: params.userId,
        description: 'User data exported by admin',
        performedBy: admin.id,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
      },
    });

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Export user data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
