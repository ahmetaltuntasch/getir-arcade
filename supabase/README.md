# Getir Arcade Supabase kurulumu

## 1. Proje ve veritabanı

Yeni bir Supabase projesi oluşturun ve Supabase CLI ile giriş yaptıktan sonra projeyi bağlayın:

```sh
supabase login
supabase link --project-ref PROJECT_REF
supabase db push
```

İki migration sırasıyla temel tabloları/RLS politikalarını ve atomik `submit_arcade_run` RPC'sini kurar. Leaderboard view'ları dışarıya yalnız `rank`, `nickname` ve `xp` ya da `score` alanlarını açar.

## 2. Edge Function secret'ları

Rastgele ve uzun bir `RATE_LIMIT_SALT` üretin. Aşağıdaki değerleri yalnız Supabase secret olarak kaydedin:

```sh
supabase secrets set SUPABASE_URL=https://PROJECT_REF.supabase.co
supabase secrets set SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=SECRET_SERVICE_ROLE_KEY
supabase secrets set RATE_LIMIT_SALT=RANDOM_LONG_VALUE
```

`SUPABASE_SERVICE_ROLE_KEY` hiçbir zaman `.env.local`, Render veya `VITE_` değişkeninde bulunmamalıdır.

## 3. Function deploy

```sh
supabase functions deploy register-with-nickname
supabase functions deploy login-with-nickname
supabase functions deploy submit-run
supabase functions deploy admin-reset-password
supabase functions deploy change-password
```

## 4. İlk admin

Önce normal arayüzden bir hesap oluşturun, sonra SQL Editor'da yalnız o hesabı admin yapın:

```sql
update public.profiles set is_admin=true where nickname='yonetici_nickname';
```

Admin şifre sıfırlama function'ı hedef kullanıcıya en az 8 karakterli geçici şifre verir. Kullanıcı sonraki girişinde şifre değiştirme ekranını kapatmadan devam edemez.

## 5. Güvenlik kontrolü

- Anon kullanıcı leaderboard view'larını okuyabilmeli, `profiles`, `runs`, `xp_ledger` ve `task_progress` tablolarını okuyamamalıdır.
- Giriş yapan kullanıcı yalnız kendi satırlarını okuyabilmelidir.
- Tarayıcı bundle'ında service-role key bulunmamalıdır.
- Aynı `client_run_id` tekrar gönderildiğinde RPC `duplicate: true` dönmeli ve XP değişmemelidir.
