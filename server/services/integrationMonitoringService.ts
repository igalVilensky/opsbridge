import {
  integrationNames,
  listIntegrationRunSummaries,
  listRecentIntegrationRuns,
  type IntegrationName,
} from "../repositories/integrationRunRepository";

export type IntegrationHealth = "HEALTHY" | "DEGRADED" | "UNKNOWN";

export type IntegrationSummaryDto = {
  integrationName: IntegrationName;
  health: IntegrationHealth;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
};

export type RecentIntegrationRunDto = {
  id: string;
  integrationName: IntegrationName;
  status: string;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  caseId: string;
  caseSubject: string | null;
};

export type IntegrationMonitoringResponse = {
  integrations: IntegrationSummaryDto[];
  recentRuns: RecentIntegrationRunDto[];
};

const successStatuses = new Set(["SUCCESS", "COMPLETED"]);
const nonHealthyStatuses = new Set(["FAILED", "RUNNING", "PENDING"]);

function resolveHealth(lastStatus: string | null, totalRuns: number): IntegrationHealth {
  if (totalRuns === 0) {
    return "UNKNOWN";
  }

  if (!lastStatus) {
    return "UNKNOWN";
  }

  if (nonHealthyStatuses.has(lastStatus)) {
    return "DEGRADED";
  }

  return "HEALTHY";
}

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function getIntegrationMonitoringOverview(): Promise<IntegrationMonitoringResponse> {
  const [summaryRuns, recentRuns] = await Promise.all([
    listIntegrationRunSummaries(),
    listRecentIntegrationRuns(20),
  ]);

  const integrations = integrationNames.map((integrationName) => {
    const runs = summaryRuns.filter(
      (run) => run.integrationName === integrationName,
    );

    const sortedRuns = [...runs].sort(
      (firstRun, secondRun) =>
        new Date(secondRun.startedAt).getTime() -
        new Date(firstRun.startedAt).getTime(),
    );

    const totalRuns = runs.length;
    const successfulRuns = runs.filter((run) => successStatuses.has(run.status)).length;
    const failedRuns = runs.filter((run) => run.status === "FAILED").length;
    const lastRun = sortedRuns[0];

    return {
      integrationName,
      health: resolveHealth(lastRun?.status ?? null, totalRuns),
      totalRuns,
      successfulRuns,
      failedRuns,
      successRate:
        totalRuns === 0
          ? 0
          : Number(((successfulRuns / totalRuns) * 100).toFixed(1)),
      lastRunAt: toIsoString(lastRun?.startedAt),
      lastStatus: lastRun?.status ?? null,
      lastError: lastRun?.errorMessage ?? null,
    };
  });

  return {
    integrations,
    recentRuns: recentRuns.map((run) => ({
      id: run.id,
      integrationName: run.integrationName,
      status: run.status,
      errorMessage: run.errorMessage,
      startedAt: run.startedAt.toISOString(),
      finishedAt: toIsoString(run.finishedAt),
      caseId: run.caseId,
      caseSubject: run.case?.subject ?? null,
    })),
  };
}
