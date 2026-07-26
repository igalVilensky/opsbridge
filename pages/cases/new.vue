<script setup lang="ts">
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
  <main>
    <h1>Neuen Fall erstellen</h1>

    <form @submit.prevent="submitCase">
      <label>
        Betreff
        <input v-model="form.subject" type="text" required minlength="3" />
      </label>

      <label>
        Kundennachricht
        <textarea
          v-model="form.originalMessage"
          required
          minlength="10"
        ></textarea>
      </label>

      <label>
        E-Mail
        <input v-model="form.customerEmail" type="email" />
      </label>

      <label>
        Bestellnummer
        <input v-model="form.orderId" type="text" />
      </label>

      <label>
        Telefonnummer
        <input v-model="form.phoneNumber" type="text" />
      </label>

      <label>
        Abteilung
        <select v-model="form.department">
          <option value="CUSTOMER_SERVICE">Kundenservice</option>
          <option value="LOGISTICS">Logistik</option>
          <option value="FINANCE">Finanzen</option>
          <option value="HR">Personal</option>
          <option value="ADMINISTRATION">Verwaltung</option>
        </select>
      </label>

      <label>
        Priorität
        <select v-model="form.priority">
          <option value="LOW">Niedrig</option>
          <option value="MEDIUM">Mittel</option>
          <option value="HIGH">Hoch</option>
          <option value="URGENT">Dringend</option>
        </select>
      </label>

      <p v-if="errorMessage">
        {{ errorMessage }}
      </p>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? "Wird erstellt..." : "Fall erstellen" }}
      </button>
    </form>
  </main>
</template>
