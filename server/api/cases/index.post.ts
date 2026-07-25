import { createCaseService } from "../../services/caseService";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const newCase = await createCaseService(body);

  setResponseStatus(event, 201);

  return newCase;
});