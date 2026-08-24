import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllFoodSlugs, getFoodBySlug } from "@/lib/data";
import VoteBoard from "@/components/VoteBoard";
import OwnershipBox from "@/components/OwnershipBox";
import BidForm from "@/components/BidForm";
import BidHistoryList from "@/components/BidHistoryList";

export const revalidate = 0;

export async function generateStaticParams() {
  const slugs = await getAllFoodSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function FoodPage({ params }: { params: { slug: string } }) {
  const food = await getFoodBySlug(params.slug);

  if (!food) {
    notFound();
  }

  return (
    <div className="max-w-wrap mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:underline">
        ← Tüm yemekler
      </Link>

      <h1 className="font-display font-bold text-3xl sm:text-4xl mt-3 mb-4">
        {food.name}
      </h1>

      {food.image_url && (
        <div className="relative w-full aspect-[16/9] bg-line mb-6">
          <Image
            src={food.image_url}
            alt={food.name}
            fill
            sizes="(max-width: 760px) 100vw, 760px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {food.description && (
        <p className="text-sm text-muted mb-8 max-w-[60ch]">{food.description}</p>
      )}

      <section className="mb-10">
        <h2 className="font-display font-bold text-lg mb-1">Bu lezzet hangi şehrin?</h2>
        <p className="text-xs text-muted mb-4">
          Toplam <span className="tnum">{food.totalVotes.toLocaleString("tr-TR")}</span> oy · tarayıcı başına bir oy geçerli.
        </p>
        <VoteBoard foodId={food.id} foodSlug={food.slug} cityVotes={food.cityVotes} />
      </section>

      <section className="mb-10">
        <h2 className="font-display font-bold text-lg mb-3">Sahip şehir</h2>
        <OwnershipBox ownership={food.ownership} foodName={food.name} />
      </section>

      <section className="mb-10">
        <h2 className="font-display font-bold text-lg mb-3">Sahipliği devral</h2>
        <BidForm
          foodId={food.id}
          candidates={food.cityVotes.map((cv) => cv.city)}
          currentBid={food.ownership?.current_bid_amount ?? 0}
        />
      </section>

      <section>
        <h2 className="font-display font-bold text-lg mb-3">Bid geçmişi</h2>
        <BidHistoryList bids={food.bidHistory} />
      </section>
    </div>
  );
}
