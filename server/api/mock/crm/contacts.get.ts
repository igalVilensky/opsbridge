const customers = [
  {
    id: "CRM-1001",
    name: "Anna Müller",
    email: "anna@example.de",
    phone: "+49 123 456789",
    company: "Example GmbH",
    status: "active",
  },
  {
    id: "CRM-1002",
    name: "Lukas Schneider",
    email: "lukas@example.de",
    phone: "+49 987 654321",
    company: "Schneider Handel",
    status: "active",
  },
];

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const email = typeof query.email === "string" ? query.email : "";

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email query parameter is required",
    });
  }

  const customer = customers.find(
    (item) => item.email.toLowerCase() === email.toLowerCase(),
  );

  if (!customer) {
    throw createError({
      statusCode: 404,
      statusMessage: "Customer not found",
    });
  }

  return customer;
});