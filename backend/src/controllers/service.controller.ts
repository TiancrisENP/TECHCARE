import { Response, Request } from "express";
import { randomBytes } from "crypto";
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
import { resolveCustomerId } from "../utils/customer";
import { buildServicePdf, ServicePdfKind } from "../utils/servicePdf";

const serviceInclude = {
  customer: true,
  technician: true,
  photos: { orderBy: { createdAt: "asc" as const } },
  statusHistory: { orderBy: { changedAt: "asc" as const } },
};

function generateTrackingCode(): string {
  return `TRK-${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function uniqueTrackingCode() {
  for (let i = 0; i < 8; i++) {
    const trackingCode = generateTrackingCode();
    const exists = await prisma.service.findUnique({ where: { trackingCode } });
    if (!exists) return trackingCode;
  }
  throw new ApiError(500, "No se pudo generar un código de seguimiento.");
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
    include: { customer: true, technician: true, photos: true },
    orderBy: { receivedAt: "desc" },
  });

  res.json(services);
}

export async function getService(req: AuthRequest, res: Response) {
  const service = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: serviceInclude,
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
      brand: true,
      model: true,
      accessories: true,
      physicalCondition: true,
      photos: { select: { imageUrl: true } },
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

  const trackingCode = await uniqueTrackingCode();
  const photoUrls = data.photoUrls ?? [];

  const service = await prisma.service.create({
    data: {
      customerId,
      technicianId: req.user!.role === "TECNICO" ? req.user!.sub : undefined,
      deviceName: data.deviceName,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      accessories: data.accessories,
      physicalCondition: data.physicalCondition,
      notes: data.notes,
      problem: data.problem,
      trackingCode,
      statusHistory: { create: { status: "RECIBIDO", note: "Equipo recibido en tienda." } },
      photos: photoUrls.length
        ? { create: photoUrls.map((imageUrl) => ({ imageUrl })) }
        : undefined,
    },
    include: { customer: true, technician: true, photos: true },
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

export async function downloadServicePdf(req: AuthRequest, res: Response) {
  const kind = String(req.query.type || "orden") as ServicePdfKind;
  const allowed: ServicePdfKind[] = ["orden", "factura", "entrega", "diagnostico"];
  if (!allowed.includes(kind)) {
    throw new ApiError(400, "Tipo de documento no válido.");
  }

  const service = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      technician: { select: { name: true } },
      photos: true,
    },
  });
  if (!service) throw new ApiError(404, "Servicio no encontrado.");
  if (req.user!.role === "CLIENTE" && service.customerId !== req.user!.sub) {
    throw new ApiError(403, "No autorizado.");
  }

  const pdf = await buildServicePdf(service, kind);
  const filename = `${kind}-${service.trackingCode}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(pdf);
}
