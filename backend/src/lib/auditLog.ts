import { prisma } from './prisma';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'REGISTER'
  | 'EXAM_START'
  | 'EXAM_SUBMIT'
  | 'EXAM_TAB_SWITCH'
  | 'EXAM_FLAGGED'
  | 'ADMIN_CREATE'
  | 'ADMIN_UPDATE'
  | 'ADMIN_DELETE'
  | 'SECURITY_EVENT';

interface AuditLogParams {
  userId?: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export function getClientInfo(headers: Record<string, string | undefined>) {
  return {
    ipAddress: headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown',
    userAgent: headers['user-agent'] || 'unknown',
  };
}
