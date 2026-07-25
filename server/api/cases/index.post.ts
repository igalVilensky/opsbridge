import { ZodError } from "zod";
import { createCaseService } from "../../services/caseService";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const newCase = await createCaseService(body);

    setResponseStatus(event, 201);

    return newCase;
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid case data",
        data: {
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    throw error;
  }
});