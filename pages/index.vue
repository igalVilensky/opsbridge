<script setup lang="ts">
definePageMeta({
  layout: false,
});

const form = reactive({
  email: "demo@opsbridge.de",
  password: "demo123",
});

const errors = reactive({
  email: "",
  password: "",
});

const isSubmitting = ref(false);

function resetErrors() {
  errors.email = "";
  errors.password = "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function useDemoAccess() {
  form.email = "demo@opsbridge.de";
  form.password = "demo123";
  resetErrors();
}

async function handleSubmit() {
  resetErrors();

  if (!form.email.trim()) {
    errors.email = "Bitte E-Mail eingeben.";
  } else if (!isValidEmail(form.email)) {
    errors.email = "Bitte eine gültige E-Mail-Adresse eingeben.";
  }

  if (!form.password) {
    errors.password = "Bitte Passwort eingeben.";
  }

  if (errors.email || errors.password) {
    return;
  }

  isSubmitting.value = true;
  try {
    await nextTick();
    await navigateTo("/cases");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.22),_rgba(241,245,249,0.92)_38%,_rgba(226,232,240,0.98)_100%)] text-slate-950">
    <div class="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div class="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section class="flex flex-col justify-center">
          <img
            src="/logo-agorando.svg"
            alt="Agorando"
            class="h-8 w-auto sm:h-9"
          />

          <div class="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
            Operations / Support platform
          </div>

          <h1 class="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            OpsBridge
          </h1>

          <p class="mt-3 max-w-xl text-lg leading-7 text-slate-600">
            Zentrale Plattform für Kundenfälle, Integrationen und KI-gestützte Prozesse.
          </p>

          <div class="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Fälle</p>
              <p class="mt-1 text-sm text-slate-700">Strukturierte Bearbeitung und Übergabe</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Integrationen</p>
              <p class="mt-1 text-sm text-slate-700">Überblick über verbundene Systeme</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">KI</p>
              <p class="mt-1 text-sm text-slate-700">Unterstützung für operative Routinen</p>
            </div>
          </div>
        </section>

        <section class="self-center rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Demo-Zugang
              </p>
              <h2 class="mt-2 text-2xl font-semibold text-slate-950">
                Anmelden
              </h2>
            </div>

            <button
              type="button"
              class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              @click="useDemoAccess"
            >
              Demo-Zugang verwenden
            </button>
          </div>

          <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <dl class="grid gap-3 text-sm text-slate-700">
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium text-slate-500">E-Mail</dt>
                <dd class="text-right font-medium text-slate-950">demo@opsbridge.de</dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium text-slate-500">Passwort</dt>
                <dd class="text-right font-medium text-slate-950">demo123</dd>
              </div>
            </dl>
          </div>

          <form class="mt-6 space-y-4" @submit.prevent="handleSubmit" novalidate>
            <div>
              <label for="email" class="mb-1.5 block text-sm font-medium text-slate-700">
                E-Mail
              </label>
              <input
                id="email"
                v-model.trim="form.email"
                type="email"
                autocomplete="email"
                autofocus
                class="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                :aria-invalid="Boolean(errors.email)"
                :aria-describedby="errors.email ? 'email-error' : undefined"
                placeholder="demo@opsbridge.de"
              />
              <p v-if="errors.email" id="email-error" class="mt-1.5 text-sm text-red-600">
                {{ errors.email }}
              </p>
            </div>

            <div>
              <label for="password" class="mb-1.5 block text-sm font-medium text-slate-700">
                Passwort
              </label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                class="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                :aria-invalid="Boolean(errors.password)"
                :aria-describedby="errors.password ? 'password-error' : undefined"
                placeholder="demo123"
              />
              <p v-if="errors.password" id="password-error" class="mt-1.5 text-sm text-red-600">
                {{ errors.password }}
              </p>
            </div>

            <p class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Demo-Umgebung · Keine produktiven Daten
            </p>

            <button
              type="submit"
              class="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-500"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? "Anmeldung läuft …" : "Anmelden" }}
            </button>
          </form>
        </section>
      </div>
    </div>
  </main>
</template>
