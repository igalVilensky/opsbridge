export type CrmCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
};

export async function getCustomerByEmail(
  email: string,
): Promise<CrmCustomer> {
  return $fetch<CrmCustomer>("/api/mock/crm/contacts", {
    query: { email },
  });
}