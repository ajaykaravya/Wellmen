import DashboardShell from "../../_components/DashboardShell";
import TransportConfigFormContent from "../_components/TransportConfigFormContent";

type TransportConfigNewPageProps = {
  searchParams?: Promise<{
    transportType?: string;
  }> | null;
};

export default async function TransportConfigNewPage({
  searchParams,
}: TransportConfigNewPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <DashboardShell requireAdmin>
    <TransportConfigFormContent
      initialTransportType={resolvedSearchParams?.transportType}
    />
    </DashboardShell>
  );
}
