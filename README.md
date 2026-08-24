# Hangi Şehrin?

> Memleketinin lezzetine sahip çık.

Türkiye'nin yemeklerinin hangi şehre ait olduğu konusunda oy verilen ve para
karşılığı "şehir sahipliği" iddiasında bulunulabilen minimal bir platform.

Next.js (App Router) + TypeScript + Tailwind CSS + Supabase ile yazıldı.

## Özellikler

- Ana sayfada tüm yemekler, önde giden şehir ve mevcut sahiplik özeti
- Her yemek için ayrı sayfa (`/food/[slug]`)
- Şehirler arası oylama (bid sisteminden bağımsız, tarayıcı başına bir oy)
- Bid / sahiplik sistemi: en yüksek teklif veren şehir + işletme, "sahip
  şehir" alanında kendini tanıtabilir
- Bid geçmişi listesi

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Supabase projesi oluştur

1. [supabase.com](https://supabase.com) üzerinden yeni bir proje oluştur.
2. Proje ayarlarından **Project URL**, **anon public key** ve
   **service_role key** değerlerini al (Settings → API).

### 3. Environment variables

`.env.example` dosyasını `.env.local` olarak kopyala ve değerleri doldur:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

`SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu tarafında (`/api/vote` ve
`/api/bid` route'larında) kullanılır, tarayıcıya asla gönderilmez.

### 4. SQL migration'ı çalıştır

Supabase Dashboard → SQL Editor içine `supabase/migrations/0001_init.sql`
dosyasının tüm içeriğini yapıştırıp çalıştır.

Bu migration şunları yapar:

- Tabloları oluşturur: `foods`, `cities`, `food_cities`, `votes`,
  `food_ownership`, `bid_history`, `pending_bids`
- Row Level Security politikalarını tanımlar
- Oy geldiğinde `food_cities.vote_count`'u otomatik güncelleyen trigger'ı
  kurar
- Başlangıç verisini (8 yemek, şehir adayları, örnek sahiplik ve bid
  geçmişi) ekler

Supabase CLI kullanıyorsan alternatif olarak:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

### 5. Geliştirme sunucusunu başlat

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresini aç.

## Proje yapısı

```
src/
  app/
    page.tsx                  → Ana sayfa (yemek listesi)
    food/[slug]/page.tsx      → Yemek detay sayfası
    api/vote/route.ts         → Oy verme endpoint'i
    api/bid/route.ts          → Teklif verme endpoint'i
  components/                 → UI bileşenleri
  lib/
    data.ts                   → Supabase okuma sorguları
    supabase/client.ts        → Tarayıcı Supabase client'ı (anon key)
    supabase/server.ts        → Sunucu client'ları (anon + service role)
    types.ts                  → Paylaşılan TypeScript tipleri
    voter.ts                  → Anonim tarayıcı kimliği (localStorage)
supabase/migrations/0001_init.sql
```

## Veri modeli ve mantık

- **Oylama**: `votes` tablosuna `(food_id, voter_id)` üzerinde unique kısıt
  var; bu, aynı tarayıcının aynı yemeğe iki kez oy vermesini engeller.
  Voter id, hesap gerektirmeden `localStorage`'da üretilir. Bir trigger,
  her yeni oyda `food_cities.vote_count`'u artırır.
- **Bid / sahiplik**: `food_ownership` tablosunda her yemek için tek bir
  satır bulunur (mevcut sahip şehir + tutar). Yeni teklif önce
  `pending_bids`'e yazılır; gerçek bir ödeme sağlayıcısı henüz
  bağlanmadığı için, mevcut teklifi geçen her teklif `/api/bid`
  tarafından anında onaylanıp `bid_history`'ye eklenir ve
  `food_ownership` güncellenir. İleride bir ödeme onayı adımı eklemek
  istersen, devreye gireceği yer burasıdır.
- `food_ownership` ve `bid_history` tablolarına public insert/update
  politikası **yok** — bu tablolar yalnızca `SUPABASE_SERVICE_ROLE_KEY`
  kullanan API route'ları üzerinden değiştirilir.

## Kapsam dışı (bilinçli olarak MVP'de yok)

- Kullanıcı hesabı / login sistemi
- Gerçek ödeme entegrasyonu (Stripe vb.)
- Gelişmiş admin paneli
- Bildirim sistemi
- Sosyal medya entegrasyonu

## Yeni yemek / şehir eklemek

`supabase/migrations/0001_init.sql` dosyasındaki seed bloklarını örnek
alarak yeni bir migration dosyası (`0002_....sql`) oluşturup Supabase'de
çalıştırman yeterli — kod tarafında herhangi bir değişiklik gerekmez.
