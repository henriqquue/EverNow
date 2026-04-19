import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - list all CMS blocks
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blocks = await prisma.cmsBlock.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json(blocks);
  } catch (error: any) {
    console.error('CMS blocks error:', error);
    return NextResponse.json({ error: 'Falha ao buscar blocos' }, { status: 500 });
  }
}

// POST - create new CMS block
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, title, content, type, status: blockStatus } = await req.json();
    if (!key || !title) {
      return NextResponse.json({ error: 'key e title são obrigatórios' }, { status: 400 });
    }

    const block = await prisma.cmsBlock.create({
      data: {
        key,
        title,
        content: content || '',
        type: type || 'TEXT',
        status: blockStatus || 'ACTIVE',
      },
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Chave já existe' }, { status: 409 });
    }
    console.error('CMS block create error:', error);
    return NextResponse.json({ error: 'Falha ao criar bloco' }, { status: 500 });
  }
}

// PUT - update CMS block
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, key, title, content, type, status: blockStatus } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const block = await prisma.cmsBlock.update({
      where: { id },
      data: {
        ...(key !== undefined && { key }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(blockStatus !== undefined && { status: blockStatus }),
      },
    });

    return NextResponse.json(block);
  } catch (error: any) {
    console.error('CMS block update error:', error);
    return NextResponse.json({ error: 'Falha ao atualizar bloco' }, { status: 500 });
  }
}

// DELETE - delete CMS block
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    await prisma.cmsBlock.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('CMS block delete error:', error);
    return NextResponse.json({ error: 'Falha ao remover bloco' }, { status: 500 });
  }
}
