import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { notifyAdmins } from '@/lib/notification-service';

// POST /api/verification - Submit a verification request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, photoUrl, documentUrl, socialLink } = await request.json();

    // Check for existing pending request
    const existing = await prisma.verificationRequest.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Você já tem uma solicitação de verificação pendente' },
        { status: 400 }
      );
    }

    const request_ = await prisma.verificationRequest.create({
      data: {
        userId: session.user.id,
        type: type || 'PHOTO',
        photoUrl,
        documentUrl,
        socialLink,
        status: 'PENDING',
      },
    });

    // Notify admins
    await notifyAdmins({
      title: "Nova Solicitação de Verificação",
      message: `O usuário ${session.user.name || session.user.email} solicitou verificação de perfil.`,
      type: "verification",
      metadata: { 
        requestId: request_.id, 
        userId: session.user.id,
        avatarUrl: photoUrl || null // A foto da selfie enviada
      }
    });

    // Update user status to PENDING
    await prisma.user.update({
      where: { id: session.user.id },
      data: { verificationStatus: 'PENDING' },
    });

    return NextResponse.json({ success: true, id: request_.id });
  } catch (error: any) {
    console.error('Verification request error:', error);
    return NextResponse.json(
      { error: 'Falha ao enviar solicitação de verificação' },
      { status: 500 }
    );
  }
}

// GET /api/verification - Get current user's verification status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verificationStatus: true },
    });

    const latestRequest = await prisma.verificationRequest.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        reviewedAt: true,
      },
    });

    return NextResponse.json({
      verificationStatus: user?.verificationStatus || 'UNVERIFIED',
      latestRequest,
    });
  } catch (error: any) {
    console.error('Verification status error:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar status de verificação' },
      { status: 500 }
    );
  }
}
