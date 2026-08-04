<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
  }>(),
  {
    description: undefined,
  },
);
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <div>
        <h2 class="text-sm font-semibold text-slate-950">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-xs text-slate-500">{{ description }}</p>
      </div>

      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </header>

    <div class="px-5 py-4">
      <slot />
    </div>
  </section>
</template>