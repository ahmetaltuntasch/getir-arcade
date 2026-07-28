# Getir Arcade Supabase kurulumu

1. Bir Supabase projesi oluşturun.
2. `supabase db push` ile migration'ı uygulayın.
3. Edge Function'ları deploy edin:
   `register-with-nickname`, `login-with-nickname`, `submit-run`, `admin-reset-password`, `change-password`.
4. Function secret olarak `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ve rastgele `RATE_LIMIT_SALT` tanımlayın.
5. `.env.example` dosyasını `.env.local` olarak kopyalayıp public URL ve anon key'i girin.

Service-role key hiçbir zaman `VITE_` değişkeninde veya tarayıcı bundle'ında bulunmamalıdır.
