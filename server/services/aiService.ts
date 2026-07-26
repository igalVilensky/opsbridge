type AiAssistanceInput = {
  originalMessage: string;
  customerName?: string;
  orderStatus?: string;
  shippingStatus?: string;
  callNote?: string;
};

export type AiAssistanceResult = {
  summary: string;
  suggestedAction: string;
  draftResponse: string;
};

export async function generateAiAssistance(
  input: AiAssistanceInput,
): Promise<AiAssistanceResult> {
  const customerName = input.customerName ?? "Kundin oder Kunde";

  return {
    summary: `${customerName} contacted customer service regarding an order. The current shipping status is ${input.shippingStatus ?? "unknown"}.`,
    suggestedAction:
      input.shippingStatus === "delayed"
        ? "Contact the shipping provider, verify the expected delivery date, and update the customer."
        : "Review the available order information and contact the customer with the next steps.",
    draftResponse: `Guten Tag ${customerName},

vielen Dank für Ihre Nachricht. Wir prüfen aktuell den Status Ihrer Bestellung.

Der aktuelle Versandstatus lautet: ${input.shippingStatus ?? "nicht verfügbar"}.

Wir melden uns bei Ihnen, sobald uns weitere Informationen vorliegen.

Mit freundlichen Grüßen
Ihr Kundenservice`,
  };
}