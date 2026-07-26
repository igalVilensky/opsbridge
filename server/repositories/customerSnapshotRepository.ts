import { prisma } from "../database/prisma";
import type { CrmCustomer } from "../integrations/crmClient";

export async function saveCustomerSnapshot(
  caseId: string,
  customer: CrmCustomer,
) {
  return prisma.customerSnapshot.upsert({
    where: {
      caseId,
    },
    update: {
      externalCustomerId: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      status: customer.status,
      rawData: JSON.stringify(customer),
    },
    create: {
      caseId,
      externalCustomerId: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      status: customer.status,
      rawData: JSON.stringify(customer),
    },
  });
}