"use client";

import { useEffect, useState } from "react";
import type { FoodCityVote } from "@/lib/types";
import { getVoterId, getVotedFoodsMap, markFoodVoted } from "@/lib/voter";

export default function VoteBoard({
  foodId,
  foodSlug,
  cityVotes
}: {
  foodId: string;
  foodSlug: string;
  cityVotes: FoodCityVote[];
}) {
  const [rows, setRows] = useState(cityVotes);
  const [votedCitySlug, setVotedCitySlug] = useState<string | null>(null);
  const [pendingCityId, setPendingCityId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const votes = getVotedFoodsMap();
    setVotedCitySlug(votes[foodSlug] ?? null);
  }, [foodSlug]);

  const maxVotes = Math.max(1, ...rows.map((r) => r.vote_count));

  async function handleVote(cityId: string, citySlug: string) {
    if (votedCitySlug || pendingCityId) return;
    setError(null);
    setPendingCityId(cityId);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId, cityId, voterId: getVoterId() })
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Oy verilemedi.");
      }

      setRows((prev) =>
        prev
          .map((r) => (r.city_id === cityId ? { ...r, vote_count: json.voteCount } : r))
          .sort((a, b) => b.vote_count - a.vote_count)
      );
      markFoodVoted(foodSlug, citySlug);
      setVotedCitySlug(citySlug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir şeyler ters gitti.");
    } finally {
      setPendingCityId(null);
    }
  }

  return (
    <div>
      <ul>
        {rows.map((row) => {
          const isVotedFor = votedCitySlug === row.city.slug;
          const widthPct = Math.round((row.vote_count / maxVotes) * 100);

          return (
            <li key={row.city_id} className="py-2 border-b border-line last:border-b-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                  {row.city.name}
                  {isVotedFor && <span className="text-accent"> ✓</span>}
                </span>
                <span className="text-sm tnum text-muted">
                  {row.vote_count.toLocaleString("tr-TR")} oy
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 bg-line">
                  <div
                    className="h-1.5 bg-ink"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <button
                  onClick={() => handleVote(row.city_id, row.city.slug)}
                  disabled={Boolean(votedCitySlug) || pendingCityId !== null}
                  className="text-xs font-medium border border-ink px-2.5 py-1 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink hover:text-paper transition-colors"
                >
                  {pendingCityId === row.city_id
                    ? "..."
                    : isVotedFor
                    ? "Oy verildi"
                    : `${row.city.name}'a oy ver`}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {error && <p className="text-xs text-accent mt-2">{error}</p>}
    </div>
  );
}
