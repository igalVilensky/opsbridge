<script setup lang="ts">
import { statusLabels } from "~/utils/labels";

const props = defineProps<{
  status: string;
}>();

const statusStyles: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700 ring-slate-600/10",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-600/10",
  READY_FOR_REVIEW: "bg-amber-50 text-amber-800 ring-amber-600/10",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  CLOSED: "bg-slate-100 text-slate-500 ring-slate-600/10",
};

const classes = computed(
  () => statusStyles[props.status] ?? "bg-slate-100 text-slate-700 ring-slate-600/10",
);

const label = computed(() => statusLabels[props.status] ?? props.status);
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset"
    :class="classes"
  >
    <span class="size-1.5 rounded-full bg-current"></span>
    {{ label }}
  </span>
</template>