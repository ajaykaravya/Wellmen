import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: { id?: string };
};

export default function UserFormRedirect({ searchParams }: PageProps) {
  const userId = searchParams?.id;
  if (userId) {
    redirect(`/dashboard/users/${userId}`);
  }
  redirect("/dashboard/users/new");
}
