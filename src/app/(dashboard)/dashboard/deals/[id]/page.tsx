import { DealDetail } from "@/components/deals/deal-detail";

export const metadata = { title: "Deal — BrokerOS" };

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="max-w-4xl">
      <DealDetail transactionId={id} />
    </div>
  );
}
