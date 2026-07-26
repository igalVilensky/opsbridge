import { approveCaseService } from "../../../services/approvalService";

export default defineEventHandler(async (event) => {
  const caseId = getRouterParam(event, "id");
  const body = await readBody<{ approvedResponse?: string }>(event);

  if (!caseId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Case ID is required",
    });
  }

  return approveCaseService(caseId, body?.approvedResponse);
});