export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/admin/verification - List verification requests
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status !== 'ALL') {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              userPhotos: { take: 1, orderBy: { order: 'asc' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    return NextResponse.json({ requests, total, page, limit });
  } catch (error: any) {
    console.error('Admin verification list error:', error);
    return NextResponse.json(
      { error: 'Falha ao listar verificações' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/verification - Approve or reject a verification request
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mod = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (mod?.role !== 'ADMIN' && mod?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { requestId, action, notes, rejectionReason } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'requestId and action are required' },
        { status: 400 }
      );
    }

    const verificationReq = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!verificationReq) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const isApprove = action === 'approve';
    const newStatus = isApprove ? 'VERIFIED' : 'REJECTED';

    // Update verification request
    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus as any,
        reviewedById: session.user.id,
        reviewerNotes: notes || null,
        rejectionReason: isApprove ? null : (rejectionReason || null),
        reviewedAt: new Date(),
      },
    });

    // Update user verification status
    await prisma.user.update({
      where: { id: verificationReq.userId },
      data: { verificationStatus: newStatus as any },
    });

    // Create moderation action for audit
    await prisma.moderationAction.create({
      data: {
        targetUserId: verificationReq.userId,
        moderatorId: session.user.id,
        actionType: isApprove ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
        reason: isApprove ? 'Verificação aprovada' : (rejectionReason || 'Verificação rejeitada'),
        notes,
      },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error('Admin verification action error:', error);
    return NextResponse.json(
      { error: 'Falha ao processar verificação' },
      { status: 500 }
    );
  }
}

