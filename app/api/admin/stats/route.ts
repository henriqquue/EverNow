import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== 'ADMIN' && admin?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, newToday, pendingReports, pendingVerifications] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: today } } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      totalUsers,
      newToday,
      pendingReports,
      pendingVerifications,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
