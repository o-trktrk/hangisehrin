export type City = {
  id: string;
  name: string;
  slug: string;
};

export type Food = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
};

export type FoodCityVote = {
  city_id: string;
  vote_count: number;
  city: City;
};

export type Ownership = {
  food_id: string;
  city_id: string | null;
  current_bid_amount: number;
  owner_name: string | null;
  owner_description: string | null;
  owner_link: string | null;
  city: City | null;
};

export type BidHistoryItem = {
  id: string;
  amount: number;
  bidder_name: string;
  description: string | null;
  created_at: string;
  city: City | null;
};

export type FoodWithDetails = Food & {
  cityVotes: FoodCityVote[];
  ownership: Ownership | null;
  bidHistory: BidHistoryItem[];
  totalVotes: number;
};
