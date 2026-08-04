<script setup lang="ts">
import { departmentLabels } from "~/utils/labels";

definePageMeta({
  title: "Case Detail",
});

const route = useRoute();

const {
  data: supportCase,
  refresh,
} = await useFetch(`/api/cases/${route.params.id}`);

const editableDraft = ref(supportCase.value?.draftResponse ?? "");
const isApproving = ref(false);
const actionError = ref("");

const latestEnrichmentRun = computed(() => {
  const enrichmentRuns = (supportCase.value as any)?.enrichmentRuns ?? [];

  return [...enrichmentRuns].sort(
    (firstRun, secondRun) =>
      new Date(secondRun.startedAt).getTime() -
      new Date(firstRun.startedAt).getTime(),
  )[0];
});

const integrationLabels: Record<string, string> = {
  CRM: "CRM",
  FULFILLMENT: "Fulfillment",
  CALL: "Call System",
};

const integrationStatusStyles: Record<string, string> = {
  SUCCESS: "bg-emerald-500",
  COMPLETED: "bg-emerald-500",
  FAILED: "bg-red-500",
  RUNNING: "bg-blue-500",
  PENDING: "bg-amber-500",
};

function integrationDotClass(status: string) {
  return integrationStatusStyles[status] ?? "bg-slate-400";
}

watch(
  () => supportCase.value?.draftResponse,
  (draftResponse) => {
    editableDraft.value = draftResponse ?? "";
  },
);

async function approveDraft() {
  isApproving.value = true;
  actionError.value = "";

  try {
    await $fetch(`/api/cases/${route.params.id}/approve`, {
      method: "POST",
      body: {
        approvedResponse: editableDraft.value,
      },
    });

    await refresh();
  } catch {
    actionError.value = "Der Entwurf konnte nicht freigegeben werden.";
  } finally {
    isApproving.value = false;
  }
}
</script>

<template>
  <main v-if="supportCase" class="space-y-6">
    <div>
      <NuxtLink
        to="/cases"
        class="text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Zurück zu den Fällen
      </NuxtLink>

      <div class="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold text-slate-950">{{ supportCase.subject }}</h1>
          <p class="mt-1 text-sm text-slate-500">
            {{ departmentLabels[supportCase.department] ?? supportCase.department }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <PriorityBadge :priority="supportCase.priority" />
          <StatusBadge :status="supportCase.status" />
        </div>
      </div>
    </div>

    <SectionCard title="Kundennachricht">
      <p class="whitespace-pre-line text-sm leading-relaxed text-slate-700">
        {{ supportCase.originalMessage }}
      </p>
    </SectionCard>

    <div class="grid gap-6 lg:grid-cols-3">
      <SectionCard title="Kundendaten">
        <dl v-if="supportCase.customerSnapshot" class="space-y-3 text-sm">
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Name</dt>
            <dd class="mt-0.5 text-slate-900">{{ supportCase.customerSnapshot.name }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">E-Mail</dt>
            <dd class="mt-0.5 text-slate-900">{{ supportCase.customerSnapshot.email }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Telefon</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ supportCase.customerSnapshot.phone || "Nicht vorhanden" }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Unternehmen</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ supportCase.customerSnapshot.company || "Nicht vorhanden" }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Kundenstatus
            </dt>
            <dd class="mt-0.5 text-slate-900">{{ supportCase.customerSnapshot.status }}</dd>
          </div>
        </dl>
        <p v-else class="text-sm text-slate-500">Noch keine CRM-Daten geladen.</p>
      </SectionCard>

      <SectionCard title="Bestelldaten">
        <dl v-if="supportCase.orderSnapshot" class="space-y-3 text-sm">
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Bestellnummer
            </dt>
            <dd class="mt-0.5 text-slate-900">
              {{ supportCase.orderSnapshot.externalOrderId }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Bestellstatus
            </dt>
            <dd class="mt-0.5 text-slate-900">{{ supportCase.orderSnapshot.orderStatus }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Versandstatus
            </dt>
            <dd class="mt-0.5 text-slate-900">{{ supportCase.orderSnapshot.shippingStatus }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Versanddienstleister
            </dt>
            <dd class="mt-0.5 text-slate-900">
              {{ supportCase.orderSnapshot.shippingProvider || "Nicht vorhanden" }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Sendungsnummer
            </dt>
            <dd class="mt-0.5 text-slate-900">
              {{ supportCase.orderSnapshot.trackingNumber || "Nicht vorhanden" }}
            </dd>
          </div>
        </dl>
        <p v-else class="text-sm text-slate-500">Noch keine Bestelldaten geladen.</p>
      </SectionCard>

      <SectionCard title="Letzter Anruf">
        <dl v-if="supportCase.callSnapshot" class="space-y-3 text-sm">
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Anruf-ID</dt>
            <dd class="mt-0.5 text-slate-900">{{ supportCase.callSnapshot.externalCallId }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Zeitpunkt</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ new Date(supportCase.callSnapshot.calledAt).toLocaleString("de-DE") }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Dauer</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ supportCase.callSnapshot.durationSeconds }} Sekunden
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Status</dt>
            <dd class="mt-0.5 text-slate-900">{{ supportCase.callSnapshot.callStatus }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Notiz</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ supportCase.callSnapshot.note || "Keine Notiz vorhanden" }}
            </dd>
          </div>
        </dl>
        <p v-else class="text-sm text-slate-500">Noch keine Anrufdaten geladen.</p>
      </SectionCard>
    </div>

    <SectionCard title="Integration Status">
      <ul v-if="latestEnrichmentRun" class="grid gap-3 sm:grid-cols-3">
        <li
          v-for="integrationRun in latestEnrichmentRun.integrationRuns"
          :key="integrationRun.id"
          class="rounded-md border border-slate-200 px-3 py-2.5"
        >
          <div class="flex items-center gap-2">
            <span class="size-2 rounded-full" :class="integrationDotClass(integrationRun.status)"></span>
            <span class="text-sm font-medium text-slate-900">
              {{ integrationLabels[integrationRun.integrationName] || integrationRun.integrationName }}
            </span>
          </div>
          <p class="mt-1 text-xs text-slate-500">{{ integrationRun.status }}</p>
          <p
            v-if="integrationRun.status === 'FAILED' && integrationRun.errorMessage"
            class="mt-1 text-xs text-red-600"
          >
            {{ integrationRun.errorMessage }}
          </p>
        </li>
      </ul>
      <p v-else class="text-sm text-slate-500">Noch keine Integrationsläufe vorhanden.</p>
    </SectionCard>

    <SectionCard v-if="supportCase.aiSummary" title="KI-Unterstützung">
      <div class="space-y-5">
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Zusammenfassung</p>
          <p class="mt-1 text-sm leading-relaxed text-slate-700">{{ supportCase.aiSummary }}</p>
        </div>

        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
            Empfohlene Aktion
          </p>
          <p class="mt-1 text-sm leading-relaxed text-slate-700">{{ supportCase.suggestedAction }}</p>
        </div>

        <div>
          <label for="draftResponse" class="text-xs font-medium uppercase tracking-wide text-slate-500">
            Antwortentwurf
          </label>
          <textarea
            id="draftResponse"
            v-model="editableDraft"
            rows="12"
            :disabled="supportCase.status === 'APPROVED'"
            class="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          ></textarea>
        </div>

        <p
          v-if="actionError"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ actionError }}
        </p>

        <div v-if="supportCase.status === 'READY_FOR_REVIEW'" class="flex justify-end">
          <button
            type="button"
            :disabled="isApproving || !editableDraft.trim()"
            class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            @click="approveDraft"
          >
            {{ isApproving ? "Wird freigegeben …" : "Entwurf freigeben" }}
          </button>
        </div>

        <div v-if="supportCase.status === 'APPROVED'" class="border-t border-slate-200 pt-5">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
            Freigegebene Antwort
          </p>
          <pre class="mt-1.5 whitespace-pre-wrap rounded-md bg-slate-50 px-3 py-2.5 text-sm text-slate-700">{{ supportCase.approvedResponse }}</pre>
        </div>
      </div>
    </SectionCard>

    <SectionCard v-else title="KI-Unterstützung">
      <p class="text-sm text-slate-500">Noch keine KI-Unterstützung generiert.</p>
    </SectionCard>

    <SectionCard title="Verlauf">
      <ol v-if="supportCase.events?.length" class="space-y-4">
        <li
          v-for="caseEvent in supportCase.events"
          :key="caseEvent.id"
          class="relative border-l border-slate-200 pl-4"
        >
          <span class="absolute -left-[3.5px] top-1.5 size-1.5 rounded-full bg-slate-400"></span>
          <p class="text-sm font-medium text-slate-900">{{ caseEvent.eventType }}</p>
          <p class="mt-0.5 text-sm text-slate-600">{{ caseEvent.message }}</p>
        </li>
      </ol>
      <p v-else class="text-sm text-slate-500">Noch keine Ereignisse vorhanden.</p>
    </SectionCard>
  </main>
</template>