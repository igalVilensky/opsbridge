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

export async function enrichCase(caseId: string) {
  const supportCase = await findCaseById(caseId);

  if (!supportCase) {
    throw createError({
      statusCode: 404,
      statusMessage: "Case not found",
    });
  }

  await updateCaseStatus(caseId, "ENRICHING");

  let customerPhone = supportCase.phoneNumber;

  if (supportCase.customerEmail) {
    const customer = await getCustomerByEmail(
      supportCase.customerEmail,
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
    const order = await getOrderById(supportCase.orderId);

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
    const call = await getLatestCallByPhone(customerPhone);

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