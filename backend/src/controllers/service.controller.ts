import { Response } from "express";
import { prisma } from "../config/db";
import {
  createServiceSchema,
  updateServiceStatusSchema,
  assignTechnicianSchema,
  setDiagnosisSchema,
} from "../validators/service.validator";
import { ApiError } from "../middleware/error.middleware";
import { recordAudit } from "../utils/audit";
import { AuthRequest } from "../middleware/auth.middleware";
import { Request } from "express";
import { resolveCustomerId } from "../utils/customer";

function generateTrackingCode(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `TRK-${num}`;
}

export async function listServices(req: AuthRequest, res: Response) {
  const { role, sub } = req.user!;

  const where =
    role === "CLIENTE"
      ? { customerId: sub }
      : role === "TECNICO"
      ? {} // el técnico ve todos, pero podría filtrarse a los suyos si se prefiere
      : {};

  const services = await prisma.service.findMany({
    where,
    include: { customer: true, technician: true },
    orderBy: { receivedAt: "desc" },
  });

  res.json(services);
}

export async function getService(req: AuthRequest, res: Response) {
  const service = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: { customer: true, technician: true, statusHistory: { orderBy: { changedAt: "asc" } } },
  });
  if (!service) throw new ApiError(404, "Servicio no encontrado.");

  if (req.user!.role === "CLIENTE" && service.customerId !== req.user!.sub) {
    throw new ApiError(403, "No autorizado.");
  }

  res.json(service);
}

/** Endpoint público: el cliente consulta techcare.com/reparaciones/TRK-92831 sin login. */
export async function trackService(req: Request, res: Response) {
  const service = await prisma.service.findUnique({
    where: { trackingCode: req.params.code.toUpperCase() },
    select: {
      trackingCode: true,
      deviceName: true,
      serialNumber: true,
      problem: true,
      diagnosis: true,
      quotedAmount: true,
      status: true,
      receivedAt: true,
    },
  });
  if (!service) throw new ApiError(404, "No encontramos ninguna reparación con ese código.");
  res.json(service);
}

export async function createService(req: AuthRequest, res: Response) {
  const data = createServiceSchema.parse(req.body);
  const customerId = await resolveCustomerId(req, data.customerId);

  const service = await prisma.service.create({
    data: {
      customerId,
      technicianId: req.user!.role === "TECNICO" ? req.user!.sub : undefined,
      deviceName: data.deviceName,
      serialNumber: data.serialNumber,
      problem: data.problem,
      trackingCode: generateTrackingCode(),
      statusHistory: { create: { status: "RECIBIDO", note: "Equipo recibido en tienda." } },
    },
    include: { customer: true, technician: true },
  });

  await recordAudit({
    userId: req.user!.sub,
    action: "SERVICE_CREATED",
    entity: "Service",
    entityId: service.id,
    details: { trackingCode: service.trackingCode },
  });

  res.status(201).json(service);
}

export async function updateServiceStatus(req: AuthRequest, res: Response) {
  const data = updateServiceStatusSchema.parse(req.body);

  const before = await prisma.service.findUnique({ where: { id: req.params.id } });
  if (!before) throw new ApiError(404, "Servicio no encontrado.");

  const service = await prisma.$transaction(async (tx) => {
    const updated = await tx.service.update({
      where: { id: req.params.id },
      data: { status: data.status },
    });
    await tx.serviceStatusHistory.create({
      data: { serviceId: updated.id, status: data.status, note: data.note },
    });
    return updated;
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "SERVICE_STATUS_CHANGED",
    entity: "Service",
    entityId: service.id,
    details: { from: before.status, to: data.status },
  });

  res.json(service);
}

export async function assignTechnician(req: AuthRequest, res: Response) {
  const data = assignTechnicianSchema.parse(req.body);
  const service = await prisma.service.update({
    where: { id: req.params.id },
    data: { technicianId: data.technicianId },
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "SERVICE_TECHNICIAN_ASSIGNED",
    entity: "Service",
    entityId: service.id,
    details: { technicianId: data.technicianId },
  });

  res.json(service);
}

export async function setDiagnosis(req: AuthRequest, res: Response) {
  const data = setDiagnosisSchema.parse(req.body);
  const service = await prisma.service.update({
    where: { id: req.params.id },
    data: {
      diagnosis: data.diagnosis,
      quotedAmount: data.quotedAmount,
      status: data.quotedAmount ? "COTIZACION" : "DIAGNOSTICO",
    },
  });

  await prisma.serviceStatusHistory.create({
    data: { serviceId: service.id, status: service.status, note: data.diagnosis },
  });

  await recordAudit({
    userId: req.user?.sub,
    action: "SERVICE_DIAGNOSIS_SET",
    entity: "Service",
    entityId: service.id,
  });

  res.json(service);
}
