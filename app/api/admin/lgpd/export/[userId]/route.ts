import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

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
    const user = await db.user.findUnique({
      where: { id: params.userId },
      include: {
        accounts: true,
        sessions: true,
        subscription: true,
        profile: true,
        likesSent: true,
        likesReceived: true,
        matchesAsUser1: true,
        matchesAsUser2: true,
        chatMessages: true,
        notifications: true,
        reports: true,
        blocksReceived: true,
        blocksMade: true,
        discoveryPreference: true,
        userPhotos: true,
        lgpdRequests: true,
        lgpdAuditLogs: true,
        userConsent: true,
        lgpdCompliance: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Compilar dados para exportação
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        bio: user.bio,
        birthDate: user.birthDate,
        gender: user.gender,
        orientation: user.orientation,
        city: user.city,
        state: user.state,
        country: user.country,
        latitude: user.latitude,
        longitude: user.longitude,
        photos: user.photos,
        interests: user.interests,
        languages: user.languages,
        work: user.work,
        education: user.education,
        createdAt: user.createdAt,
        verificationStatus: user.verificationStatus,
        trustScore: user.trustScore,
      },
      accounts: user.accounts.map(a => ({
        provider: a.provider,
        createdAt: a.createdAt,
      })),
      subscription: user.subscription,
      interactions: {
        likesSent: user.likesSent.length,
        likesReceived: user.likesReceived.length,
        matches: (user.matchesAsUser1.length + user.matchesAsUser2.length),
        messagesReceived: user.chatMessages.length,
      },
      preferences: user.discoveryPreference,
      photos: user.userPhotos,
      consent: user.userConsent,
      compliance: user.lgpdCompliance,
      auditLog: user.lgpdAuditLogs.slice(0, 100), // Últimas 100 ações
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
