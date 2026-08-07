import { generateGroqAssistance } from "../ai/providers/groqProvider";
import { generateMockAssistance } from "../ai/providers/mockProvider";
import type { AiAssistanceResult, AiCaseContext } from "../ai/types";

export async function generateAiAssistance(
  context: AiCaseContext,
): Promise<AiAssistanceResult> {
  const providerName = process.env.AI_PROVIDER?.trim().toLowerCase() || "groq";

  if (providerName === "mock") {
    return generateMockAssistance(context);
  }

  if (providerName !== "groq") {
    throw createError({
      statusCode: 500,
      statusMessage: "Unsupported AI provider configured",
    });
  }

  return generateGroqAssistance(context);
}
