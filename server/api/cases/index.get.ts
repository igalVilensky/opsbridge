import { prisma } from "../../database/prisma";

export default defineEventHandler(async () => {
  return prisma.case.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      events: true,
    },
  });
});