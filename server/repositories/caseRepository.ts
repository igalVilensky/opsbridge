import { prisma } from "../database/prisma";
import type { CreateCaseInput } from "../../shared/schemas/case";

export async function createCase(input: CreateCaseInput) {
  return prisma.case.create({
    data: {
      ...input,
      events: {
        create: {
          eventType: "CASE_CREATED",
          message: "Case created",
        },
      },
    },
    include: {
      events: true,
    },
  });
}

export async function findCaseById(id: string) {
  return prisma.case.findUnique({
    where: { id },
    include: {
      customerSnapshot: true,
      orderSnapshot: true,
      events: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

export async function updateCaseStatus(
  id: string,
  status: string,
  lastError: string | null = null,
) {
  return prisma.case.update({
    where: { id },
    data: {
      status,
      lastError,
    },
  });
}
