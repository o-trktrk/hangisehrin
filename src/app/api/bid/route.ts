import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let body: {
    foodId?: string;
    cityId?: string;
    bidderName?: string;
    amount?: number;
    description?: string;
    link?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const { foodId, cityId, bidderName, amount, description, link } = body;

  if (!foodId || !cityId || !bidderName?.trim() || typeof amount !== "number") {
    return NextResponse.json(
      { error: "foodId, cityId, bidderName ve amount zorunludur." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Teklif tutarı geçersiz." }, { status: 400 });
  }

  if (link) {
    try {
      new URL(link);
    } catch {
      return NextResponse.json({ error: "Link geçerli bir URL olmalı." }, { status: 400 });
    }
  }

  const supabase = createAdminClient();

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

  const { data: ownership, error: ownershipError } = await supabase
    .from("food_ownership")
    .select("current_bid_amount")
    .eq("food_id", foodId)
    .maybeSingle();

  if (ownershipError) {
    return NextResponse.json({ error: ownershipError.message }, { status: 500 });
  }

  const currentBid = ownership ? Number(ownership.current_bid_amount) : 0;

  if (amount <= currentBid) {
    return NextResponse.json(
      { error: `Teklif mevcut $${currentBid.toFixed(2)} tekliften yüksek olmalı.` },
      { status: 409 }
    );
  }

  const { data: pending, error: pendingError } = await supabase
    .from("pending_bids")
    .insert({
      food_id: foodId,
      city_id: cityId,
      bidder_name: bidderName.trim(),
      amount,
      description: description?.trim() || null,
      link: link?.trim() || null,
      status: "pending"
    })
    .select("id")
    .single();

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  // No real payment provider is wired up yet, so the bid is approved
  // immediately. This is the one place a future payment-confirmation
  // step would hook in, gated behind pending_bids.status.
  const { error: bidHistoryError } = await supabase.from("bid_history").insert({
    food_id: foodId,
    city_id: cityId,
    bidder_name: bidderName.trim(),
    amount,
    description: description?.trim() || null,
    link: link?.trim() || null
  });

  if (bidHistoryError) {
    return NextResponse.json({ error: bidHistoryError.message }, { status: 500 });
  }

  const { error: ownershipUpsertError } = await supabase.from("food_ownership").upsert({
    food_id: foodId,
    city_id: cityId,
    current_bid_amount: amount,
    owner_name: bidderName.trim(),
    owner_description: description?.trim() || null,
    owner_link: link?.trim() || null,
    updated_at: new Date().toISOString()
  });

  if (ownershipUpsertError) {
    return NextResponse.json({ error: ownershipUpsertError.message }, { status: 500 });
  }

  await supabase.from("pending_bids").update({ status: "approved" }).eq("id", pending.id);

  return NextResponse.json({ ok: true, amount });
}
