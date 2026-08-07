import { generateAiAssistance } from "./aiService";
import {
  findCaseById,
  saveAiAssistance,
  updateCaseStatus,
} from "../repositories/caseRepository";
import { createCaseEvent } from "../repositories/eventRepository";
import type { AiCaseContext } from "../ai/types";

function buildAiCaseContext(
  supportCase: NonNullable<Awaited<ReturnType<typeof findCaseById>>>,
): AiCaseContext {
  return {
    subject: supportCase.subject,
    originalMessage: supportCase.originalMessage,
    customerEmail: supportCase.customerEmail,
    customerSnapshot: supportCase.customerSnapshot
      ? {
          name: supportCase.customerSnapshot.name,
          email: supportCase.customerSnapshot.email,
          phone: supportCase.customerSnapshot.phone,
          company: supportCase.customerSnapshot.company,
          status: supportCase.customerSnapshot.status,
        }
      : null,
    orderId: supportCase.orderId,
    orderSnapshot: supportCase.orderSnapshot
      ? {
          externalOrderId: supportCase.orderSnapshot.externalOrderId,
          orderStatus: supportCase.orderSnapshot.orderStatus,
          shippingStatus: supportCase.orderSnapshot.shippingStatus,
          shippingProvider: supportCase.orderSnapshot.shippingProvider,
          trackingNumber: supportCase.orderSnapshot.trackingNumber,
        }
      : null,
    callSnapshot: supportCase.callSnapshot
      ? {
          externalCallId: supportCase.callSnapshot.externalCallId,
          calledAt: supportCase.callSnapshot.calledAt.toISOString(),
          durationSeconds: supportCase.callSnapshot.durationSeconds,
          callStatus: supportCase.callSnapshot.callStatus,
          note: supportCase.callSnapshot.note,
        }
      : null,
    department: supportCase.department,
    priority: supportCase.priority,
  };
}

export async function generateCaseAssistance(caseId: string) {
  const supportCase = await findCaseById(caseId);

  if (!supportCase) {
    throw createError({
      statusCode: 404,
      statusMessage: "Case not found",
    });
  }

  const assistance = await generateAiAssistance(buildAiCaseContext(supportCase));

  await saveAiAssistance(caseId, assistance);

  const alreadyGenerated = supportCase.events.some(
    (event) => event.eventType === "AI_SUMMARY_GENERATED",
  );

  if (!alreadyGenerated) {
    await createCaseEvent(
      caseId,
      "AI_SUMMARY_GENERATED",
      "KI-Unterstützung generiert",
    );
  }

  await updateCaseStatus(caseId, "READY_FOR_REVIEW");

  return findCaseById(caseId);
}
