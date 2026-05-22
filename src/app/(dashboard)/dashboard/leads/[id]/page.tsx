import { LeadDetail } from "@/components/leads/lead-detail";

export const metadata = { title: "Lead — BrokerOS" };

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="max-w-4xl">
      <LeadDetail leadId={id} />
    </div>
  );
}
