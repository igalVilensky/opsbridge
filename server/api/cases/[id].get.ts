import { prisma } from "../../database/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  const foundCase = await prisma.case.findUnique({
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
          startedAt: "desc",
        },
        include: {
          integrationRuns: true,
        },
      },
    },
  });

  if (!foundCase) {
    throw createError({
      statusCode: 404,
      statusMessage: "Case not found",
    });
  }

  return foundCase;
});