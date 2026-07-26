const orders = [
  {
    id: "ORD-1024",
    customerId: "CRM-1001",
    orderDate: "2026-07-20T09:30:00Z",
    status: "shipped",
    shippingStatus: "delayed",
    shippingProvider: "MockCarrier",
    trackingNumber: "TRACK-88342",
    items: [
      {
        sku: "SKU-100",
        name: "Wireless Keyboard",
        quantity: 1,
      },
    ],
    deliveryProblem: "Shipment delayed at regional distribution center",
  },
  {
    id: "ORD-2048",
    customerId: "CRM-1002",
    orderDate: "2026-07-18T11:00:00Z",
    status: "delivered",
    shippingStatus: "delivered",
    shippingProvider: "MockCarrier",
    trackingNumber: "TRACK-20481",
    items: [
      {
        sku: "SKU-200",
        name: "USB-C Dock",
        quantity: 1,
      },
    ],
    deliveryProblem: null,
  },
];

export default defineEventHandler((event) => {
  const orderId = getRouterParam(event, "id");

  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: "Order not found",
    });
  }

  return order;
});