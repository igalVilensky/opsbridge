<script setup lang="ts">
import { departmentLabels } from "~/utils/labels";
import PriorityBadge from "~/components/ui/PriorityBadge.vue";
import StatusBadge from "~/components/ui/StatusBadge.vue";

definePageMeta({
  title: "Cases",
});

const { data: cases, status } = await useFetch("/api/cases");

const isLoading = computed(() => status.value === "pending");
</script>

<template>
  <main>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-950">Fälle</h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ cases?.length ? `${cases.length} Fälle insgesamt` : "Übersicht aller Support-Fälle" }}
        </p>
      </div>

      <NuxtLink
        to="/cases/new"
        class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      >
        Neuen Fall erstellen
      </NuxtLink>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div v-if="isLoading" class="px-5 py-10 text-center text-sm text-slate-500">
        Fälle werden geladen …
      </div>

      <ul v-else-if="cases?.length" class="divide-y divide-slate-200">
        <li v-for="supportCase in cases" :key="supportCase.id">
          <NuxtLink
            :to="`/cases/${supportCase.id}`"
            class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-950">
                {{ supportCase.subject }}
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                {{ departmentLabels[supportCase.department] ?? supportCase.department }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <PriorityBadge :priority="supportCase.priority" />
              <StatusBadge :status="supportCase.status" />
            </div>
          </NuxtLink>
        </li>
      </ul>

      <div v-else class="px-5 py-10 text-center">
        <p class="text-sm font-medium text-slate-900">Keine Fälle vorhanden</p>
        <p class="mt-1 text-sm text-slate-500">
          Erstellen Sie einen neuen Fall, um loszulegen.
        </p>
      </div>
    </div>
  </main>
</template>
