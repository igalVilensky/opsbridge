import { prisma } from "../database/prisma";
import type { FulfillmentOrder } from "../integrations/fulfillmentClient";

export async function saveOrderSnapshot(
  caseId: string,
  order: FulfillmentOrder,
) {
  return prisma.orderSnapshot.upsert({
    where: {
      caseId,
    },
    update: {
      externalOrderId: order.id,
      orderStatus: order.status,
      shippingStatus: order.shippingStatus,
      shippingProvider: order.shippingProvider,
      trackingNumber: order.trackingNumber,
      rawData: JSON.stringify(order),
    },
    create: {
      caseId,
      externalOrderId: order.id,
      orderStatus: order.status,
      shippingStatus: order.shippingStatus,
      shippingProvider: order.shippingProvider,
      trackingNumber: order.trackingNumber,
      rawData: JSON.stringify(order),
    },
  });
}