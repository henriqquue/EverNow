import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

/**
 * GET/PUT /api/admin/lgpd/consent/[userId]
 * Obter ou atualizar consentimento de um usuário
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

    // Buscar consentimento do usuário
    let consent = await db.userConsent.findUnique({
      where: { userId: params.userId },
    });

    // Se não existe, criar padrão
    if (!consent) {
      consent = await db.userConsent.create({
        data: {
          userId: params.userId,
          marketing: false,
          analytics: true,
          thirdParty: false,
          profilingConsent: false,
        },
      });
    }

    return NextResponse.json(consent);
  } catch (error) {
    console.error('Get consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await req.json();
    const { marketing, analytics, thirdParty, profilingConsent } = body;

    // Buscar ou criar consentimento
    let consent = await db.userConsent.findUnique({
      where: { userId: params.userId },
    });

    if (!consent) {
      consent = await db.userConsent.create({
        data: {
          userId: params.userId,
          marketing: marketing ?? false,
          analytics: analytics ?? true,
          thirdParty: thirdParty ?? false,
          profilingConsent: profilingConsent ?? false,
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
        },
      });
    } else {
      consent = await db.userConsent.update({
        where: { userId: params.userId },
        data: {
          ...(marketing !== undefined && { marketing }),
          ...(analytics !== undefined && { analytics }),
          ...(thirdParty !== undefined && { thirdParty }),
          ...(profilingConsent !== undefined && { profilingConsent }),
          updatedAt: new Date(),
        },
      });
    }

    // Log de auditoria
    await db.lGPDAuditLog.create({
      data: {
        userId: params.userId,
        actionType: 'CONSENT_WITHDRAWN',
        entityType: 'UserConsent',
        entityId: params.userId,
        description: 'Consent updated by admin',
        performedBy: admin.id,
        newValues: { marketing, analytics, thirdParty, profilingConsent },
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
      },
    });

    return NextResponse.json(consent);
  } catch (error) {
    console.error('Update consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
