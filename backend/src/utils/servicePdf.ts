import PDFDocument from "pdfkit";
import { Service, User } from "@prisma/client";

type ServiceDoc = Service & {
  customer: Pick<User, "name" | "email" | "phone">;
  technician: Pick<User, "name"> | null;
  photos?: { imageUrl: string }[];
};

export type ServicePdfKind = "orden" | "factura" | "entrega" | "diagnostico";

function money(value: unknown) {
  if (value == null) return "—";
  return `$${Number(value).toLocaleString("es-CO")}`;
}

function line(doc: PDFKit.PDFDocument, label: string, value?: string | null) {
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#5c5346").text(label.toUpperCase());
  doc.font("Helvetica").fontSize(11).fillColor("#1a1916").text(value?.trim() || "—").moveDown(0.6);
}

export function buildServicePdf(service: ServiceDoc, kind: ServicePdfKind): Promise<Buffer> {
  const titles: Record<ServicePdfKind, string> = {
    orden: "ORDEN DE SERVICIO",
    factura: "FACTURA / COTIZACIÓN",
    entrega: "COMPROBANTE DE ENTREGA",
    diagnostico: "REPORTE DE DIAGNÓSTICO",
  };

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, doc.page.width, 72).fill("#2b2a28");
    doc.fillColor("#f4f1ea").font("Helvetica-Bold").fontSize(18).text("TECHCARE", 48, 22);
    doc.font("Helvetica").fontSize(9).fillColor("#c9783a").text("taller · inventario · servicio técnico", 48, 44);

    doc.fillColor("#1a1916").font("Helvetica-Bold").fontSize(14).text(titles[kind], 48, 96);
    doc.font("Courier-Bold").fontSize(16).fillColor("#c9783a").text(service.trackingCode, { continued: false });
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(9).fillColor("#5c5346").text(
      `Fecha de recepción: ${new Date(service.receivedAt).toLocaleString("es-CO")}`
    );
    doc.moveDown(1);

    line(doc, "Cliente", `${service.customer.name} · ${service.customer.email}${service.customer.phone ? ` · ${service.customer.phone}` : ""}`);
    line(doc, "Equipo", service.deviceName);
    line(doc, "Marca", service.brand);
    line(doc, "Modelo", service.model);
    line(doc, "Serial", service.serialNumber);
    line(doc, "Accesorios entregados", service.accessories);
    line(doc, "Estado físico", service.physicalCondition);
    line(doc, "Problema reportado", service.problem);
    line(doc, "Observaciones", service.notes);
    line(doc, "Técnico", service.technician?.name);
    line(doc, "Estado actual", service.status.replaceAll("_", " "));

    if (kind === "diagnostico" || kind === "factura" || service.diagnosis) {
      line(doc, "Diagnóstico", service.diagnosis);
    }
    if (kind === "factura" || service.quotedAmount != null) {
      line(doc, "Valor cotizado / factura", money(service.quotedAmount));
    }
    if (kind === "entrega") {
      line(doc, "Entrega", "El cliente recibe el equipo en las condiciones descritas y conforme al diagnóstico.");
    }

    doc.moveDown(1.5);
    doc.font("Helvetica").fontSize(9).fillColor("#5c5346").text("Firma del cliente:");
    doc.moveDown(2);
    doc.strokeColor("#2b2a28").lineWidth(0.8).moveTo(48, doc.y).lineTo(280, doc.y).stroke();
    doc.moveDown(2);
    doc.font("Helvetica").fontSize(8).fillColor("#5c5346").text(
      "TECHCARE — documento generado automáticamente. Conserva este comprobante junto al código de seguimiento."
    );

    doc.end();
  });
}
