import type { Ownership } from "@/lib/types";

export default function OwnershipBox({
  ownership,
  foodName
}: {
  ownership: Ownership | null;
  foodName: string;
}) {
  if (!ownership || !ownership.city) {
    return (
      <div className="border-l-2 border-line pl-4 py-1">
        <p className="text-sm text-muted">
          {foodName} için henüz sahip şehir yok. İlk teklifi sen ver.
        </p>
      </div>
    );
  }

  return (
    <div className="border-l-2 border-accent pl-4 py-1">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <span className="font-display font-bold text-xl">{ownership.city.name}</span>
        <span className="font-display font-bold text-lg tnum text-accent">
          ${ownership.current_bid_amount.toFixed(0)}
        </span>
      </div>

      {ownership.owner_name && (
        <p className="text-sm font-medium mt-1">{ownership.owner_name}</p>
      )}

      {ownership.owner_description && (
        <p className="text-sm text-muted mt-1 max-w-[55ch]">
          {ownership.owner_description}
        </p>
      )}

      {ownership.owner_link && (
        <a
          href={ownership.owner_link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-block text-sm font-medium underline mt-2"
        >
          Web sitesine git ↗
        </a>
      )}
    </div>
  );
}
