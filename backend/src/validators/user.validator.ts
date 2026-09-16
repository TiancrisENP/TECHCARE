import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["ADMIN", "VENDEDOR", "TECNICO", "CLIENTE"]),
  phone: z.string().optional(),
});
