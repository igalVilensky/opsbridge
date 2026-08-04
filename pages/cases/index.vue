<script setup lang="ts">
const { data: cases } = await useFetch("/api/cases");
</script>

<template>
  <main class="mx-auto max-w-3xl p-6">
    <div class="mb-6 flex items-center justify-between gap-4">
      <h1 class="text-3xl font-bold text-slate-900">Fälle</h1>

      <NuxtLink
        to="/cases/new"
        class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Neuen Fall erstellen
      </NuxtLink>
    </div>

    <ul v-if="cases?.length">
      <li v-for="supportCase in cases" :key="supportCase.id">
        <NuxtLink :to="`/cases/${supportCase.id}`">
          <strong>{{ supportCase.subject }}</strong>
          — {{ supportCase.status }}
          — {{ supportCase.priority }}
        </NuxtLink>
      </li>
    </ul>

    <p v-else>Keine Fälle vorhanden.</p>
  </main>
</template>
