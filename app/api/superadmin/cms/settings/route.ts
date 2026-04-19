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

    const { searchParams } = new URL(req.url);
    const group = searchParams.get('group');

    const settings = await prisma.landingSetting.findMany({
      where: group ? { group } : undefined,
      orderBy: { key: 'asc' }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
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
    const { key, value, type, label, group } = body;

    if (!key || !value || !label) {
      return NextResponse.json({ error: 'Key, value and label are required' }, { status: 400 });
    }

    const setting = await prisma.landingSetting.upsert({
      where: { key },
      update: { value, type, label, group },
      create: {
        key,
        value,
        type: type ?? 'text',
        label,
        group: group ?? 'general'
      }
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Error creating setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Settings array is required' }, { status: 400 });
    }

    const results = await Promise.all(
      settings.map((setting: any) =>
        prisma.landingSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value,
            type: setting.type ?? 'text',
            label: setting.label ?? setting.key,
            group: setting.group ?? 'general'
          }
        })
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
