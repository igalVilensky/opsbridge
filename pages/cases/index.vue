<script setup lang="ts">
const { data: cases } = await useFetch("/api/cases");
</script>

<template>
  <main>
    <div>
      <h1>Fälle</h1>

      <NuxtLink to="/cases/new">
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