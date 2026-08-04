<script setup lang="ts">
definePageMeta({
  title: "Create Case",
});

const form = reactive({
  subject: "",
  originalMessage: "",
  customerEmail: "",
  orderId: "",
  phoneNumber: "",
  department: "CUSTOMER_SERVICE",
  priority: "MEDIUM",
});

const isSubmitting = ref(false);
const errorMessage = ref("");

const inputClasses =
  "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

async function submitCase() {
  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const createdCase = await $fetch<{ id: string }>("/api/cases", {
      method: "POST",
      body: {
        ...form,
        customerEmail: form.customerEmail || undefined,
        orderId: form.orderId || undefined,
        phoneNumber: form.phoneNumber || undefined,
      },
    });

    await navigateTo(`/cases/${createdCase.id}`);
  } catch {
    errorMessage.value = "Der Fall konnte nicht erstellt werden.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl">
    <div class="mb-6">
      <NuxtLink
        to="/cases"
        class="text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Zurück zu den Fällen
      </NuxtLink>
      <h1 class="mt-2 text-2xl font-semibold text-slate-950">Neuen Fall erstellen</h1>
      <p class="mt-1 text-sm text-slate-500">
        Erfassen Sie die Kundenanfrage, um den Fall in die Bearbeitung zu geben.
      </p>
    </div>

    <form
      class="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="submitCase"
    >
      <div>
        <label for="subject" class="block text-sm font-medium text-slate-900">Betreff</label>
        <input
          id="subject"
          v-model="form.subject"
          type="text"
          required
          minlength="3"
          placeholder="Kurze Zusammenfassung der Anfrage"
          :class="inputClasses"
          class="mt-1.5"
        />
      </div>

      <div>
        <label for="originalMessage" class="block text-sm font-medium text-slate-900">
          Kundennachricht
        </label>
        <textarea
          id="originalMessage"
          v-model="form.originalMessage"
          required
          minlength="10"
          rows="5"
          placeholder="Originaltext der Kundenanfrage"
          :class="inputClasses"
          class="mt-1.5"
        ></textarea>
      </div>

      <div class="grid gap-6 sm:grid-cols-2">
        <div>
          <label for="customerEmail" class="block text-sm font-medium text-slate-900">
            E-Mail
          </label>
          <input
            id="customerEmail"
            v-model="form.customerEmail"
            type="email"
            placeholder="kunde@beispiel.de"
            :class="inputClasses"
            class="mt-1.5"
          />
        </div>

        <div>
          <label for="phoneNumber" class="block text-sm font-medium text-slate-900">
            Telefonnummer
          </label>
          <input
            id="phoneNumber"
            v-model="form.phoneNumber"
            type="text"
            placeholder="+49 ..."
            :class="inputClasses"
            class="mt-1.5"
          />
        </div>

        <div>
          <label for="orderId" class="block text-sm font-medium text-slate-900">
            Bestellnummer
          </label>
          <input
            id="orderId"
            v-model="form.orderId"
            type="text"
            placeholder="Optional"
            :class="inputClasses"
            class="mt-1.5"
          />
        </div>

        <div>
          <label for="department" class="block text-sm font-medium text-slate-900">
            Abteilung
          </label>
          <select id="department" v-model="form.department" :class="inputClasses" class="mt-1.5">
            <option value="CUSTOMER_SERVICE">Kundenservice</option>
            <option value="LOGISTICS">Logistik</option>
            <option value="FINANCE">Finanzen</option>
            <option value="HR">Personal</option>
            <option value="ADMINISTRATION">Verwaltung</option>
          </select>
        </div>
      </div>

      <div class="max-w-xs">
        <label for="priority" class="block text-sm font-medium text-slate-900">Priorität</label>
        <select id="priority" v-model="form.priority" :class="inputClasses" class="mt-1.5">
          <option value="LOW">Niedrig</option>
          <option value="MEDIUM">Mittel</option>
          <option value="HIGH">Hoch</option>
          <option value="URGENT">Dringend</option>
        </select>
      </div>

      <p
        v-if="errorMessage"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ errorMessage }}
      </p>

      <div class="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <NuxtLink
          to="/cases"
          class="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          Abbrechen
        </NuxtLink>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isSubmitting ? "Wird erstellt …" : "Fall erstellen" }}
        </button>
      </div>
    </form>
  </main>
</template>