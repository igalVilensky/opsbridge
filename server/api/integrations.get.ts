import { getIntegrationMonitoringOverview } from "../services/integrationMonitoringService";

export default defineEventHandler(async () => {
  return getIntegrationMonitoringOverview();
});
