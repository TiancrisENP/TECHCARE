import "dotenv/config";
import { createApp } from "./app";

process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection (el API sigue activo):", err);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});

const PORT = Number(process.env.PORT || 4000);
const app = createApp();

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`TECHCARE API escuchando en el puerto ${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Puerto ${PORT} ocupado. Cierra el proceso anterior de npm run dev e inténtalo de nuevo.`);
    process.exit(1);
  }
  throw err;
});
