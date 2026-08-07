import { prisma } from "../database/prisma";
import { getIntegrationMonitoringOverview } from "./integrationMonitoringService";
import {
  infrastructureConnections,
  infrastructureNodes,
  type InfrastructureMetadataValue,
  type InfrastructureNode,
  type InfrastructureNodeStatus,
  type InfrastructureResponse,
} from "~/shared/infrastructure";

type InfrastructureNodeRuntime = Pick<InfrastructureNode, "status" | "metadata">;

const integrationNodeMap: Record<string, string> = {
  crm: "CRM",
  fulfillment: "FULFILLMENT",
  "call-system": "CALL",
};

function toInfrastructureStatus(health: "HEALTHY" | "DEGRADED" | "UNKNOWN"): InfrastructureNodeStatus {
  if (health === "HEALTHY") return "healthy";
  if (health === "DEGRADED") return "degraded";
  return "unknown";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getRuntimeConfigSnapshot() {
  const runtimeConfig = useRuntimeConfig();
  const providerName = process.env.AI_PROVIDER?.trim().toLowerCase() || "groq";
  const groqModel = runtimeConfig.groqModel?.trim() || "openai/gpt-oss-20b";
  const groqApiKey = runtimeConfig.groqApiKey?.trim() ?? "";

  return {
    providerName,
    groqModel,
    groqApiKey,
  };
}

async function resolveDatabaseMetadata(): Promise<InfrastructureNodeRuntime> {
  const [caseCount, integrationRunCount] = await Promise.all([
    prisma.case.count(),
    prisma.integrationRun.count(),
  ]);

  return {
    status: "healthy" as const,
    metadata: {
      database: "SQLite",
      orm: "Prisma",
      cases: caseCount,
      integrationRuns: integrationRunCount,
    },
  };
}

async function resolveDatabaseRuntime(): Promise<InfrastructureNodeRuntime> {
  try {
    return await resolveDatabaseMetadata();
  } catch (error) {
    console.error("Infrastructure database check failed", error);

    return {
      status: "degraded" as const,
      metadata: {
        database: "SQLite",
        orm: "Prisma",
      },
    };
  }
}

function resolveAiRuntime(): InfrastructureNodeRuntime {
  const { providerName, groqModel, groqApiKey } = getRuntimeConfigSnapshot();
  const configured = providerName === "groq" && Boolean(groqApiKey);

  return {
    status:
      providerName === "groq"
        ? (configured ? "healthy" : "degraded")
        : "unknown",
    metadata: {
      provider: capitalize(providerName),
      model: groqModel,
      state:
        providerName === "groq"
          ? (configured ? "configured" : "missing API key")
          : `configured for ${capitalize(providerName)}`,
    } satisfies Record<string, InfrastructureMetadataValue>,
  };
}

function resolveApplicationRuntime(): InfrastructureNodeRuntime {
  return {
    status: "healthy",
    metadata: {
      framework: "Nuxt 3 / Nitro",
      role: "Orchestration API",
    },
  };
}

function mapIntegrationMetadata(summary: {
  lastRunAt: string | null;
  successRate: number;
  successfulRuns: number;
  failedRuns: number;
  lastError: string | null;
}) {
  return {
    lastRunAt: summary.lastRunAt,
    successRate: summary.successRate,
    successfulRuns: summary.successfulRuns,
    failedRuns: summary.failedRuns,
    lastError: summary.lastError,
  };
}

export async function getInfrastructureSnapshot(): Promise<InfrastructureResponse> {
  const [monitoring, databaseRuntime] = await Promise.all([
    getIntegrationMonitoringOverview(),
    resolveDatabaseRuntime(),
  ]);

  const runtimeByNodeId = new Map<string, InfrastructureNodeRuntime>();
  const integrationNodeIdByName = new Map(
    Object.entries(integrationNodeMap).map(([nodeId, integrationName]) => [
      integrationName,
      nodeId,
    ]),
  );

  runtimeByNodeId.set("opsbridge-api", resolveApplicationRuntime());

  for (const integrationSummary of monitoring.integrations) {
    const nodeId = integrationNodeIdByName.get(integrationSummary.integrationName);

    if (!nodeId) continue;

    runtimeByNodeId.set(nodeId, {
      status: toInfrastructureStatus(integrationSummary.health),
      metadata: mapIntegrationMetadata({
        lastRunAt: integrationSummary.lastRunAt,
        successRate: integrationSummary.successRate,
        successfulRuns: integrationSummary.successfulRuns,
        failedRuns: integrationSummary.failedRuns,
        lastError: integrationSummary.lastError,
      }),
    });
  }

  runtimeByNodeId.set("database", databaseRuntime);
  runtimeByNodeId.set("ai-provider", resolveAiRuntime());

  const nodes = infrastructureNodes.map((node) => {
    const runtime = runtimeByNodeId.get(node.id);

    return {
      ...node,
      status: runtime?.status ?? "unknown",
      metadata: runtime?.metadata,
    };
  });

  return {
    nodes,
    connections: infrastructureConnections,
  };
}
