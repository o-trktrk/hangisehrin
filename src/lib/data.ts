import { createServerClient } from "@/lib/supabase/server";
import type { BidHistoryItem, City, Food, FoodCityVote, FoodWithDetails, Ownership } from "@/lib/types";

async function getCitiesById(
  supabase: ReturnType<typeof createServerClient>,
  ids: string[]
): Promise<Map<string, City>> {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("cities")
    .select("id, name, slug")
    .in("id", Array.from(new Set(ids)));

  if (error) throw new Error(`Şehirler yüklenemedi: ${error.message}`);

  return new Map((data ?? []).map((c) => [c.id as string, c as City]));
}

function buildCityVotes(
  rows: { food_id: string; city_id: string; vote_count: number }[],
  citiesById: Map<string, City>
): Map<string, FoodCityVote[]> {
  const byFood = new Map<string, FoodCityVote[]>();

  for (const row of rows) {
    const city = citiesById.get(row.city_id);
    if (!city) continue;
    const list = byFood.get(row.food_id) ?? [];
    list.push({ city_id: row.city_id, vote_count: row.vote_count, city });
    byFood.set(row.food_id, list);
  }

  for (const list of byFood.values()) {
    list.sort((a, b) => b.vote_count - a.vote_count);
  }

  return byFood;
}

export async function getAllFoods(): Promise<FoodWithDetails[]> {
  const supabase = createServerClient();

  const { data: foods, error: foodsError } = await supabase
    .from("foods")
    .select("id, name, slug, image_url, description")
    .order("name", { ascending: true });

  if (foodsError) throw new Error(`Yemekler yüklenemedi: ${foodsError.message}`);

  const foodRows = (foods ?? []) as Food[];
  const foodIds = foodRows.map((f) => f.id);

  const [{ data: fcRows, error: fcError }, { data: ownershipRows, error: ownershipError }] =
    await Promise.all([
      supabase.from("food_cities").select("food_id, city_id, vote_count").in("food_id", foodIds),
      supabase
        .from("food_ownership")
        .select("food_id, city_id, current_bid_amount, owner_name, owner_description, owner_link")
        .in("food_id", foodIds)
    ]);

  if (fcError) throw new Error(`Şehir adayları yüklenemedi: ${fcError.message}`);
  if (ownershipError) throw new Error(`Sahiplik verisi yüklenemedi: ${ownershipError.message}`);

  const cityIds = [
    ...(fcRows ?? []).map((r) => r.city_id as string),
    ...(ownershipRows ?? []).map((r) => r.city_id as string).filter(Boolean)
  ];
  const citiesById = await getCitiesById(supabase, cityIds);

  const cityVotesByFood = buildCityVotes(
    (fcRows ?? []) as { food_id: string; city_id: string; vote_count: number }[],
    citiesById
  );

  const ownershipByFood = new Map<string, Ownership>();
  for (const row of ownershipRows ?? []) {
    ownershipByFood.set(row.food_id as string, {
      food_id: row.food_id as string,
      city_id: (row.city_id as string) ?? null,
      current_bid_amount: Number(row.current_bid_amount),
      owner_name: row.owner_name as string | null,
      owner_description: row.owner_description as string | null,
      owner_link: row.owner_link as string | null,
      city: row.city_id ? citiesById.get(row.city_id as string) ?? null : null
    });
  }

  return foodRows.map((food) => {
    const cityVotes = cityVotesByFood.get(food.id) ?? [];
    return {
      ...food,
      cityVotes,
      ownership: ownershipByFood.get(food.id) ?? null,
      bidHistory: [],
      totalVotes: cityVotes.reduce((sum, cv) => sum + cv.vote_count, 0)
    };
  });
}

export async function getFoodBySlug(slug: string): Promise<FoodWithDetails | null> {
  const supabase = createServerClient();

  const { data: food, error: foodError } = await supabase
    .from("foods")
    .select("id, name, slug, image_url, description")
    .eq("slug", slug)
    .maybeSingle();

  if (foodError) throw new Error(`Yemek yüklenemedi: ${foodError.message}`);
  if (!food) return null;

  const [
    { data: fcRows, error: fcError },
    { data: ownershipRow, error: ownershipError },
    { data: bidRows, error: bidError }
  ] = await Promise.all([
    supabase.from("food_cities").select("food_id, city_id, vote_count").eq("food_id", food.id),
    supabase
      .from("food_ownership")
      .select("food_id, city_id, current_bid_amount, owner_name, owner_description, owner_link")
      .eq("food_id", food.id)
      .maybeSingle(),
    supabase
      .from("bid_history")
      .select("id, city_id, amount, bidder_name, description, created_at")
      .eq("food_id", food.id)
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  if (fcError) throw new Error(`Şehir adayları yüklenemedi: ${fcError.message}`);
  if (ownershipError) throw new Error(`Sahiplik verisi yüklenemedi: ${ownershipError.message}`);
  if (bidError) throw new Error(`Bid geçmişi yüklenemedi: ${bidError.message}`);

  const cityIds = [
    ...(fcRows ?? []).map((r) => r.city_id as string),
    ...(bidRows ?? []).map((r) => r.city_id as string),
    ...(ownershipRow?.city_id ? [ownershipRow.city_id as string] : [])
  ];
  const citiesById = await getCitiesById(supabase, cityIds);

  const cityVotes = ((fcRows ?? []) as { food_id: string; city_id: string; vote_count: number }[])
    .map((row) => {
      const city = citiesById.get(row.city_id);
      return city ? { city_id: row.city_id, vote_count: row.vote_count, city } : null;
    })
    .filter((v): v is FoodCityVote => v !== null)
    .sort((a, b) => b.vote_count - a.vote_count);

  const ownership: Ownership | null = ownershipRow
    ? {
        food_id: ownershipRow.food_id as string,
        city_id: (ownershipRow.city_id as string) ?? null,
        current_bid_amount: Number(ownershipRow.current_bid_amount),
        owner_name: ownershipRow.owner_name as string | null,
        owner_description: ownershipRow.owner_description as string | null,
        owner_link: ownershipRow.owner_link as string | null,
        city: ownershipRow.city_id ? citiesById.get(ownershipRow.city_id as string) ?? null : null
      }
    : null;

  const bidHistory: BidHistoryItem[] = (bidRows ?? []).map((row) => ({
    id: row.id as string,
    amount: Number(row.amount),
    bidder_name: row.bidder_name as string,
    description: row.description as string | null,
    created_at: row.created_at as string,
    city: citiesById.get(row.city_id as string) ?? null
  }));

  return {
    ...(food as Food),
    cityVotes,
    ownership,
    bidHistory,
    totalVotes: cityVotes.reduce((sum, cv) => sum + cv.vote_count, 0)
  };
}

export async function getAllFoodSlugs(): Promise<string[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("foods").select("slug");
  if (error) throw new Error(`Yemek listesi alınamadı: ${error.message}`);
  return (data ?? []).map((f) => f.slug as string);
}
