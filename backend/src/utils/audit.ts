import { prisma } from "../config/db";

interface AuditParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

/**
 * Registra un evento de auditoría. Nunca debe tumbar la request principal:
 * si falla, solo se loggea el error en consola.
 */
export async function recordAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details as any,
      },
    });
  } catch (err) {
    console.error("No se pudo registrar auditoría:", err);
  }
}
