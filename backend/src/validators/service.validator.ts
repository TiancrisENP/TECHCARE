import { z } from "zod";

export const createServiceSchema = z.object({
  customerId: z.string().min(1, "Debes seleccionar el usuario del servicio").optional(),
  deviceName: z.string().min(2),
  serialNumber: z.string().optional(),
  problem: z.string().min(5),
});

export const updateServiceStatusSchema = z.object({
  status: z.enum([
    "RECIBIDO", "DIAGNOSTICO", "COTIZACION", "ESPERANDO_APROBACION",
    "EN_REPARACION", "LISTO", "ENTREGADO", "CANCELADO",
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
