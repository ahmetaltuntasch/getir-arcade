# Getir Arcade'i yayınlama

Önerilen akış: `GitHub main → testler → Render otomatik deploy`.

## Render

Render'da repoyu Blueprint olarak açın; kökteki `render.yaml` build, yayın klasörü, güvenlik başlıkları ve eski oyun adreslerinin yönlendirmelerini hazırlar.

Environment bölümüne yalnız şu public değerleri ekleyin:

```text
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
```

Supabase service-role key ve `RATE_LIMIT_SALT` Render'a eklenmez. Bunlar yalnız Supabase Edge Function secret'ıdır. Ayrıntılı backend adımları `supabase/README.md` içindedir.

## Canlıya alma kontrolü

Önce yerelde:

```sh
pnpm test
pnpm run build
```

Deploy sonrasında şunları doğrulayın:

- `/` portalı açılır.
- `/games/getir-rush/`, `/games/depo-tetris/` ve `/games/televole-wars/` doğrudan açılır ve sayfa yenilenebilir.
- Eski `/src/games/.../index.html` adresleri temiz oyun adreslerine yönlenir.
- Misafir oyuncu çevrimdışı oynayabilir.
- Yeni hesap açılır, bekleyen misafir turları senkronize olur ve ortak lig görünür.
- Yanlış şifre denemeleri sekizinci başarısız denemeden sonra 15 dakika sınırlandırılır.
- Aynı turun ikinci gönderimi yeni skor veya XP üretmez.

Render ortam değişkenleri yoksa portal bilinçli olarak “Ortak lig henüz yapılandırılmadı” mesajını gösterir; backend hata veriyorsa bu metin kullanılmaz.
