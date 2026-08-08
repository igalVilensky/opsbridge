<script setup lang="ts">
type NavigationItem = {
  label: string;
  to: string;
};

const route = useRoute();

const navigationItems: NavigationItem[] = [
  { label: "Fälle", to: "/cases" },
  { label: "Infrastruktur", to: "/infrastructure" },
  { label: "Integrationen", to: "/integrations" },
];

function isActivePath(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<template>
  <aside
    class="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:border-b-0 lg:border-r"
  >
    <div class="flex h-full flex-col">
      <NuxtLink
        to="/cases"
        class="flex h-16 items-center gap-3 border-b border-slate-200 px-4 sm:px-6"
      >
        <img
          src="/logo-agorando.svg"
          alt="Agorando"
          class="h-6 w-auto shrink-0 sm:h-7"
        />

        <div class="min-w-0 hidden sm:block">
          <p class="truncate text-base font-semibold text-slate-950">OpsBridge</p>
          <p class="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
            Betriebskonsole
          </p>
        </div>
      </NuxtLink>

      <nav
        aria-label="Primäre Navigation"
        class="flex gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:py-6"
      >
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          :aria-current="isActivePath(item.to) ? 'page' : undefined"
          class="whitespace-nowrap rounded px-3 py-2 text-sm font-medium transition hover:bg-slate-100 hover:text-slate-950 lg:w-full"
          :class="
            isActivePath(item.to)
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600'
          "
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="hidden border-t border-slate-200 p-6 lg:block">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
          Umgebung
        </p>
        <div class="mt-3 flex items-center gap-2">
          <span class="size-2 rounded-full bg-emerald-500"></span>
          <span class="text-sm font-medium text-slate-700">Produktion</span>
        </div>
      </div>
    </div>
  </aside>
</template>
