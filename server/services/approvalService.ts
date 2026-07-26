import {
  approveCase,
  findCaseById,
} from "../repositories/caseRepository";
import { createCaseEvent } from "../repositories/eventRepository";

export async function approveCaseService(
  caseId: string,
  approvedResponse?: string,
) {
  const supportCase = await findCaseById(caseId);

  if (!supportCase) {
    throw createError({
      statusCode: 404,
      statusMessage: "Case not found",
    });
  }

  const responseToApprove =
    approvedResponse?.trim() || supportCase.draftResponse?.trim();

  if (!responseToApprove) {
    throw createError({
      statusCode: 409,
      statusMessage: "No draft response available",
    });
  }

  if (supportCase.status !== "READY_FOR_REVIEW") {
    throw createError({
      statusCode: 409,
      statusMessage: "Case is not ready for approval",
    });
  }

  await approveCase(caseId, responseToApprove);

  await createCaseEvent(
    caseId,
    "DRAFT_APPROVED",
    "Draft response approved",
  );

  return findCaseById(caseId);
}