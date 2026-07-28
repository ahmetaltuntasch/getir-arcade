# Getir Arcade'i Render'da yayınlama

Bu proje için önerilen akış:

`Bilgisayar → GitHub main → GitHub testleri → Render otomatik deploy`

## İlk kurulum

1. GitHub'da boş bir depo oluştur. README, `.gitignore` veya lisans ekleme.
2. Bu klasörde Git deposunu başlat, ilk commit'i oluştur ve GitHub deposunu `origin` olarak ekle.
3. `main` dalını GitHub'a gönder.
4. Render ekranında **New → Blueprint** seç.
5. GitHub hesabını bağla ve oluşturduğun depoyu seç.
6. Render kökteki `render.yaml` dosyasını okuyarak ücretsiz `getir-arcade` Static Site'ını oluşturur.
7. İlk GitHub kalite kontrolü başarılı olduğunda Render yayını başlatır.

Render'da elle Static Site oluşturmak istersen kullanılacak değerler:

- Service type: `Static Site`
- Branch: `main`
- Build command: `pnpm install --frozen-lockfile && pnpm run build`
- Publish directory: `dist`
- Auto-deploy: `After CI Checks Pass`
- Rewrite: `/*` → `/index.html`

## Sonraki yayınlar

Her geliştirmeden sonra:

```sh
git add .
git commit -m "Değişikliği kısa biçimde anlat"
git push
```

GitHub testleri ve üretim derlemesi başarılı olursa Render yeni sürümü otomatik ve kesintisiz yayınlar. Test başarısızsa mevcut çalışan sürüm yayında kalır.

## Ortam değişkenleri

Supabase bağlandığında Render servisinin **Environment** bölümüne yalnızca istemcide yayınlanması güvenli `VITE_...` değerleri eklenmelidir. `SUPABASE_SERVICE_ROLE_KEY` gibi sunucu sırları Static Site'a kesinlikle eklenmemelidir; bunlar Supabase Edge Function secret olarak kalmalıdır.

## Elle yeniden yayınlama

Render servisinde **Manual Deploy → Deploy latest commit** seçeneği son GitHub commit'ini yeniden yayınlar. Normal kullanımda buna gerek yoktur.

## Kontrol adresleri

Yayın tamamlandıktan sonra şu üç adres açılmalıdır:

- `/`
- `/src/games/getir-rush/index.html`
- `/src/games/depo-tetris/index.html`
