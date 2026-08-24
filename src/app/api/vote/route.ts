import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let body: { foodId?: string; cityId?: string; voterId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const { foodId, cityId, voterId } = body;

  if (!foodId || !cityId || !voterId) {
    return NextResponse.json(
      { error: "foodId, cityId ve voterId zorunludur." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Make sure the city is actually a candidate for this food.
  const { data: candidate, error: candidateError } = await supabase
    .from("food_cities")
    .select("id")
    .eq("food_id", foodId)
    .eq("city_id", cityId)
    .maybeSingle();

  if (candidateError) {
    return NextResponse.json({ error: candidateError.message }, { status: 500 });
  }
  if (!candidate) {
    return NextResponse.json(
      { error: "Bu şehir bu yemek için aday değil." },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabase
    .from("votes")
    .insert({ food_id: foodId, city_id: cityId, voter_id: voterId });

  if (insertError) {
    // Unique constraint violation = already voted on this food.
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Bu yemeğe zaten oy verdin." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: updated, error: readError } = await supabase
    .from("food_cities")
    .select("vote_count")
    .eq("food_id", foodId)
    .eq("city_id", cityId)
    .single();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  return NextResponse.json({ voteCount: updated.vote_count });
}
