import TransportConfigFormContent from "../_components/TransportConfigFormContent";

type TransportConfigEditPageProps = {
  params: Promise<{ id?: string | string[] }>;
};

export default async function TransportConfigEditPage({
  params,
}: TransportConfigEditPageProps) {
  const { id } = await params;
  const transportConfigId = Array.isArray(id) ? id[0] : id;

  if (!transportConfigId || typeof transportConfigId !== "string") return null;

  return <TransportConfigFormContent transportConfigId={transportConfigId} />;
}
