import { prisma } from "../database/prisma";

export async function startEnrichmentRun(caseId: string) {
  return prisma.enrichmentRun.create({
    data: {
      caseId,
    },
  });
}
