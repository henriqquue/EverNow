import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sections = await prisma.landingSection.findMany({
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key, name, title, subtitle, content, isActive, order, backgroundColor, textColor, customStyles } = body;

    if (!key || !name) {
      return NextResponse.json({ error: 'Key and name are required' }, { status: 400 });
    }

    const section = await prisma.landingSection.create({
      data: {
        key,
        name,
        title,
        subtitle,
        content,
        isActive: isActive ?? true,
        order: order ?? 0,
        backgroundColor,
        textColor,
        customStyles
      }
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
