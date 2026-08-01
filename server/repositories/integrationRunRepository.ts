import { prisma } from "../database/prisma";

export type IntegrationName = "CRM" | "FULFILLMENT" | "CALL";

export async function startIntegrationRun(
  caseId: string,
  enrichmentRunId: string,
  integrationName: IntegrationName,
) {
  return prisma.integrationRun.create({
    data: {
      caseId,
      enrichmentRunId,
      integrationName,
      status: "RUNNING",
    },
  });
}

export async function completeIntegrationRun(id: string) {
  return prisma.integrationRun.update({
    where: {
      id,
    },
    data: {
      status: "SUCCESS",
      finishedAt: new Date(),
      errorMessage: null,
    },
  });
}

export async function failIntegrationRun(
  id: string,
  errorMessage: string,
) {
  return prisma.integrationRun.update({
    where: {
      id,
    },
    data: {
      status: "FAILED",
      errorMessage,
      finishedAt: new Date(),
    },
  });
}
