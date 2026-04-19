import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { DEFAULT_AD_ZONES } from '@/lib/ads';

// GET - List all ad zones
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let zones = await prisma.adZone.findMany({
      orderBy: { priority: 'desc' },
      include: {
        _count: {
          select: {
            impressions: true,
            clicks: true,
          },
        },
      },
    });

    // Initialize default zones if none exist
    if (zones.length === 0) {
      await prisma.adZone.createMany({
        data: DEFAULT_AD_ZONES,
      });
      zones = await prisma.adZone.findMany({
        orderBy: { priority: 'desc' },
        include: {
          _count: {
            select: {
              impressions: true,
              clicks: true,
            },
          },
        },
      });
    }

    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching ad zones:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Create new ad zone
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, type, description, isActive, priority, width, height, adsenseSlot } = body;

    const zone = await prisma.adZone.create({
      data: {
        name,
        slug,
        type,
        description,
        isActive: isActive ?? true,
        priority: priority ?? 0,
        width,
        height,
        adsenseSlot,
      },
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error('Error creating ad zone:', error);
    return NextResponse.json({ error: 'Erro ao criar zona' }, { status: 500 });
  }
}

// PUT - Update ad zone
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    const zone = await prisma.adZone.update({
      where: { id },
      data,
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error('Error updating ad zone:', error);
    return NextResponse.json({ error: 'Erro ao atualizar zona' }, { status: 500 });
  }
}

// DELETE - Delete ad zone
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await prisma.adZone.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad zone:', error);
    return NextResponse.json({ error: 'Erro ao deletar zona' }, { status: 500 });
  }
}
