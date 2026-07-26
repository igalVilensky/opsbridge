export type FulfillmentOrder = {
  id: string;
  customerId: string;
  orderDate: string;
  status: string;
  shippingStatus: string;
  shippingProvider: string;
  trackingNumber: string;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
  }>;
  deliveryProblem: string | null;
};

export async function getOrderById(
  orderId: string,
): Promise<FulfillmentOrder> {
  return $fetch<FulfillmentOrder>(
    `/api/mock/fulfillment/orders/${orderId}`,
  );
}