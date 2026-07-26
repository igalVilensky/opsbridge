export type CallRecord = {
  id: string;
  phone: string;
  calledAt: string;
  durationSeconds: number;
  status: string;
  note: string;
};

export async function getLatestCallByPhone(
  phone: string,
): Promise<CallRecord> {
  return $fetch<CallRecord>("/api/mock/calls", {
    query: { phone },
  });
}