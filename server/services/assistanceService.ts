import { generateAiAssistance } from "./aiService";
import {
  findCaseById,
  saveAiAssistance,
  updateCaseStatus,
} from "../repositories/caseRepository";
import { createCaseEvent } from "../repositories/eventRepository";

export async function generateCaseAssistance(caseId: string) {
  const supportCase = await findCaseById(caseId);

  if (!supportCase) {
    throw createError({
      statusCode: 404,
      statusMessage: "Case not found",
    });
  }

  const assistance = await generateAiAssistance({
    originalMessage: supportCase.originalMessage,
    customerName: supportCase.customerSnapshot?.name,
    orderStatus: supportCase.orderSnapshot?.orderStatus,
    shippingStatus: supportCase.orderSnapshot?.shippingStatus,
    callNote: supportCase.callSnapshot?.note ?? undefined,
  });

  await saveAiAssistance(caseId, assistance);

  const alreadyGenerated = supportCase.events.some(
    (event) => event.eventType === "AI_SUMMARY_GENERATED",
  );

  if (!alreadyGenerated) {
    await createCaseEvent(
      caseId,
      "AI_SUMMARY_GENERATED",
      "AI assistance generated",
    );
  }

  await updateCaseStatus(caseId, "READY_FOR_REVIEW");

  return findCaseById(caseId);
}