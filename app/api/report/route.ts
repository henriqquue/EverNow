import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';
import { notifyAdmins } from '@/lib/notification-service';

// POST /api/report - Report a user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, reason, description, evidence } = await request.json();

    if (!userId || !reason) {
      return NextResponse.json(
        { error: 'User ID and reason are required' },
        { status: 400 }
      );
    }

    // Check if already reported recently (within 24h)
    const recentReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        reportedUserId: userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (recentReport) {
      return NextResponse.json(
        { error: 'You have already reported this user recently' },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        reportedUserId: userId,
        reason,
        description,
        evidence: evidence || [],
        status: 'PENDING'
      }
    });
    
    // Fetch reported user with photo
    const reportedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { userPhotos: { take: 1, orderBy: { order: 'asc' } } }
    });
    
    // Notify admins
    await notifyAdmins({
      title: "Nova Denúncia",
      message: `Um novo usuário foi denunciado. Motivo: ${reason}`,
      type: "report",
      metadata: { 
        reportId: report.id, 
        reportedUserId: userId,
        avatarUrl: reportedUser?.userPhotos[0]?.url || null
      }
    });

    // Track event
    await trackEvent({
      userId: session.user.id,
      eventType: 'profile_reported',
      eventData: { reportedUserId: userId, reason }
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error: any) {
    console.error('Error reporting user:', error);
    return NextResponse.json(
      { error: 'Failed to report user' },
      { status: 500 }
    );
  }
}

// GET /api/report - Get user's reports (admin only)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const reports = await prisma.report.findMany({
      where: { status: status as any },
      include: {
        reporter: {
          select: { id: true, name: true, email: true }
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            userPhotos: { take: 1, orderBy: { order: 'asc' } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
