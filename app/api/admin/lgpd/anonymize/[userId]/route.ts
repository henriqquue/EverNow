import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

/**
 * POST /api/admin/lgpd/anonymize/[userId]
 * Anonimizar todos os dados de um usuário (direito ao esquecimento)
 */
export async function POST(
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

    if (admin?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Only SUPERADMIN can anonymize users' }, { status: 403 });
    }

    const body = await req.json();
    const { deleteCompletely = false } = body;

    const user = await db.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (deleteCompletely) {
      // Deletar completamente o usuário e todos os dados relacionados
      // Isso cascata através das relações definidas no Prisma
      await db.user.delete({
        where: { id: params.userId },
      });

      // Log de auditoria
      await db.lGPDAuditLog.create({
        data: {
          userId: params.userId,
          actionType: 'USER_DELETED',
          entityType: 'User',
          entityId: params.userId,
          description: 'User completely deleted by SUPERADMIN (LGPD right to be forgotten)',
          performedBy: admin.id,
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
        },
      });

      return NextResponse.json({
        message: 'User and all related data permanently deleted',
        userId: params.userId,
      });
    } else {
      // Anonimizar o usuário (manter registros para auditoria, mas remover dados pessoais)
      const anonymizedUser = await db.user.update({
        where: { id: params.userId },
        data: {
          email: `deleted-${params.userId}@evernow.deleted`,
          passwordHash: null,
          name: 'Deleted User',
          nickname: null,
          bio: null,
          birthDate: null,
          gender: null,
          orientation: null,
          city: null,
          state: null,
          country: null,
          latitude: null,
          longitude: null,
          photos: [],
          interests: [],
          languages: [],
          work: null,
          education: null,
          image: null,
          pronouns: null,
          headline: null,
          statusMood: null,
          status: 'INACTIVE',
        },
      });

      // Anonimizar mensagens de chat
      await db.chatMessage.updateMany({
        where: { senderId: params.userId },
        data: {
          content: '[Message deleted by user request - LGPD]',
        },
      });

      // Remover fotos
      await db.userPhoto.deleteMany({
        where: { userId: params.userId },
      });

      // Log de auditoria
      await db.lGPDAuditLog.create({
        data: {
          userId: params.userId,
          actionType: 'USER_ANONYMIZED',
          entityType: 'User',
          entityId: params.userId,
          description: 'User anonymized by SUPERADMIN (LGPD right to be forgotten)',
          performedBy: admin.id,
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
        },
      });

      return NextResponse.json({
        message: 'User data successfully anonymized',
        user: anonymizedUser,
      });
    }
  } catch (error) {
    console.error('Anonymize user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
