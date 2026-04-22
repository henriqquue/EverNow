import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

/**
 * PUT /api/admin/lgpd/requests/[id]/process
 * Processar uma requisição LGPD (aprovar, rejeitar, completar)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await db.user.findUnique({
      where: { email: session.user.email! },
    });

    if (admin?.role !== 'ADMIN' && admin?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, notes, data } = body;

    if (!action || !['APPROVE', 'REJECT', 'COMPLETE'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const lgpdRequest = await db.lGPDRequest.findUnique({
      where: { id: params.id },
    });

    if (!lgpdRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    let updateData: any = { updatedAt: new Date() };

    if (action === 'APPROVE') {
      updateData.status = 'APPROVED';
      updateData.approvedById = admin.id;
      updateData.approvedAt = new Date();
      updateData.notes = notes;
    } else if (action === 'REJECT') {
      updateData.status = 'REJECTED';
      updateData.approvedById = admin.id;
      updateData.notes = notes;
    } else if (action === 'COMPLETE') {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
      updateData.data = data;
      // Gerar URL temporária para download
      updateData.downloadUrl = `/api/admin/lgpd/download/${params.id}`;
    }

    const updated = await db.lGPDRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    // Log de auditoria
    let auditAction: any = 'USER_UPDATED';
    if (action === 'COMPLETE') {
      if (lgpdRequest.requestType === 'DATA_EXPORT') auditAction = 'DATA_EXPORTED';
      if (lgpdRequest.requestType === 'DATA_ANONYMIZATION') auditAction = 'USER_ANONYMIZED';
      if (lgpdRequest.requestType === 'DATA_DELETION') auditAction = 'USER_DELETED';
    }

    await db.lGPDAuditLog.create({
      data: {
        userId: lgpdRequest.userId,
        actionType: auditAction,
        entityType: 'LGPDRequest',
        entityId: params.id,
        description: `LGPD request ${action.toLowerCase()}: ${lgpdRequest.requestType}`,
        performedBy: admin.id,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Process LGPD request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
