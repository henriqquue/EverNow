import prisma from '@/lib/db';
import { LGPDAuditAction } from '@prisma/client';

interface AuditLogParams {
  userId: string;
  actionType: LGPDAuditAction;
  entityType: string;
  entityId: string;
  description: string;
  performedBy?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    return await prisma.lGPDAuditLog.create({
      data: {
        userId: params.userId,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        performedBy: params.performedBy || 'Sistema',
        oldValues: params.oldValues,
        newValues: params.newValues,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Falha ao criar log de auditoria:', error);
  }
}
