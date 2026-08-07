import { getInfrastructureSnapshot } from "../services/infrastructureService";

export default defineEventHandler(async () => {
  return getInfrastructureSnapshot();
});
