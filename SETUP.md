# Setup — Connect Maarifa to Supabase

The app is scaffolded and runs locally. To make it real, connect a Supabase project. ~15 minutes.

## 1. Create a Supabase project
1. Go to https://supabase.com → sign in → **New project**.
2. Name it `maarifa`, choose a region close to DRC (e.g. **EU (Frankfurt)** or the nearest available), set a strong DB password.
3. Wait for it to provision.

## 2. Run the database schema
1. In the Supabase dashboard → **SQL Editor** → **New query**.
2. Open [`docs/04-database-schema.sql`](./docs/04-database-schema.sql), copy **all** of it, paste, and **Run**.
3. Confirm: **Table Editor** should now show `profiles`, `publications`, `universities`, etc., and seeded categories/universities.

## 3. Create storage buckets + policies (one SQL script)
In the **SQL Editor**, paste and run [`docs/11-storage-setup.sql`](./docs/11-storage-setup.sql). It creates both buckets (`publications` private, `avatars` public) **and** their RLS policies — no manual dashboard clicking needed.
> Path convention: `publications/<user_id>/<uuid>.pdf`, `avatars/<user_id>/<filename>`.

## 4. Get your API keys
**Settings → API**. Copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ server-only, never commit)

## 5. Configure local env
Edit `.env.local` (already created with placeholders) and paste your real values. Keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local dev.

## 6. (Optional) Auth email settings
- **Authentication → Providers → Email**: enable Email. For fastest local testing you can disable "Confirm email" temporarily; re-enable before launch.
- **Authentication → URL Configuration**: set Site URL to `http://localhost:3000` (and later your production URL). Add redirect URLs for `/fr/espace` and `/en/espace`.

## 7. Run it
```bash
npm install      # if not done yet
npm run dev
```
Open http://localhost:3000 → you'll be redirected to `/fr`.

### Smoke test (Week 1 done when these pass)
- [ ] `/` redirects to `/fr`; language switcher toggles `/fr` ⇄ `/en`.
- [ ] Sign up at `/fr/inscription` → account created (check email if confirmation on).
- [ ] Log in at `/fr/connexion` → redirected to `/fr/espace`; header shows **Se déconnecter**.
- [ ] In Supabase **Table Editor → profiles**, your row exists (created by the `handle_new_user` trigger).
- [ ] Log out works.

## 8. Make yourself an admin (for Week 2 moderation)
In **SQL Editor**:
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## 9. Deploy to Vercel (when ready)
1. Push this folder to a Git repo (GitHub).
2. Vercel → **New Project** → import the repo.
3. Add the same env vars (use your **production** `NEXT_PUBLIC_SITE_URL`, e.g. `https://maarifa.vercel.app`).
4. Deploy. Update Supabase **Auth → URL Configuration** with the production URL.

---
**Next:** Week 2 of [`docs/09-roadmap.md`](./docs/09-roadmap.md) — upload form + moderation queue.
