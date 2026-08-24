import { getAllFoods } from "@/lib/data";
import FoodRow from "@/components/FoodRow";

export const revalidate = 0;

export default async function HomePage() {
  const foods = await getAllFoods();

  return (
    <div className="max-w-wrap mx-auto px-4 py-8">
      <p className="text-sm text-muted mb-6 max-w-[46ch]">
        Türkiye&apos;nin yemekleri hangi şehre ait? Oy ver, tartış, memleketine sahip çık.
      </p>

      <div className="border-t border-line">
        {foods.map((food) => (
          <FoodRow key={food.id} food={food} />
        ))}
      </div>
    </div>
  );
}
