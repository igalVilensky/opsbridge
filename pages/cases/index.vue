<script setup lang="ts">
const { data: cases } = await useFetch("/api/cases");
</script>

<template>
  <main>
    <h1>Fälle</h1>

    <ul>
      <li v-for="supportCase in cases" :key="supportCase.id">
        <strong>{{ supportCase.subject }}</strong>
        — {{ supportCase.status }}
      </li>
    </ul>
  </main>
</template>