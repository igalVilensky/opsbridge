export const statusLabels: Record<string, string> = {
  NEW: "Neu",
  IN_PROGRESS: "In Bearbeitung",
  READY_FOR_REVIEW: "Bereit zur Prüfung",
  APPROVED: "Freigegeben",
  CLOSED: "Abgeschlossen",
};

export const priorityLabels: Record<string, string> = {
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
  URGENT: "Dringend",
};

export const departmentLabels: Record<string, string> = {
  CUSTOMER_SERVICE: "Kundenservice",
  LOGISTICS: "Logistik",
  FINANCE: "Finanzen",
  HR: "Personal",
  ADMINISTRATION: "Verwaltung",
};

export const infrastructureStatusLabels: Record<string, string> = {
  healthy: "Verfügbar",
  degraded: "Beeinträchtigt",
  unknown: "Unbekannt",
};

export const infrastructureTypeLabels: Record<string, string> = {
  application: "Anwendung",
  integration: "Integration",
  database: "Datenbank",
  ai: "KI",
};

export const infrastructureMetadataLabels: Record<string, string> = {
  lastRunAt: "Letzte Ausführung",
  successRate: "Erfolgsquote",
  successfulRuns: "Erfolgreiche Läufe",
  failedRuns: "Fehlgeschlagene Läufe",
  lastError: "Letzter Fehler",
  provider: "Anbieter",
  model: "Modell",
  state: "Zustand",
  database: "Datenbank",
  orm: "ORM",
  cases: "Fälle",
  integrationRuns: "Integrationsläufe",
  framework: "Framework",
  role: "Rolle",
};

export const integrationHealthLabels: Record<string, string> = {
  HEALTHY: "Verfügbar",
  DEGRADED: "Beeinträchtigt",
  UNKNOWN: "Unbekannt",
};

export const integrationRunStatusLabels: Record<string, string> = {
  SUCCESS: "Erfolgreich",
  COMPLETED: "Abgeschlossen",
  FAILED: "Fehlgeschlagen",
  RUNNING: "Läuft",
  PENDING: "Ausstehend",
};

export const caseSnapshotStatusLabels: Record<string, string> = {
  active: "Aktiv",
  shipped: "Versendet",
  delivered: "Zugestellt",
  delayed: "Verzögert",
  completed: "Abgeschlossen",
};

export const caseEventLabels: Record<string, string> = {
  CASE_CREATED: "Fall erstellt",
  CRM_DATA_LOADED: "CRM-Daten geladen",
  ORDER_DATA_LOADED: "Bestelldaten geladen",
  CALL_DATA_LOADED: "Anrufdaten geladen",
  AI_SUMMARY_GENERATED: "KI-Unterstützung generiert",
  DRAFT_APPROVED: "Entwurf freigegeben",
};

export function resolveLabel(map: Record<string, string>, value: string | undefined | null) {
  if (!value) return "—";
  return map[value] ?? value;
}
