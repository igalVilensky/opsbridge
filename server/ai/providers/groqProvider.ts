import Groq from "groq-sdk";
import { aiAssistanceSchema, type AiAssistanceResult, type AiCaseContext } from "../types";

const assistanceResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      minLength: 1,
    },
    suggestedAction: {
      type: "string",
      minLength: 1,
    },
    draftResponse: {
      type: "string",
      minLength: 1,
    },
  },
  required: ["summary", "suggestedAction", "draftResponse"],
} as const;

function buildCaseContextPrompt(context: AiCaseContext) {
  return JSON.stringify(
    {
      subject: context.subject,
      originalMessage: context.originalMessage,
      customerEmail: context.customerEmail ?? null,
      customerSnapshot: context.customerSnapshot ?? null,
      orderId: context.orderId ?? null,
      orderSnapshot: context.orderSnapshot ?? null,
      callSnapshot: context.callSnapshot ?? null,
      department: context.department,
      priority: context.priority,
    },
    null,
    2,
  );
}

function buildSystemPrompt() {
  return [
    "You are an internal customer-service assistant for OpsBridge.",
    "Your job is to produce grounded assistance output from CASE CONTEXT only.",
    "Never fabricate missing information.",
    "Never infer that a recommended action has already happened.",
    "Never invent delivery estimates, tracking URLs, refunds, compensation, policies, dates, or customer promises.",
    "Never claim contact with an external provider unless that contact is explicitly present in the case context.",
    "If information is unavailable, say it is unavailable or omit it.",
    "Treat external/customer-facing claims conservatively.",
    "Distinguish clearly between known facts and recommended next actions.",
    "The summary must describe only facts explicitly present in the case context.",
    "The suggestedAction must describe only a recommendation, not a completed action.",
    "The draftResponse must be grounded only in CASE CONTEXT and must not add unsupported details.",
    "Do not mention internal reasoning.",
    "Use the same language as the original customer message; if the language is unclear, respond in German.",
    "Keep the output concise and strictly follow the requested JSON schema.",
  ].join(" ");
}

function buildUserPrompt(context: AiCaseContext) {
  return [
    "Use only the CASE CONTEXT below.",
    "Do not use outside knowledge.",
    "Do not fill in missing details.",
    "When writing the draft response, include only what is currently known from the context.",
    "If a fact is not present below, do not state it as fact.",
    "",
    "CASE CONTEXT:",
    buildCaseContextPrompt(context),
  ].join("\n");
}

function mapGroqError(error: unknown): never {
  if (error instanceof Groq.APIError) {
    console.error("Groq request failed", {
      name: error.name,
      status: error.status,
      message: error.message,
    });

    if (error.status === 429) {
      throw createError({
        statusCode: 429,
        statusMessage: "AI provider rate limit reached",
      });
    }

    if (error.status && error.status >= 500) {
      throw createError({
        statusCode: 503,
        statusMessage: "AI provider is temporarily unavailable",
      });
    }

    throw createError({
      statusCode: 502,
      statusMessage: "AI provider request failed",
    });
  }

  if (error instanceof Error) {
    console.error("Groq request failed", {
      name: error.name,
      message: error.message,
    });
  } else {
    console.error("Groq request failed", error);
  }

  throw createError({
    statusCode: 502,
    statusMessage: "AI provider request failed",
  });
}

function parseAndValidateResponse(content: string): AiAssistanceResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "AI provider returned invalid JSON",
    });
  }

  const validated = aiAssistanceSchema.safeParse(parsed);

  if (!validated.success) {
    console.error("Groq response validation failed", validated.error.flatten());

    throw createError({
      statusCode: 502,
      statusMessage: "AI provider returned an invalid response",
    });
  }

  return validated.data;
}

export async function generateGroqAssistance(
  context: AiCaseContext,
): Promise<AiAssistanceResult> {
  const runtimeConfig = useRuntimeConfig();
  const groqApiKey = runtimeConfig.groqApiKey?.trim();
  const groqModel = runtimeConfig.groqModel?.trim() || "openai/gpt-oss-20b";

  if (!groqApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Groq API key is not configured",
    });
  }

  const client = new Groq({
    apiKey: groqApiKey,
  });

  try {
    const response = await client.chat.completions.create({
      model: groqModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt(context),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "case_assistance",
          strict: true,
          schema: assistanceResponseSchema,
        },
      },
    });

    const content = response.choices[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw createError({
        statusCode: 502,
        statusMessage: "AI provider returned an empty response",
      });
    }

    return parseAndValidateResponse(content);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }

    mapGroqError(error);
  }
}
