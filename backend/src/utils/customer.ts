import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";

/** Cliente autenticado: siempre es él. Staff: debe elegir un usuario activo. */
export async function resolveCustomerId(req: AuthRequest, requestedId?: string): Promise<string> {
  if (req.user!.role === "CLIENTE") {
    return req.user!.sub;
  }

  if (!requestedId) {
    throw new ApiError(400, "Debes seleccionar el usuario al que se asignará el registro.");
  }

  const customer = await prisma.user.findUnique({ where: { id: requestedId } });
  if (!customer) {
    throw new ApiError(400, "El usuario seleccionado no existe.");
  }
  if (!customer.active) {
    throw new ApiError(400, "El usuario seleccionado está inactivo.");
  }

  return customer.id;
}
