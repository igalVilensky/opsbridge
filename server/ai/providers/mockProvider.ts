import { aiAssistanceSchema, type AiAssistanceResult, type AiCaseContext } from "../types";

function buildCustomerLabel(context: AiCaseContext) {
  return context.customerSnapshot?.name?.trim() || "Kundin oder Kunde";
}

export async function generateMockAssistance(
  context: AiCaseContext,
): Promise<AiAssistanceResult> {
  const customerLabel = buildCustomerLabel(context);
  const shippingStatus = context.orderSnapshot?.shippingStatus?.trim() || "nicht verfügbar";
  const orderStatus = context.orderSnapshot?.orderStatus?.trim() || "nicht verfügbar";
  const callNote = context.callSnapshot?.note?.trim();

  const result = aiAssistanceSchema.parse({
    summary: `${customerLabel} hat eine Anfrage zum Fall "${context.subject}" gestellt. Der Bestellstatus ist ${orderStatus}, der Versandstatus ${shippingStatus}.`,
    suggestedAction:
      shippingStatus.toLowerCase().includes("delayed") ||
      shippingStatus.toLowerCase().includes("verzög")
        ? "Versandstatus mit dem Fulfillment-System prüfen, die voraussichtliche Zustellung bestätigen und den Kunden aktiv informieren."
        : "Die verfügbaren Fall- und Bestelldaten prüfen und dem Kunden die nächsten konkreten Schritte mitteilen.",
    draftResponse: [
      `Guten Tag ${customerLabel},`,
      "",
      "vielen Dank für Ihre Nachricht. Wir prüfen den aktuellen Stand Ihres Anliegens anhand der vorhandenen Informationen.",
      `Bestellstatus: ${orderStatus}.`,
      `Versandstatus: ${shippingStatus}.`,
      callNote ? `Letzte Gesprächsnotiz: ${callNote}.` : null,
      "",
      "Sobald uns weitere Details vorliegen, melden wir uns bei Ihnen mit den nächsten Schritten.",
      "",
      "Mit freundlichen Grüßen",
      "Ihr Kundenservice",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  });

  return result;
}
