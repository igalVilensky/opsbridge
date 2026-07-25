import { createCaseSchema } from "../../shared/schemas/case";
import { createCase } from "../repositories/caseRepository";

export async function createCaseService(input: unknown) {
  const validatedInput = createCaseSchema.parse(input);

  return createCase(validatedInput);
}