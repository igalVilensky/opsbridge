import { enrichCase } from "../../../services/enrichmentService";

export default defineEventHandler(async (event) => {
  const caseId = getRouterParam(event, "id");

  if (!caseId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Case ID is required",
    });
  }

  return enrichCase(caseId);
});