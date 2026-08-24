import Image from "next/image";
import Link from "next/link";
import type { FoodWithDetails } from "@/lib/types";

export default function FoodRow({ food }: { food: FoodWithDetails }) {
  const leader = food.cityVotes[0];

  return (
    <Link
      href={`/food/${food.slug}`}
      className="flex items-center gap-4 py-3 border-b border-line group"
    >
      <div className="relative w-14 h-14 shrink-0 bg-line overflow-hidden">
        {food.image_url && (
          <Image
            src={food.image_url}
            alt={food.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-display font-bold text-base leading-tight group-hover:underline">
          {food.name}
        </div>
        {leader ? (
          <div className="text-xs text-muted truncate">
            Önde: {leader.city.name} · <span className="tnum">{leader.vote_count.toLocaleString("tr-TR")}</span> oy
          </div>
        ) : (
          <div className="text-xs text-muted">Henüz oy yok</div>
        )}
      </div>

      <div className="text-right shrink-0">
        {food.ownership ? (
          <>
            <div className="text-xs uppercase tracking-wide text-muted">
              {food.ownership.city?.name ?? "—"}
            </div>
            <div className="font-display font-bold text-sm tnum text-accent">
              ${food.ownership.current_bid_amount.toFixed(0)}
            </div>
          </>
        ) : (
          <div className="text-xs text-muted">Sahipsiz</div>
        )}
      </div>
    </Link>
  );
}
