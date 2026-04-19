import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { checkFeatureEntitlement } from '@/lib/entitlement-service';

const PRIVACY_FIELDS = [
  'showOnlineStatus',
  'showLastActive',
  'showDistance',
  'showAge',
  'incognitoMode',
  'showReadReceipts',
] as const;

// GET /api/privacy - Get current user's privacy settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        showOnlineStatus: true,
        showLastActive: true,
        showDistance: true,
        showAge: true,
        incognitoMode: true,
        showReadReceipts: true,
        verificationStatus: true,
        plan: { select: { slug: true } },
      },
    });

    const isPremium = user?.plan?.slug && user.plan.slug !== 'gratuito';

    // Check premium entitlements for gating
    const [incognitoEntitlement, readReceiptsEntitlement] = await Promise.all([
      checkFeatureEntitlement(session.user.id, 'modo_invisivel').catch(() => ({ allowed: false })),
      checkFeatureEntitlement(session.user.id, 'leitura_confirmacao').catch(() => ({ allowed: false })),
    ]);

    return NextResponse.json({
      settings: user,
      entitlements: {
        incognito: incognitoEntitlement.allowed || !!isPremium,
        readReceipts: readReceiptsEntitlement.allowed || !!isPremium,
      },
    });
  } catch (error: any) {
    console.error('Privacy settings error:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar configurações de privacidade' },
      { status: 500 }
    );
  }
}

// PUT /api/privacy - Update privacy settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Only allow valid privacy fields
    const data: Record<string, boolean> = {};
    for (const field of PRIVACY_FIELDS) {
      if (typeof body[field] === 'boolean') {
        data[field] = body[field];
      }
    }

    // Premium gating: incognitoMode requires modo_invisivel entitlement or a premium plan
    if (data.incognitoMode === true) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: { select: { slug: true } } } });
      const isPremium = user?.plan?.slug && user.plan.slug !== 'gratuito';
      const entitlement = await checkFeatureEntitlement(session.user.id, 'modo_invisivel');
      
      if (!entitlement.allowed && !isPremium) {
        return NextResponse.json(
          { error: 'Modo Discreto requer plano premium', code: 'PREMIUM_REQUIRED' },
          { status: 403 }
        );
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Privacy update error:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar configurações de privacidade' },
      { status: 500 }
    );
  }
}
