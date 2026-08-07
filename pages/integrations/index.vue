<script setup lang="ts">
import SectionCard from "~/components/ui/SectionCard.vue";

definePageMeta({
  title: "Integrations",
});

type IntegrationName = "CRM" | "FULFILLMENT" | "CALL";
type IntegrationHealth = "HEALTHY" | "DEGRADED" | "UNKNOWN";

type IntegrationSummary = {
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

type RecentIntegrationRun = {
  id: string;
  integrationName: IntegrationName;
  status: string;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  caseId: string;
  caseSubject: string | null;
};

type IntegrationMonitoringResponse = {
  integrations: IntegrationSummary[];
  recentRuns: RecentIntegrationRun[];
};

const integrationLabels: Record<IntegrationName, string> = {
  CRM: "CRM",
  FULFILLMENT: "Fulfillment",
  CALL: "Call System",
};

const healthLabels: Record<IntegrationHealth, string> = {
  HEALTHY: "Healthy",
  DEGRADED: "Degraded",
  UNKNOWN: "Unknown",
};

const healthStyles: Record<IntegrationHealth, string> = {
  HEALTHY: "border-emerald-200 bg-emerald-50 text-emerald-800",
  DEGRADED: "border-amber-200 bg-amber-50 text-amber-800",
  UNKNOWN: "border-slate-200 bg-slate-100 text-slate-600",
};

const runStatusStyles: Record<string, string> = {
  SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  RUNNING: "border-blue-200 bg-blue-50 text-blue-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
};

const runOrder: IntegrationName[] = ["CRM", "FULFILLMENT", "CALL"];

const {
  data: monitoring,
  status,
  error,
} = await useFetch<IntegrationMonitoringResponse>("/api/integrations");

const isLoading = computed(() => status.value === "pending");

const summaries = computed(() => {
  const fetchedSummaries = monitoring.value?.integrations ?? [];

  return runOrder.map((integrationName) => {
    const summary = fetchedSummaries.find(
      (entry) => entry.integrationName === integrationName,
    );

    return (
      summary ?? {
        integrationName,
        health: "UNKNOWN" as IntegrationHealth,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        successRate: 0,
        lastRunAt: null,
        lastStatus: null,
        lastError: null,
      }
    );
  });
});

const recentRuns = computed(() => monitoring.value?.recentRuns ?? []);

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSuccessRate(value: number) {
  return `${value.toFixed(1)}%`;
}

function statusClass(statusValue: string) {
  return runStatusStyles[statusValue] ?? "border-slate-200 bg-slate-100 text-slate-700";
}
</script>

<template>
  <main class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-950">Integrations</h1>
      <p class="mt-1 text-sm text-slate-500">
        Operative Übersicht über den Zustand der externen Systeme und die zuletzt
        ausgeführten Integrationen.
      </p>
    </div>

    <p
      v-if="error"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      Die Integrationsdaten konnten derzeit nicht geladen werden.
    </p>

    <section class="grid gap-4 md:grid-cols-3">
      <article
        v-for="summary in summaries"
        :key="summary.integrationName"
        class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-slate-950">
              {{ integrationLabels[summary.integrationName] }}
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              {{ summary.totalRuns }} runs
            </p>
          </div>

          <span
            class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
            :class="healthStyles[summary.health]"
          >
            {{ healthLabels[summary.health] }}
          </span>
        </div>

        <dl class="mt-4 space-y-2 text-sm">
          <div class="flex items-center justify-between gap-3">
            <dt class="text-slate-500">Successful</dt>
            <dd class="font-medium text-slate-950">{{ summary.successfulRuns }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-slate-500">Failed</dt>
            <dd class="font-medium text-slate-950">{{ summary.failedRuns }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-slate-500">Success rate</dt>
            <dd class="font-medium text-slate-950">
              {{ formatSuccessRate(summary.successRate) }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-slate-500">Last run</dt>
            <dd class="font-medium text-slate-950">
              {{ formatDateTime(summary.lastRunAt) }}
            </dd>
          </div>
        </dl>
      </article>
    </section>

    <SectionCard
      title="Recent Integration Runs"
      description="Latest executions across CRM, Fulfillment, and Call System."
    >
      <div v-if="isLoading" class="py-8 text-sm text-slate-500">
        Integrationsdaten werden geladen …
      </div>

      <div v-else-if="!error && !recentRuns.length" class="py-8 text-sm text-slate-500">
        No integration runs yet.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-wide text-slate-500">
              <th class="py-3 pr-4 font-medium">Integration</th>
              <th class="py-3 pr-4 font-medium">Case</th>
              <th class="py-3 pr-4 font-medium">Status</th>
              <th class="py-3 pr-4 font-medium">Started</th>
              <th class="py-3 pr-4 font-medium">Finished</th>
              <th class="py-3 font-medium">Error</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <tr v-for="run in recentRuns" :key="run.id" class="align-top">
              <td class="py-4 pr-4 font-medium text-slate-950">
                {{ integrationLabels[run.integrationName] }}
              </td>

              <td class="py-4 pr-4">
                <NuxtLink
                  :to="`/cases/${run.caseId}`"
                  class="block max-w-[18rem] text-slate-900 transition hover:text-slate-600"
                >
                  <span v-if="run.caseSubject" class="block truncate font-medium">
                    {{ run.caseSubject }}
                  </span>
                  <span class="block text-xs text-slate-500">Case {{ run.caseId }}</span>
                </NuxtLink>
              </td>

              <td class="py-4 pr-4">
                <span
                  class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                  :class="statusClass(run.status)"
                >
                  {{ run.status }}
                </span>
              </td>

              <td class="py-4 pr-4 text-slate-700">
                {{ formatDateTime(run.startedAt) }}
              </td>

              <td class="py-4 pr-4 text-slate-700">
                {{ formatDateTime(run.finishedAt) }}
              </td>

              <td class="py-4 text-slate-700">
                <span
                  v-if="run.errorMessage"
                  :title="run.errorMessage"
                  class="block max-w-[24rem] truncate"
                >
                  {{ run.errorMessage }}
                </span>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>
  </main>
</template>
