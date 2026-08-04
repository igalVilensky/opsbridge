<script setup lang="ts">
const route = useRoute();

const pageTitle = computed(() => {
  const metaTitle = route.meta.title;

  if (typeof metaTitle === "string") {
    return metaTitle;
  }

  return "OpsBridge";
});
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"
  >
    <div class="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div class="min-w-0">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
          Dashboard
        </p>
        <h1 class="truncate text-xl font-semibold text-slate-950">
          {{ pageTitle }}
        </h1>
      </div>

      <div class="flex shrink-0 items-center gap-3">
        <div class="hidden text-right sm:block">
          <p class="text-sm font-medium text-slate-900">Operations User</p>
          <p class="text-xs text-slate-500">ops@opsbridge.local</p>
        </div>

        <div
          class="flex size-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white"
          aria-label="Current user"
        >
          OU
        </div>
      </div>
    </div>
  </header>
</template>
