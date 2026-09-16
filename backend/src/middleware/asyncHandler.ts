import { RequestHandler, Router } from "express";

/** Express 4 no captura promesas rechazadas de handlers async. */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function catchAsyncErrors(router: Router) {
  const stack = (router as unknown as { stack: Layer[] }).stack;
  if (!stack) return;

  for (const layer of stack) {
    if (layer.route) {
      for (const handler of layer.route.stack) {
        if (handler.handle.length !== 4) {
          handler.handle = asyncHandler(handler.handle);
        }
      }
    } else if (layer.name === "router" && layer.handle) {
      catchAsyncErrors(layer.handle as Router);
    }
  }
}

type Layer = {
  name?: string;
  handle?: Router | RequestHandler;
  route?: { stack: Array<{ handle: RequestHandler }> };
};
