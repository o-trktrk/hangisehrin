import type { BidHistoryItem } from "@/lib/types";

export default function BidHistoryList({ bids }: { bids: BidHistoryItem[] }) {
  if (bids.length === 0) {
    return <p className="text-sm text-muted">Henüz teklif verilmemiş.</p>;
  }

  return (
    <ul className="text-sm">
      {bids.map((bid) => (
        <li
          key={bid.id}
          className="flex items-baseline justify-between gap-3 py-1.5 border-b border-line last:border-b-0"
        >
          <span className="truncate">
            <span className="font-medium tnum">${bid.amount.toFixed(0)}</span>
            {" — "}
            <span>{bid.bidder_name}</span>
            {bid.city?.name && <span className="text-muted"> ({bid.city.name})</span>}
          </span>
          <span className="text-xs text-muted shrink-0 tnum">
            {new Date(bid.created_at).toLocaleDateString("tr-TR")}
          </span>
        </li>
      ))}
    </ul>
  );
}
