<script setup lang="ts">
const route = useRoute();

const { data: supportCase } = await useFetch(
  `/api/cases/${route.params.id}`,
);
</script>

<template>
  <main v-if="supportCase">
    <NuxtLink to="/cases">
      ← Zurück zu den Fällen
    </NuxtLink>

    <h1>{{ supportCase.subject }}</h1>

    <section>
      <h2>Falldaten</h2>

      <p><strong>Status:</strong> {{ supportCase.status }}</p>
      <p><strong>Priorität:</strong> {{ supportCase.priority }}</p>
      <p><strong>Abteilung:</strong> {{ supportCase.department }}</p>
      <p><strong>Nachricht:</strong> {{ supportCase.originalMessage }}</p>
    </section>

    <section v-if="supportCase.customerSnapshot">
      <h2>Kundendaten</h2>

      <p><strong>Name:</strong> {{ supportCase.customerSnapshot.name }}</p>
      <p><strong>E-Mail:</strong> {{ supportCase.customerSnapshot.email }}</p>
      <p>
        <strong>Telefon:</strong>
        {{ supportCase.customerSnapshot.phone || "Nicht vorhanden" }}
      </p>
      <p>
        <strong>Unternehmen:</strong>
        {{ supportCase.customerSnapshot.company || "Nicht vorhanden" }}
      </p>
      <p>
        <strong>Kundenstatus:</strong>
        {{ supportCase.customerSnapshot.status }}
      </p>
    </section>

    <section v-else>
      <h2>Kundendaten</h2>
      <p>Noch keine CRM-Daten geladen.</p>
    </section>

    <section v-if="supportCase.orderSnapshot">
      <h2>Bestelldaten</h2>

      <p>
        <strong>Bestellnummer:</strong>
        {{ supportCase.orderSnapshot.externalOrderId }}
      </p>
      <p>
        <strong>Bestellstatus:</strong>
        {{ supportCase.orderSnapshot.orderStatus }}
      </p>
      <p>
        <strong>Versandstatus:</strong>
        {{ supportCase.orderSnapshot.shippingStatus }}
      </p>
      <p>
        <strong>Versanddienstleister:</strong>
        {{ supportCase.orderSnapshot.shippingProvider || "Nicht vorhanden" }}
      </p>
      <p>
        <strong>Sendungsnummer:</strong>
        {{ supportCase.orderSnapshot.trackingNumber || "Nicht vorhanden" }}
      </p>
    </section>

    <section v-else>
      <h2>Bestelldaten</h2>
      <p>Noch keine Bestelldaten geladen.</p>
    </section>

    <section v-if="supportCase.callSnapshot">
      <h2>Letzter Anruf</h2>

      <p>
        <strong>Anruf-ID:</strong>
        {{ supportCase.callSnapshot.externalCallId }}
      </p>
      <p>
        <strong>Zeitpunkt:</strong>
        {{ new Date(supportCase.callSnapshot.calledAt).toLocaleString("de-DE") }}
      </p>
      <p>
        <strong>Dauer:</strong>
        {{ supportCase.callSnapshot.durationSeconds }} Sekunden
      </p>
      <p>
        <strong>Status:</strong>
        {{ supportCase.callSnapshot.callStatus }}
      </p>
      <p>
        <strong>Notiz:</strong>
        {{ supportCase.callSnapshot.note || "Keine Notiz vorhanden" }}
      </p>
    </section>

    <section v-else>
      <h2>Letzter Anruf</h2>
      <p>Noch keine Anrufdaten geladen.</p>
    </section>

    <section>
      <h2>Verlauf</h2>

      <ul>
        <li
          v-for="caseEvent in supportCase.events"
          :key="caseEvent.id"
        >
          <strong>{{ caseEvent.eventType }}</strong>
          — {{ caseEvent.message }}
        </li>
      </ul>
    </section>
  </main>
</template>