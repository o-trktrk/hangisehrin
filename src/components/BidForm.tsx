"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { City } from "@/lib/types";

export default function BidForm({
  foodId,
  candidates,
  currentBid
}: {
  foodId: string;
  candidates: City[];
  currentBid: number;
}) {
  const router = useRouter();
  const [cityId, setCityId] = useState(candidates[0]?.id ?? "");
  const [bidderName, setBidderName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const minBid = currentBid + 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cityId || !bidderName.trim() || !amount) return;

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId,
          cityId,
          bidderName,
          amount: Number(amount),
          description,
          link
        })
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Teklif gönderilemedi.");
      }

      setStatus("success");
      setBidderName("");
      setAmount("");
      setDescription("");
      setLink("");
      router.refresh();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Bir şeyler ters gitti.");
    }
  }

  if (candidates.length === 0) {
    return <p className="text-sm text-muted">Bu yemek için henüz aday şehir yok.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-line pt-4 space-y-3 max-w-sm">
      <p className="text-xs text-muted">
        Mevcut teklif ${currentBid.toFixed(0)}. Devralmak için en az ${minBid.toFixed(0)} teklif et.
      </p>

      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="bid-city">
          Şehir
        </label>
        <select
          id="bid-city"
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="w-full border border-line bg-paper px-2 py-1.5 text-sm"
        >
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="bid-name">
          İsim / işletme
        </label>
        <input
          id="bid-name"
          value={bidderName}
          onChange={(e) => setBidderName(e.target.value)}
          placeholder="ör. Konya Etli Ekmek"
          required
          className="w-full border border-line bg-paper px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="bid-amount">
          Teklif ($)
        </label>
        <input
          id="bid-amount"
          type="number"
          min={minBid}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={String(minBid)}
          required
          className="w-full border border-line bg-paper px-2 py-1.5 text-sm tnum"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="bid-description">
          Açıklama (opsiyonel)
        </label>
        <input
          id="bid-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="ör. Konya'nın geleneksel etli ekmeğini keşfedin."
          maxLength={140}
          className="w-full border border-line bg-paper px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="bid-link">
          Link (opsiyonel)
        </label>
        <input
          id="bid-link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          className="w-full border border-line bg-paper px-2 py-1.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="text-sm font-medium border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-40"
      >
        {status === "loading" ? "Gönderiliyor..." : "Teklif ver"}
      </button>

      {status === "error" && error && <p className="text-xs text-accent">{error}</p>}
      {status === "success" && (
        <p className="text-xs text-muted">Teklif alındı. Sahiplik güncellendi.</p>
      )}
    </form>
  );
}
