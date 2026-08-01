import { getCustomerByEmail } from "../integrations/crmClient";
import { getOrderById } from "../integrations/fulfillmentClient";
import { getLatestCallByPhone } from "../integrations/callClient";

import {
  findCaseById,
  updateCaseStatus,
} from "../repositories/caseRepository";

import { saveCustomerSnapshot } from "../repositories/customerSnapshotRepository";
import { saveOrderSnapshot } from "../repositories/orderSnapshotRepository";
import { saveCallSnapshot } from "../repositories/callSnapshotRepository";
import { createCaseEvent } from "../repositories/eventRepository";
import { startEnrichmentRun } from "../repositories/enrichmentRunRepository";
import {
  completeIntegrationRun,
  failIntegrationRun,
  type IntegrationName,
  startIntegrationRun,
} from "../repositories/integrationRunRepository";

async function trackIntegrationRun<T>(
  caseId: string,
  enrichmentRunId: string,
  integrationName: IntegrationName,
  operation: () => Promise<T>,
) {
  const integrationRun = await startIntegrationRun(
    caseId,
    enrichmentRunId,
    integrationName,
  );

  try {
    const result = await operation();

    await completeIntegrationRun(integrationRun.id);

    return result;
  } catch (error) {
    await failIntegrationRun(
      integrationRun.id,
      error instanceof Error ? error.message : String(error),
    );

    throw error;
  }
}

export async function enrichCase(caseId: string) {
  const supportCase = await findCaseById(caseId);

  if (!supportCase) {
    throw createError({
      statusCode: 404,
      statusMessage: "Case not found",
    });
  }

  await updateCaseStatus(caseId, "ENRICHING");

  const enrichmentRun = await startEnrichmentRun(caseId);

  let customerPhone = supportCase.phoneNumber;

  if (supportCase.customerEmail) {
    const customer = await trackIntegrationRun(
      caseId,
      enrichmentRun.id,
      "CRM",
      () => getCustomerByEmail(
        supportCase.customerEmail!,
      ),
    );

    await saveCustomerSnapshot(caseId, customer);

    customerPhone = customer.phone;

    if (!supportCase.customerSnapshot) {
      await createCaseEvent(
        caseId,
        "CRM_DATA_LOADED",
        "Customer data loaded from CRM",
        {
          externalCustomerId: customer.id,
        },
      );
    }
  }

  if (supportCase.orderId) {
    const order = await trackIntegrationRun(
      caseId,
      enrichmentRun.id,
      "FULFILLMENT",
      () => getOrderById(supportCase.orderId!),
    );

    await saveOrderSnapshot(caseId, order);

    if (!supportCase.orderSnapshot) {
      await createCaseEvent(
        caseId,
        "ORDER_DATA_LOADED",
        "Order data loaded from fulfillment system",
        {
          externalOrderId: order.id,
        },
      );
    }
  }

  if (customerPhone) {
    const call = await trackIntegrationRun(
      caseId,
      enrichmentRun.id,
      "CALL",
      () => getLatestCallByPhone(customerPhone),
    );

    await saveCallSnapshot(caseId, call);

    if (!supportCase.callSnapshot) {
      await createCaseEvent(
        caseId,
        "CALL_DATA_LOADED",
        "Latest call loaded from call system",
        {
          externalCallId: call.id,
        },
      );
    }
  }

  await updateCaseStatus(caseId, "READY_FOR_REVIEW");

  return findCaseById(caseId);
}
