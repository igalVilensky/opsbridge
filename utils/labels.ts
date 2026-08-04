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

export function resolveLabel(map: Record<string, string>, value: string | undefined | null) {
  if (!value) return "—";
  return map[value] ?? value;
}