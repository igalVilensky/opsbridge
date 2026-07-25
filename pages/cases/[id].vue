<script setup lang="ts">
const route = useRoute();

const { data: supportCase } = await useFetch(
  `/api/cases/${route.params.id}`
);
</script>

<template>
  <main v-if="supportCase">
    <h1>{{ supportCase.subject }}</h1>

    <p><strong>Status:</strong> {{ supportCase.status }}</p>
    <p><strong>Priorität:</strong> {{ supportCase.priority }}</p>
    <p><strong>Nachricht:</strong> {{ supportCase.originalMessage }}</p>
  </main>
</template>