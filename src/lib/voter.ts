const STORAGE_KEY = "hangi-sehrin-voter-id";

// A lightweight, anonymous per-browser identifier used only to stop
// the same browser from voting twice on the same food. It is not an
// account system — clearing storage resets it.
export function getVoterId(): string {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `voter-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function getVotedFoodsMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("hangi-sehrin-votes");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markFoodVoted(foodSlug: string, citySlug: string) {
  if (typeof window === "undefined") return;
  const votes = getVotedFoodsMap();
  votes[foodSlug] = citySlug;
  window.localStorage.setItem("hangi-sehrin-votes", JSON.stringify(votes));
}
