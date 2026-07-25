import { z } from "zod";

export const createCaseSchema = z.object({
  subject: z.string().trim().min(3).max(150),
  originalMessage: z.string().trim().min(10).max(5000),
  customerEmail: z.string().email().optional(),
  orderId: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
  department: z.enum([
    "CUSTOMER_SERVICE",
    "LOGISTICS",
    "FINANCE",
    "HR",
    "ADMINISTRATION",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  externalRequestId: z.string().trim().optional(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;