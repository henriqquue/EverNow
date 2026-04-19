import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getResolvedVisibilities,
  saveUserVisibilityChoices,
  calculateProfileQuality,
} from '@/lib/profile-governance';
import prisma from '@/lib/db';

// GET user's resolved visibility settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: { select: { slug: true } }, verificationStatus: true },
    });

    const isPremium = user?.plan?.slug !== 'gratuito' && !!user?.plan;
    const isVerified = (user as any)?.verificationStatus === 'VERIFIED';

    const visibilities = await getResolvedVisibilities(
      session.user.id,
      isPremium,
      isVerified
    );

    return NextResponse.json({ visibilities });
  } catch (error) {
    console.error('Error fetching visibility:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST save user visibility choices
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { choices } = body;

    if (!Array.isArray(choices)) {
      return NextResponse.json({ error: 'choices deve ser um array' }, { status: 400 });
    }

    await saveUserVisibilityChoices(session.user.id, choices);
    await calculateProfileQuality(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving visibility:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
