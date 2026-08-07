import { z } from "zod";

export const aiAssistanceSchema = z.object({
  summary: z.string().trim().min(1).max(1000),
  suggestedAction: z.string().trim().min(1).max(1000),
  draftResponse: z.string().trim().min(1).max(4000),
});

export type AiAssistanceResult = z.infer<typeof aiAssistanceSchema>;

export type AiCaseContext = {
  subject: string;
  originalMessage: string;
  customerEmail?: string | null;
  customerSnapshot?: {
    name: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    status: string;
  } | null;
  orderId?: string | null;
  orderSnapshot?: {
    externalOrderId: string;
    orderStatus: string;
    shippingStatus: string;
    shippingProvider?: string | null;
    trackingNumber?: string | null;
  } | null;
  callSnapshot?: {
    externalCallId: string;
    calledAt: string;
    durationSeconds: number;
    callStatus: string;
    note?: string | null;
  } | null;
  department: string;
  priority: string;
};
