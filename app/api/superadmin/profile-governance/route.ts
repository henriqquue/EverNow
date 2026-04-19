import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { invalidateGovernanceCache } from '@/lib/profile-governance';

// GET all governance rules
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await prisma.profileFieldGovernance.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching governance rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new governance rule
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const rule = await prisma.profileFieldGovernance.create({ data: body });
    invalidateGovernanceCache();
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating governance rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT bulk update governance rules
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { rules } = body;

    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: 'rules deve ser um array' }, { status: 400 });
    }

    for (const rule of rules) {
      const { id, ...data } = rule;
      if (id) {
        await prisma.profileFieldGovernance.update({
          where: { id },
          data,
        });
      } else if (data.fieldKey) {
        await prisma.profileFieldGovernance.upsert({
          where: { fieldKey: data.fieldKey },
          update: data,
          create: data,
        });
      }
    }

    invalidateGovernanceCache();
    const updated = await prisma.profileFieldGovernance.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating governance rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
