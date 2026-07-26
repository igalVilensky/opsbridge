import { prisma } from "../database/prisma";

export async function createCaseEvent(
  caseId: string,
  eventType: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  return prisma.caseEvent.create({
    data: {
      caseId,
      eventType,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}