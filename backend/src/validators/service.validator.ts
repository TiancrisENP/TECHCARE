import { z } from "zod";

export const createServiceSchema = z.object({
  customerId: z.string().min(1, "Debes seleccionar el usuario del servicio").optional(),
  deviceName: z.string().min(2, "Indica el equipo"),
  brand: z.string().min(1).max(80).optional(),
  model: z.string().min(1).max(80).optional(),
  serialNumber: z.string().optional(),
  accessories: z.string().max(400).optional(),
  physicalCondition: z.string().max(400).optional(),
  notes: z.string().max(600).optional(),
  problem: z.string().min(5, "Describe el problema"),
  photoUrls: z.array(z.string().url()).max(8).optional(),
});

export const updateServiceStatusSchema = z.object({
  status: z.enum([
    "RECIBIDO",
    "DIAGNOSTICO",
    "COTIZACION",
    "ESPERANDO_APROBACION",
    "EN_REPARACION",
    "LISTO",
    "ENTREGADO",
    "CANCELADO",
  ]),
  note: z.string().optional(),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string(),
});

export const setDiagnosisSchema = z.object({
  diagnosis: z.string().min(5),
  quotedAmount: z.number().positive().optional(),
});
