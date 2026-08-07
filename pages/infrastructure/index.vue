<script setup lang="ts">
import InfrastructureScene from "~/components/infrastructure/InfrastructureScene.vue";
import {
  infrastructureMetadataLabels,
  infrastructureStatusLabels,
  infrastructureTypeLabels,
  resolveLabel,
} from "~/utils/labels";
import type {
  InfrastructureNode,
  InfrastructureResponse,
  InfrastructureMetadataValue,
} from "~/shared/infrastructure";

definePageMeta({
  title: "Infrastruktur",
});

const {
  data: infrastructure,
  status,
  error,
} = await useFetch<InfrastructureResponse>("/api/infrastructure");

const nodes = computed(() => infrastructure.value?.nodes ?? []);
const connections = computed(() => infrastructure.value?.connections ?? []);

const selectedNodeId = ref<string | null>(null);

watch(
  nodes,
  (currentNodes) => {
    if (!currentNodes.length) {
      selectedNodeId.value = null;
      return;
    }

    const selectedExists = currentNodes.some((node) => node.id === selectedNodeId.value);

    if (!selectedExists) {
      selectedNodeId.value = currentNodes[0].id;
    }
  },
  { immediate: true },
);

const isLoading = computed(() => status.value === "pending");

const selectedNode = computed<InfrastructureNode | null>(() => {
  if (!selectedNodeId.value) {
    return null;
  }

  return nodes.value.find((node) => node.id === selectedNodeId.value) ?? null;
});

const connectedSystems = computed(() => {
  const activeNode = selectedNode.value;

  if (!activeNode) {
    return [];
  }

  const connectedIds = new Set<string>();

  for (const connection of connections.value) {
    if (connection.from === activeNode.id) {
      connectedIds.add(connection.to);
    }

    if (connection.to === activeNode.id) {
      connectedIds.add(connection.from);
    }
  }

  return [...connectedIds]
    .map((nodeId) => nodes.value.find((node) => node.id === nodeId))
    .filter((node): node is InfrastructureNode => Boolean(node));
});

const degradedCount = computed(
  () => nodes.value.filter((node) => node.status === "degraded").length,
);

const selectedNodeMetadata = computed(() => {
  const metadata = selectedNode.value?.metadata;

  if (!metadata) return [];

  return Object.entries(metadata).filter(([, value]) => value !== undefined);
});

function handleNodeSelection(node: InfrastructureNode) {
  selectedNodeId.value = node.id;
}

function formatTypeLabel(value: string) {
  return resolveLabel(infrastructureTypeLabels, value);
}

function formatMetadataLabel(key: string) {
  const knownLabel = infrastructureMetadataLabels[key];

  if (knownLabel) {
    return knownLabel;
  }

  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatusLabel(value: InfrastructureNode["status"]) {
  return resolveLabel(infrastructureStatusLabels, value);
}

function formatMetadataValue(key: string, value: InfrastructureMetadataValue) {
  if (value === null) {
    return "—";
  }

  if (typeof value === "number") {
    if (key.toLowerCase().includes("rate")) {
      return `${new Intl.NumberFormat("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value)}%`;
    }

    return new Intl.NumberFormat("de-DE").format(value);
  }

  if (typeof value === "string") {
    const looksLikeDate =
      /(?:at|date|time)$/i.test(key) || /^(\d{4}-\d{2}-\d{2}T|\d{4}-\d{2}-\d{2} )/.test(value);

    if (looksLikeDate) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return new Intl.DateTimeFormat("de-DE", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(parsed);
      }
    }

    return value || "—";
  }

  return "—";
}

const statusDotClass: Record<InfrastructureNode["status"], string> = {
  healthy: "bg-emerald-400",
  degraded: "bg-amber-400",
  unknown: "bg-slate-400",
};
</script>

<template>
  <main class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <p class="max-w-3xl text-sm text-slate-500">
        3D-Übersicht der zentralen OpsBridge-Systeme und ihrer Verbindungen.
      </p>

      <div v-if="!isLoading && nodes.length" class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {{ nodes.length }} Systeme
        </span>
        <span
          v-if="degradedCount"
          class="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {{ degradedCount }} beeinträchtigt
        </span>
      </div>
    </div>

    <p
      v-if="error"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      Die Infrastrukturdaten konnten derzeit nicht geladen werden.
    </p>

    <section v-else class="space-y-3">
      <div v-if="isLoading" class="rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm">
        Infrastrukturdaten werden geladen …
      </div>

      <div
        v-else-if="!nodes.length"
        class="rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm"
      >
        Noch keine Infrastruktursysteme verfügbar.
      </div>

      <div v-else class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_20rem]">
        <div class="space-y-3">
          <InfrastructureScene
            :nodes="nodes"
            :connections="connections"
            :selected-node-id="selectedNodeId"
            @select-node="handleNodeSelection"
          />

          <div class="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
            <span class="inline-flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Grün - verfügbar
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Orange - beeinträchtigt
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Grau - unbekannt
            </span>
            <span>Bewegte Punkte - Kommunikations- und Datenfluss</span>
          </div>
        </div>

        <aside class="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div v-if="selectedNode">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Ausgewähltes System
            </p>

            <h2 class="mt-2 text-lg font-semibold text-slate-950">
              {{ selectedNode.name }}
            </h2>

            <dl class="mt-4 space-y-3 text-sm">
              <div>
                <dt class="text-slate-500">Typ</dt>
                <dd class="mt-0.5 font-medium text-slate-950">
                  {{ formatTypeLabel(selectedNode.type) }}
                </dd>
              </div>

              <div>
                <dt class="text-slate-500">Status</dt>
                <dd class="mt-0.5 inline-flex items-center gap-1.5 font-medium text-slate-950">
                  <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass[selectedNode.status]" />
                  {{ formatStatusLabel(selectedNode.status) }}
                </dd>
              </div>

              <div>
                <dt class="text-slate-500">Beschreibung</dt>
                <dd class="mt-0.5 text-slate-700">
                  {{ selectedNode.description }}
                </dd>
              </div>
            </dl>

            <div v-if="selectedNodeMetadata.length" class="mt-5">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Betriebsdaten
              </p>

              <dl class="mt-2 space-y-3 text-sm">
                <div
                  v-for="[key, value] in selectedNodeMetadata"
                  :key="key"
                  class="rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {{ formatMetadataLabel(key) }}
                  </dt>
                  <dd class="mt-1 font-medium text-slate-950">
                    {{ formatMetadataValue(key, value) }}
                  </dd>
                </div>
              </dl>
            </div>

            <div class="mt-5">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Verbundene Systeme
              </p>

              <ul v-if="connectedSystems.length" class="mt-2 space-y-2 text-sm">
                <li v-for="system in connectedSystems" :key="system.id">
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    @click="handleNodeSelection(system)"
                  >
                    <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="statusDotClass[system.status]" />
                    {{ system.name }}
                  </button>
                </li>
              </ul>

              <p v-else class="mt-2 text-sm text-slate-500">
                Keine direkten Verbindungen gefunden.
              </p>
            </div>
          </div>

          <div v-else class="text-sm text-slate-500">
            Wählen Sie ein System in der Visualisierung aus, um Details anzuzeigen.
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
