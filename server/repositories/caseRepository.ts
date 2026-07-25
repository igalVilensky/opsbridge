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