<script setup lang="ts">
import InfrastructureScene from "~/components/infrastructure/InfrastructureScene.vue";
import SectionCard from "~/components/ui/SectionCard.vue";
import type {
  InfrastructureNode,
  InfrastructureResponse,
} from "~/shared/infrastructure";

definePageMeta({
  title: "Infrastructure",
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

function handleNodeSelection(node: InfrastructureNode) {
  selectedNodeId.value = node.id;
}

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
</script>

<template>
  <main class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-950">Infrastructure</h1>
      <p class="mt-1 text-sm text-slate-500">
        3D overview of the core OpsBridge systems and their connections.
      </p>
    </div>

    <p
      v-if="error"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      The infrastructure snapshot could not be loaded right now.
    </p>

    <SectionCard
      v-else
      title="System Architecture"
      description="Rotate, zoom, and click a node to inspect it."
    >
      <div v-if="isLoading" class="py-12 text-sm text-slate-500">
        Infrastructure data is loading …
      </div>

      <div
        v-else-if="!nodes.length"
        class="py-12 text-sm text-slate-500"
      >
        No infrastructure nodes are available yet.
      </div>

      <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_20rem]">
        <InfrastructureScene
          :nodes="nodes"
          :connections="connections"
          @select-node="handleNodeSelection"
        />

        <aside class="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div v-if="selectedNode">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Selected node
            </p>

            <h2 class="mt-2 text-lg font-semibold text-slate-950">
              {{ selectedNode.name }}
            </h2>

            <dl class="mt-4 space-y-3 text-sm">
              <div>
                <dt class="text-slate-500">Type</dt>
                <dd class="mt-0.5 font-medium text-slate-950">
                  {{ formatLabel(selectedNode.type) }}
                </dd>
              </div>

              <div>
                <dt class="text-slate-500">Status</dt>
                <dd class="mt-0.5 font-medium text-slate-950">
                  {{ formatLabel(selectedNode.status) }}
                </dd>
              </div>

              <div>
                <dt class="text-slate-500">Description</dt>
                <dd class="mt-0.5 text-slate-700">
                  {{ selectedNode.description }}
                </dd>
              </div>
            </dl>

            <div class="mt-5">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Connected systems
              </p>

              <ul v-if="connectedSystems.length" class="mt-2 space-y-2 text-sm">
                <li
                  v-for="system in connectedSystems"
                  :key="system.id"
                  class="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700"
                >
                  {{ system.name }}
                </li>
              </ul>

              <p v-else class="mt-2 text-sm text-slate-500">
                No direct connections found.
              </p>
            </div>
          </div>

          <div v-else class="text-sm text-slate-500">
            Select a node in the visualization to view its details.
          </div>
        </aside>
      </div>
    </SectionCard>
  </main>
</template>
