import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL ?? process.env.NETLIFY_DB_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL or NETLIFY_DB_URL for seeding.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function json(value) {
  return JSON.stringify(value);
}

async function createDemoCase({
  caseData,
  customerSnapshot,
  orderSnapshot,
  callSnapshot,
  integrationRuns,
  events,
}) {
  const supportCase = await prisma.case.create({ data: caseData });
  const enrichmentRun = await prisma.enrichmentRun.create({
    data: { caseId: supportCase.id },
  });

  if (customerSnapshot) {
    await prisma.customerSnapshot.create({
      data: {
        caseId: supportCase.id,
        ...customerSnapshot,
      },
    });
  }

  if (orderSnapshot) {
    await prisma.orderSnapshot.create({
      data: {
        caseId: supportCase.id,
        ...orderSnapshot,
      },
    });
  }

  if (callSnapshot) {
    await prisma.callSnapshot.create({
      data: {
        caseId: supportCase.id,
        ...callSnapshot,
      },
    });
  }

  for (const integrationRun of integrationRuns) {
    await prisma.integrationRun.create({
      data: {
        caseId: supportCase.id,
        enrichmentRunId: enrichmentRun.id,
        ...integrationRun,
      },
    });
  }

  for (const event of events) {
    await prisma.caseEvent.create({
      data: {
        caseId: supportCase.id,
        ...event,
      },
    });
  }
}

async function main() {
  const existingCaseCount = await prisma.case.count();

  if (existingCaseCount > 0) {
    console.log("Skipping seed because cases already exist.");
    return;
  }

  await createDemoCase({
    caseData: {
      subject: "Delayed order",
      originalMessage:
        "Customer says order ORD-1024 has not arrived and asks for an update.",
      customerEmail: "anna@example.de",
      orderId: "ORD-1024",
      phoneNumber: "+49 30 55501024",
      department: "CUSTOMER_SERVICE",
      priority: "HIGH",
      status: "APPROVED",
      externalRequestId: "seed-case-delayed-order",
      aiSummary:
        "Order ORD-1024 is delayed, but the shipment is still active and should be followed up with the carrier.",
      suggestedAction:
        "Apologize for the delay, confirm carrier follow-up, and offer a proactive status update.",
      draftResponse:
        "Hello Anna, we are sorry your order has not arrived yet. Our team has checked the shipment and is following up with the carrier right away. We will update you as soon as we have the next tracking status.",
      approvedResponse:
        "Hello Anna, we are sorry your order has not arrived yet. Our team has checked the shipment and is following up with the carrier right away. We will update you as soon as we have the next tracking status.",
    },
    customerSnapshot: {
      externalCustomerId: "CUST-1024",
      name: "Anna Müller",
      email: "anna@example.de",
      phone: "+49 30 55501024",
      company: "Müller Design GmbH",
      status: "ACTIVE",
      rawData: json({
        id: "CUST-1024",
        name: "Anna Müller",
        email: "anna@example.de",
        phone: "+49 30 55501024",
        company: "Müller Design GmbH",
        status: "ACTIVE",
      }),
    },
    orderSnapshot: {
      externalOrderId: "ORD-1024",
      orderStatus: "OPEN",
      shippingStatus: "DELAYED",
      shippingProvider: "DHL",
      trackingNumber: "00340434161234567890",
      rawData: json({
        id: "ORD-1024",
        status: "OPEN",
        shippingStatus: "DELAYED",
        shippingProvider: "DHL",
        trackingNumber: "00340434161234567890",
      }),
    },
    callSnapshot: {
      externalCallId: "CALL-2001",
      calledAt: new Date("2026-08-06T09:12:00.000Z"),
      durationSeconds: 214,
      callStatus: "COMPLETED",
      note: "Customer asked about delayed order",
      rawData: json({
        id: "CALL-2001",
        calledAt: "2026-08-06T09:12:00.000Z",
        durationSeconds: 214,
        status: "COMPLETED",
        note: "Customer asked about delayed order",
      }),
    },
    integrationRuns: [
      {
        integrationName: "CRM",
        status: "SUCCESS",
        startedAt: new Date("2026-08-06T09:00:30.000Z"),
        finishedAt: new Date("2026-08-06T09:00:32.000Z"),
      },
      {
        integrationName: "FULFILLMENT",
        status: "SUCCESS",
        startedAt: new Date("2026-08-06T09:04:00.000Z"),
        finishedAt: new Date("2026-08-06T09:04:02.000Z"),
      },
      {
        integrationName: "CALL",
        status: "SUCCESS",
        startedAt: new Date("2026-08-06T09:11:30.000Z"),
        finishedAt: new Date("2026-08-06T09:11:34.000Z"),
      },
    ],
    events: [
      {
        eventType: "CASE_CREATED",
        message: "Fall erstellt",
      },
      {
        eventType: "CRM_DATA_LOADED",
        message: "Kundendaten aus CRM geladen",
        metadata: json({ externalCustomerId: "CUST-1024" }),
      },
      {
        eventType: "ORDER_DATA_LOADED",
        message: "Bestelldaten aus dem Fulfillment-System geladen",
        metadata: json({ externalOrderId: "ORD-1024" }),
      },
      {
        eventType: "CALL_DATA_LOADED",
        message: "Letzter Anruf aus dem Call System geladen",
        metadata: json({ externalCallId: "CALL-2001" }),
      },
      {
        eventType: "AI_SUMMARY_GENERATED",
        message: "KI-Unterstützung generiert",
      },
      {
        eventType: "DRAFT_APPROVED",
        message: "Antwortentwurf freigegeben",
      },
    ],
  });

  await createDemoCase({
    caseData: {
      subject: "Invoice copy request",
      originalMessage:
        "Customer needs a duplicate invoice for order ORD-2042 for finance bookkeeping.",
      customerEmail: "maria.lopez@example.de",
      orderId: "ORD-2042",
      phoneNumber: "+49 151 55502042",
      department: "FINANCE",
      priority: "MEDIUM",
      status: "READY_FOR_REVIEW",
      externalRequestId: "seed-case-invoice-copy",
      aiSummary:
        "The customer needs a duplicate invoice and the order is already completed.",
      suggestedAction:
        "Provide the duplicate invoice and confirm the document has been sent to finance.",
      draftResponse:
        "Hello Maria, we have prepared a duplicate invoice for order ORD-2042 and sent it to your finance contact. If you need anything else, we are happy to help.",
    },
    customerSnapshot: {
      externalCustomerId: "CUST-2042",
      name: "Maria Lopez",
      email: "maria.lopez@example.de",
      phone: "+49 151 55502042",
      company: "Lopez Advisory",
      status: "ACTIVE",
      rawData: json({
        id: "CUST-2042",
        name: "Maria Lopez",
        email: "maria.lopez@example.de",
        phone: "+49 151 55502042",
        company: "Lopez Advisory",
        status: "ACTIVE",
      }),
    },
    orderSnapshot: {
      externalOrderId: "ORD-2042",
      orderStatus: "COMPLETED",
      shippingStatus: "DELIVERED",
      shippingProvider: "DHL",
      trackingNumber: "00340434160987654321",
      rawData: json({
        id: "ORD-2042",
        status: "COMPLETED",
        shippingStatus: "DELIVERED",
        shippingProvider: "DHL",
        trackingNumber: "00340434160987654321",
      }),
    },
    callSnapshot: {
      externalCallId: "CALL-2042",
      calledAt: new Date("2026-08-06T11:40:00.000Z"),
      durationSeconds: 86,
      callStatus: "COMPLETED",
      note: "Customer requested an invoice copy",
      rawData: json({
        id: "CALL-2042",
        calledAt: "2026-08-06T11:40:00.000Z",
        durationSeconds: 86,
        status: "COMPLETED",
        note: "Customer requested an invoice copy",
      }),
    },
    integrationRuns: [
      {
        integrationName: "CRM",
        status: "SUCCESS",
        startedAt: new Date("2026-08-06T11:30:30.000Z"),
        finishedAt: new Date("2026-08-06T11:30:31.000Z"),
      },
      {
        integrationName: "FULFILLMENT",
        status: "SUCCESS",
        startedAt: new Date("2026-08-06T11:34:00.000Z"),
        finishedAt: new Date("2026-08-06T11:34:02.000Z"),
      },
      {
        integrationName: "CALL",
        status: "SUCCESS",
        startedAt: new Date("2026-08-06T11:39:30.000Z"),
        finishedAt: new Date("2026-08-06T11:39:31.000Z"),
      },
    ],
    events: [
      {
        eventType: "CASE_CREATED",
        message: "Fall erstellt",
      },
      {
        eventType: "CRM_DATA_LOADED",
        message: "Kundendaten aus CRM geladen",
        metadata: json({ externalCustomerId: "CUST-2042" }),
      },
      {
        eventType: "ORDER_DATA_LOADED",
        message: "Bestelldaten aus dem Fulfillment-System geladen",
        metadata: json({ externalOrderId: "ORD-2042" }),
      },
      {
        eventType: "CALL_DATA_LOADED",
        message: "Letzter Anruf aus dem Call System geladen",
        metadata: json({ externalCallId: "CALL-2042" }),
      },
      {
        eventType: "AI_SUMMARY_GENERATED",
        message: "KI-Unterstützung generiert",
      },
    ],
  });

  console.log("Seed data created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
