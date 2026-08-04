<script setup lang="ts">
import { priorityLabels } from "~/utils/labels";

const props = defineProps<{
  priority: string;
}>();

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600 ring-slate-600/10",
  MEDIUM: "bg-blue-50 text-blue-700 ring-blue-600/10",
  HIGH: "bg-amber-50 text-amber-800 ring-amber-600/10",
  URGENT: "bg-red-50 text-red-700 ring-red-600/10",
};

const classes = computed(
  () => priorityStyles[props.priority] ?? "bg-slate-100 text-slate-600 ring-slate-600/10",
);

const label = computed(() => priorityLabels[props.priority] ?? props.priority);
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset"
    :class="classes"
  >
    {{ label }}
  </span>
</template>