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
      callSnapshot: true,
      events: {
        orderBy: {
          createdAt: "asc",
        },
      },
      enrichmentRuns: {
        orderBy: {
          startedAt: "asc",
        },
        include: {
          integrationRuns: {
            orderBy: {
              startedAt: "asc",
            },
          },
        },
      },
      integrationRuns: {
        orderBy: {
          startedAt: "asc",
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

export async function saveAiAssistance(
  id: string,
  assistance: {
    summary: string;
    suggestedAction: string;
    draftResponse: string;
  },
) {
  return prisma.case.update({
    where: { id },
    data: {
      aiSummary: assistance.summary,
      suggestedAction: assistance.suggestedAction,
      draftResponse: assistance.draftResponse,
    },
  });
}

export async function approveCase(
  id: string,
  approvedResponse: string,
) {
  return prisma.case.update({
    where: { id },
    data: {
      approvedResponse,
      status: "APPROVED",
      rejectionReason: null,
    },
  });
}
