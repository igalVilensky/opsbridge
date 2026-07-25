import { prisma } from "../database/prisma";

export default defineEventHandler(async () => {
  const caseCount = await prisma.case.count();

  return {
    status: "ok",
    database: "connected",
    caseCount,
  };
});