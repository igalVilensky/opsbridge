const calls = [
  {
    id: "CALL-5001",
    phone: "+49 123 456789",
    calledAt: "2026-07-26T10:42:00Z",
    durationSeconds: 180,
    status: "completed",
    note: "Customer asked about delayed order.",
  },
  {
    id: "CALL-5002",
    phone: "+49 987 654321",
    calledAt: "2026-07-24T08:15:00Z",
    durationSeconds: 95,
    status: "completed",
    note: "Customer confirmed delivery.",
  },
];

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "");
}

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const phone = typeof query.phone === "string" ? query.phone : "";

  if (!phone) {
    throw createError({
      statusCode: 400,
      statusMessage: "Phone query parameter is required",
    });
  }

  const customerCalls = calls
    .filter(
      (call) => normalizePhone(call.phone) === normalizePhone(phone),
    )
    .sort(
      (a, b) =>
        new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime(),
    );

  const latestCall = customerCalls[0];

  if (!latestCall) {
    throw createError({
      statusCode: 404,
      statusMessage: "Call not found",
    });
  }

  return latestCall;
});