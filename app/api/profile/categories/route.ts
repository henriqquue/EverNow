import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

// GET /api/profile/categories - Listar todas as categorias de perfil
export async function GET() {
  try {
    const categories = await prisma.profileCategory.findMany({
      where: { status: 'ACTIVE' },
      include: {
        options: {
          where: { status: 'ACTIVE', parentId: null },
          include: {
            children: {
              where: { status: 'ACTIVE' },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        weights: true,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
}
