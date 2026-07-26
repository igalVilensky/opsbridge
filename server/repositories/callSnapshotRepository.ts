import { prisma } from "../database/prisma";
import type { CallRecord } from "../integrations/callClient";

export async function saveCallSnapshot(
  caseId: string,
  call: CallRecord,
) {
  return prisma.callSnapshot.upsert({
    where: {
      caseId,
    },
    update: {
      externalCallId: call.id,
      calledAt: new Date(call.calledAt),
      durationSeconds: call.durationSeconds,
      callStatus: call.status,
      note: call.note,
      rawData: JSON.stringify(call),
    },
    create: {
      caseId,
      externalCallId: call.id,
      calledAt: new Date(call.calledAt),
      durationSeconds: call.durationSeconds,
      callStatus: call.status,
      note: call.note,
      rawData: JSON.stringify(call),
    },
  });
}