<template>
  <div class="min-h-screen bg-slate-100 text-slate-950">
    <LayoutSidebar />

    <div class="min-h-screen lg:pl-72">
      <LayoutHeader />

      <main class="px-4 py-6 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
