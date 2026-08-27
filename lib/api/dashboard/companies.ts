import { requestJson } from "../client";

export type CompanyDetails = {
  id: string;
  name: string;
  code: string;
  contactPerson: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  updatedAt?: string;
};

export async function loadCompanies() {
  const data = await requestJson<{ data: CompanyDetails[] }>({
    path: "/api/companies",
  });
  return data?.data || [];
}

export async function updateCompany(
  id: string,
  body: Partial<CompanyDetails> & { name: string; code: string },
) {
  return requestJson<{ data: CompanyDetails }>({
    path: `/api/companies/${id}`,
    method: "PUT",
    body,
  });
}

export async function uploadCompanyLogo(id: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return requestJson<{ data: { id: string; logoUrl: string } }>({
    path: `/api/companies/${id}/logo`,
    method: "POST",
    body: form,
  });
}
