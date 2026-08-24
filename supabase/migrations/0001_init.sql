-- ============================================================
-- Hangi Şehrin? — initial schema
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------

create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  description text,
  created_at timestamptz not null default now()
);

-- Candidate cities for a food, with a running vote total.
create table if not exists food_cities (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods(id) on delete cascade,
  city_id uuid not null references cities(id) on delete cascade,
  vote_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (food_id, city_id)
);

-- One row per vote cast. The unique constraint stops a single
-- browser (voter_id) from voting more than once on the same food.
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods(id) on delete cascade,
  city_id uuid not null references cities(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  unique (food_id, voter_id)
);

-- Current owner of a food's "şehir sahipliği".
create table if not exists food_ownership (
  food_id uuid primary key references foods(id) on delete cascade,
  city_id uuid references cities(id),
  current_bid_amount numeric(10, 2) not null default 0,
  owner_name text,
  owner_description text,
  owner_link text,
  updated_at timestamptz not null default now()
);

-- Confirmed / historical bids, newest first.
create table if not exists bid_history (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods(id) on delete cascade,
  city_id uuid not null references cities(id),
  bidder_name text not null,
  amount numeric(10, 2) not null,
  description text,
  link text,
  created_at timestamptz not null default now()
);

-- Bid submissions land here first. In this MVP (no real payment
-- provider) they are auto-approved by the API route the moment
-- they beat the current bid, then copied into bid_history /
-- food_ownership. The table exists so a real payment / moderation
-- step can be slotted in later without changing the schema.
create table if not exists pending_bids (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods(id) on delete cascade,
  city_id uuid not null references cities(id),
  bidder_name text not null,
  amount numeric(10, 2) not null,
  description text,
  link text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_food_cities_food on food_cities(food_id);
create index if not exists idx_votes_food on votes(food_id);
create index if not exists idx_bid_history_food on bid_history(food_id, created_at desc);
create index if not exists idx_pending_bids_food on pending_bids(food_id);

-- ------------------------------------------------------------
-- TRIGGER: keep food_cities.vote_count in sync with votes
-- ------------------------------------------------------------

create or replace function increment_food_city_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update food_cities
  set vote_count = vote_count + 1
  where food_id = new.food_id
    and city_id = new.city_id;

  if not found then
    insert into food_cities (food_id, city_id, vote_count)
    values (new.food_id, new.city_id, 1);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_increment_food_city_vote on votes;
create trigger trg_increment_food_city_vote
  after insert on votes
  for each row
  execute function increment_food_city_vote();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table cities enable row level security;
alter table foods enable row level security;
alter table food_cities enable row level security;
alter table votes enable row level security;
alter table food_ownership enable row level security;
alter table bid_history enable row level security;
alter table pending_bids enable row level security;

-- Everyone can read foods, cities, candidate lists, ownership and
-- bid history — this is a public leaderboard.
create policy "public read cities" on cities for select using (true);
create policy "public read foods" on foods for select using (true);
create policy "public read food_cities" on food_cities for select using (true);
create policy "public read food_ownership" on food_ownership for select using (true);
create policy "public read bid_history" on bid_history for select using (true);

-- Anyone can cast a vote. The (food_id, voter_id) unique constraint
-- is what actually stops double voting.
create policy "public insert votes" on votes for insert with check (true);
create policy "public read votes" on votes for select using (true);

-- Anyone can submit a bid request. It is only ever promoted to
-- bid_history / food_ownership by the server (service role), so no
-- update/delete policy is defined for anon/authenticated here.
create policy "public insert pending_bids" on pending_bids for insert with check (true);

-- Note: there are intentionally no public insert/update/delete
-- policies on food_ownership or bid_history. Those writes only
-- happen from the /api/bid route using SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS entirely.

-- ------------------------------------------------------------
-- SEED DATA
-- ------------------------------------------------------------

insert into cities (name, slug) values
  ('Konya', 'konya'),
  ('Karaman', 'karaman'),
  ('Aksaray', 'aksaray'),
  ('Adıyaman', 'adiyaman'),
  ('Şanlıurfa', 'sanliurfa'),
  ('Gaziantep', 'gaziantep'),
  ('Kayseri', 'kayseri'),
  ('Sinop', 'sinop'),
  ('Sivas', 'sivas'),
  ('Bitlis', 'bitlis'),
  ('Siirt', 'siirt'),
  ('Afyonkarahisar', 'afyonkarahisar'),
  ('Aydın', 'aydin'),
  ('İzmir', 'izmir'),
  ('Kahramanmaraş', 'kahramanmaras')
on conflict (slug) do nothing;

insert into foods (name, slug, image_url, description) values
  ('Etli Ekmek', 'etli-ekmek', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=1200&q=80', 'İnce hamur üzerine kıyma ile hazırlanan, ızgarada pişirilen geleneksel bir lezzet.'),
  ('Çiğ Köfte', 'cig-kofte', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80', 'Bulgur, biber salçası ve baharatlarla yoğrulan, elde şekillendirilen bir sokak lezzeti.'),
  ('Mantı', 'manti', 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?auto=format&fit=crop&w=1200&q=80', 'Küçük hamur parçalarının içine kıyma konularak kapatıldığı, yoğurtla servis edilen bir sofra klasiği.'),
  ('Büryan', 'buryan', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', 'Kuzu etinin toprak fırınlarda saatlerce pişirilmesiyle hazırlanan bir kebap türü.'),
  ('İncir', 'incir', 'https://images.unsplash.com/photo-1601379760883-1bb497c56b96?auto=format&fit=crop&w=1200&q=80', 'Ege topraklarının en tanınmış meyvelerinden biri.'),
  ('Pastırma', 'pastirma', 'https://images.unsplash.com/photo-1607116176995-4915d3454a3b?auto=format&fit=crop&w=1200&q=80', 'Çemenle kaplanarak kurutulan, ince dilimlenerek tüketilen bir et ürünü.'),
  ('Sucuk', 'sucuk', 'https://images.unsplash.com/photo-1622480916113-9000ac49b79d?auto=format&fit=crop&w=1200&q=80', 'Baharatlı kıymanın bağırsağa doldurularak kurutulmasıyla yapılan bir şarküteri ürünü.'),
  ('Ceviz', 'ceviz', 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=1200&q=80', 'Sert kabuklu, yağ oranı yüksek bir kuruyemiş.')
on conflict (slug) do nothing;

-- Candidate cities per food (starting field + a starting vote count
-- so the page doesn't look empty on first load).
insert into food_cities (food_id, city_id, vote_count)
select f.id, c.id, v.vote_count
from (values
  ('etli-ekmek', 'konya', 1248),
  ('etli-ekmek', 'karaman', 621),
  ('etli-ekmek', 'aksaray', 284),
  ('cig-kofte', 'adiyaman', 940),
  ('cig-kofte', 'sanliurfa', 887),
  ('cig-kofte', 'gaziantep', 512),
  ('manti', 'kayseri', 1502),
  ('manti', 'sinop', 233),
  ('manti', 'sivas', 411),
  ('buryan', 'bitlis', 356),
  ('buryan', 'siirt', 489),
  ('incir', 'aydin', 1120),
  ('incir', 'izmir', 640),
  ('pastirma', 'kayseri', 1330),
  ('pastirma', 'afyonkarahisar', 298),
  ('sucuk', 'afyonkarahisar', 705),
  ('sucuk', 'kayseri', 812),
  ('ceviz', 'kahramanmaras', 402),
  ('ceviz', 'adiyaman', 377)
) as v(food_slug, city_slug, vote_count)
join foods f on f.slug = v.food_slug
join cities c on c.slug = v.city_slug
on conflict (food_id, city_id) do nothing;

-- Starting owner + a small bid history per food, so the page has
-- something to show before real bids come in.
insert into food_ownership (food_id, city_id, current_bid_amount, owner_name, owner_description, owner_link)
select f.id, c.id, o.amount, o.owner_name, o.description, null
from (values
  ('etli-ekmek', 'konya', 17, 'Konya Etli Ekmek', 'Konya''nın geleneksel etli ekmeğini keşfedin.'),
  ('cig-kofte', 'adiyaman', 12, 'Adıyaman Çiğköfte Evi', 'Adıyaman usulü çiğ köfteyi ilk elden tadın.'),
  ('manti', 'kayseri', 22, 'Kayseri Mutfağı', 'Kayseri mantısının ev yapımı tadı.'),
  ('buryan', 'siirt', 9, 'Siirt Büryancısı', 'Toprak fırında saatlerce pişen gerçek büryan.'),
  ('incir', 'aydin', 14, 'Aydın İncir Bahçeleri', 'Ege güneşinde olgunlaşan incirler.'),
  ('pastirma', 'kayseri', 19, 'Kayseri Pastırmacısı', 'Çemenle kaplı, geleneksel usul pastırma.'),
  ('sucuk', 'afyonkarahisar', 11, 'Afyon Sucuk Ustası', 'Afyon''un baharatlı, yöresel sucuğu.'),
  ('ceviz', 'kahramanmaras', 8, 'Maraş Ceviz Bahçeleri', 'Doğal yetişen, kabuklu taze ceviz.')
) as o(food_slug, city_slug, amount, owner_name, description)
join foods f on f.slug = o.food_slug
join cities c on c.slug = o.city_slug
on conflict (food_id) do nothing;

insert into bid_history (food_id, city_id, bidder_name, amount, description)
select f.id, c.id, b.bidder_name, b.amount, b.description
from (values
  ('etli-ekmek', 'aksaray', 'Aksaray Sofrası', 10, null),
  ('etli-ekmek', 'karaman', 'Karaman Lezzetleri', 12, null),
  ('etli-ekmek', 'konya', 'Konya Etli Ekmek', 15, null),
  ('etli-ekmek', 'konya', 'Konya Etli Ekmek', 17, 'Konya''nın geleneksel etli ekmeğini keşfedin.')
) as b(food_slug, city_slug, bidder_name, amount, description)
join foods f on f.slug = b.food_slug
join cities c on c.slug = b.city_slug;
