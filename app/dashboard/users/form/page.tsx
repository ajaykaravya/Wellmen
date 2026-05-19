import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<{ id?: string }>;
};

export default async function UserFormRedirect({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const userId = resolvedSearchParams?.id;
  if (userId) {
    redirect(`/dashboard/users/${userId}`);
  }
  redirect("/dashboard/users/new");
}
