import { prisma } from "../database/prisma";

export type IntegrationName = "CRM" | "FULFILLMENT" | "CALL";
export const integrationNames: IntegrationName[] = [
  "CRM",
  "FULFILLMENT",
  "CALL",
];

export type IntegrationRunSummaryRecord = {
  id: string;
  integrationName: IntegrationName;
  status: string;
  errorMessage: string | null;
  startedAt: Date;
  finishedAt: Date | null;
};

export type RecentIntegrationRunRecord = IntegrationRunSummaryRecord & {
  caseId: string;
  case: {
    subject: string;
  } | null;
};

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

export async function listIntegrationRunSummaries() {
  return prisma.integrationRun.findMany({
    select: {
      id: true,
      integrationName: true,
      status: true,
      errorMessage: true,
      startedAt: true,
      finishedAt: true,
    },
    where: {
      integrationName: {
        in: integrationNames,
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  }) as Promise<IntegrationRunSummaryRecord[]>;
}

export async function listRecentIntegrationRuns(limit = 20) {
  return prisma.integrationRun.findMany({
    select: {
      id: true,
      caseId: true,
      integrationName: true,
      status: true,
      errorMessage: true,
      startedAt: true,
      finishedAt: true,
      case: {
        select: {
          subject: true,
        },
      },
    },
    where: {
      integrationName: {
        in: integrationNames,
      },
    },
    orderBy: {
      startedAt: "desc",
    },
    take: limit,
  }) as Promise<RecentIntegrationRunRecord[]>;
}
