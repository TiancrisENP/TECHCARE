import express, { RequestHandler, Router } from "express";

type LayerProto = {
  handle_request: (req: unknown, res: unknown, next: (err?: unknown) => void) => void;
  __techcarePatched?: boolean;
};

/**
 * Express 4 no pasa a errorHandler las promesas rechazadas de handlers async.
 * Sin esto, un ApiError tumba el proceso y el frontend ve fallos / 404.
 */
export function patchExpressAsyncErrors() {
  const probe = express.Router();
  probe.use((_req, _res, next) => next());
  const layer = (probe as unknown as { stack: object[] }).stack[0];
  const proto = Object.getPrototypeOf(layer) as LayerProto;
  if (!proto || proto.__techcarePatched) return;
  proto.__techcarePatched = true;

  proto.handle_request = function handle_request(req, res, next) {
    const fn = (this as unknown as { handle?: RequestHandler }).handle;
    if (!fn) {
      next();
      return;
    }
    if (fn.length > 3) {
      next();
      return;
    }
    try {
      const result: unknown = fn(req as never, res as never, next);
      if (result && typeof result === "object" && "then" in result) {
        (result as Promise<unknown>).catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
}

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function catchAsyncErrors(_router: Router) {
  patchExpressAsyncErrors();
}
