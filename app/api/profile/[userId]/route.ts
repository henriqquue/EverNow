import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { resolvePublicProfile, calculateProfileQuality } from '@/lib/profile-governance';
import { calculateProfileCompleteness } from '@/lib/profile-completeness';

// GET /api/profile/[userId] - Obter perfil de um usuário
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { userId } = params;
    const isOwnProfile = userId === session.user.id;

    // Use central resolver for governance-aware profile
    const resolved = await resolvePublicProfile(userId, session.user.id);
    
    if (!resolved) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // For own profile, also fetch extra private fields
    let extra: Record<string, unknown> = {};
    if (isOwnProfile) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          orientation: true,
          country: true,
          photos: true,
          createdAt: true,
          profileComplete: true,
          onboardingComplete: true,
          birthDate: true,
          relationshipStatus: true,
        },
      });
      if (user) {
        extra = {
          orientation: user.orientation,
          country: user.country,
          legacyPhotos: user.photos,
          createdAt: user.createdAt,
          profileComplete: user.profileComplete,
          onboardingComplete: user.onboardingComplete,
          birthDate: user.birthDate,
          relationshipStatus: user.relationshipStatus,
        };
      }
    }

    const profile = {
      ...resolved,
      ...extra,
    };

    return NextResponse.json({ profile });
    } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/[userId] - Update profile fields (including new maturity fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { userId } = params;
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = [
      'name', 'nickname', 'bio', 'birthDate', 'gender', 'orientation',
      'lookingFor', 'relationshipStatus', 'city', 'state', 'neighborhood', 'country',
      'pronouns', 'headline', 'statusMood', 'languages', 'work', 'education',
      'interests',
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'birthDate') {
          data[field] = body[field] ? new Date(body[field]) : null;
        } else if (field === 'gender' || field === 'lookingFor' || field === 'relationshipStatus') {
          data[field] = body[field] && body[field] !== "" ? body[field] : null;
        } else {
          data[field] = body[field];
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, profileComplete: true },
    });

    // Recalculate profile completeness and quality
    const completeness = await calculateProfileCompleteness(userId);
    
    const finalUser = await prisma.user.update({
      where: { id: userId },
      data: { profileComplete: completeness },
      select: { id: true, name: true, profileComplete: true }
    });

    await calculateProfileQuality(userId);

    return NextResponse.json({ success: true, user: finalUser });
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil', details: error.message },
      { status: 500 }
    );
  }
}
