# Supabase schema — SocialConnect (VegaStack assessment)

This document maps [NextJS Intern Technical Assessment R1](https://docs.vegastack.com/interview-resources-external/nextjs-intern-technical-assessment-r1) data requirements to PostgreSQL tables in Supabase. Use the SQL Editor (or migrations) to apply.

Assumptions:

- **Auth**: Supabase Auth owns `auth.users`. App user identity is `auth.users.id` (`uuid`).
- **Public profile row**: `public.profiles` mirrors/extends the auth user for API fields (username, names, bio, counts, etc.).
- **Optional features** (follow system) are included so you can enable them without another migration pass.

---

## Entity overview

| Table      | Purpose                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `profiles` | Username, names, bio, avatar URL, stats; FK to `auth.users`               |
| `posts`    | Text (≤280), optional image URL, author, soft-delete, denormalized counts |
| `likes`    | User likes on posts (unique per user per post)                            |
| `comments` | Comments on posts; author FK to profiles                                  |
| `follows`  | Optional: follower / following relationship                               |

---

## 1. `public.profiles`

Aligns with registration (`email`, `username`, `password` via Auth) and profile CRUD (`bio`, `avatar_url`, `website`, `location`), plus listing/stats.

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text not null,
  first_name text,
  last_name text,
  bio text,
  avatar_url text,
  website text,
  location text,
  last_login_at timestamptz,
  posts_count integer not null default 0,
  follower_count integer not null default 0,
  following_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_len check (
    char_length(username) between 3 and 30
  ),
  constraint profiles_username_format check (
    username ~ '^[a-zA-Z0-9_]+$'
  ),
  constraint profiles_bio_len check (
    bio is null or char_length(bio) <= 160
  )
);

create unique index profiles_username_lower_idx
  on public.profiles (lower(username));

create index profiles_created_at_idx on public.profiles (created_at desc);
```

**Username uniqueness**: unique index on `lower(username)` enforces case-insensitive uniqueness (adjust if you want case-sensitive).

---

## 2. `public.posts`

Matches Post model: content ≤280, optional `image_url`, `is_active`, denormalized `like_count` / `comment_count`, timestamps.

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  image_url text,
  is_active boolean not null default true,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_content_len check (char_length(content) <= 280)
);

create index posts_author_created_idx
  on public.posts (author_id, created_at desc);

create index posts_feed_idx
  on public.posts (is_active, created_at desc)
  where is_active = true;
```

**Keeping `posts_count` in sync**: increment/decrement `profiles.posts_count` in application code or DB triggers when posts are inserted/deleted (or only when `is_active` flips, if you count only active posts—pick one rule and stick to it).

---

## 3. `public.likes`

```sql
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_unique_user_post unique (post_id, user_id)
);

create index likes_post_idx on public.likes (post_id);
create index likes_user_idx on public.likes (user_id);
```

**Keeping `like_count`**: on insert/delete into `likes`, update `posts.like_count` (trigger or transactional RPC from the app).

---

## 4. `public.comments`

```sql
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_post_created_idx
  on public.comments (post_id, created_at asc);
```

**Keeping `comment_count`**: mirror the like pattern on insert/delete.

---

## 5. `public.follows` (optional assessment feature)

```sql
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_no_self check (follower_id <> following_id),
  constraint follows_unique_pair unique (follower_id, following_id)
);

create index follows_follower_idx on public.follows (follower_id);
create index follows_following_idx on public.follows (following_id);
```

**Profile counts**: update `follower_count` / `following_count` on insert/delete (trigger or app).

---

## Row Level Security (RLS)

Enable RLS on every public table, then add policies. Typical patterns:

- **`profiles`**: users can read all profiles (for public listing/feed authors) or restrict as you prefer; users can `insert`/`update` only where `auth.uid() = id`.
- **`posts`**: `select` for active posts (and own inactive); `insert` where `author_id = auth.uid()`; `update`/`delete` own rows only.
- **`likes` / `comments`**: `insert` authenticated; `delete` own rows; `select` as needed for feeds.
- **`follows`**: `insert`/`delete` where `follower_id = auth.uid()`; `select` for followers/following lists.

Exact policies depend on whether posts are “public to all authenticated users” vs “public on the internet.” The assessment mentions a public chronological feed—usually `select` on active posts is allowed to authenticated users (or everyone via anon, if you expose that).

Example starter for `profiles`:

```sql
alter table public.profiles enable row level security;

create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

Repeat `enable row level security` + policies for `posts`, `likes`, `comments`, `follows`.

---

## Storage (avatars & post images)

Assessment: JPEG/PNG, max 2MB; upload to **Supabase Storage**; store URL in `profiles.avatar_url` / `posts.image_url`.

1. Create buckets (e.g. `avatars`, `post-images`).
2. Add storage policies so authenticated users can upload to their folder (e.g. `avatars/{user_id}/...`) and public read if URLs are public.

### `post-images` bucket (used by the app for post composer)

The app uploads to path `{auth.uid()}/{uuid}.jpg|png` and stores `getPublicUrl` in `posts.image_url`.

Run in SQL Editor (adjust if your project already defines these policies):

```sql
-- Public bucket so getPublicUrl works for the feed
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  2097152,
  array['image/jpeg', 'image/png']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS on storage.objects is enabled by default
create policy "Post images are readable"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Users upload post images to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own post images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own post images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

If a policy name already exists, drop it or rename. The API only accepts `image_url` values under  
`{SUPABASE_URL}/storage/v1/object/public/post-images/...`.

### 403: `new row violates row-level security policy` on upload

That response comes from **Storage RLS** on `storage.objects`, not from your Next.js API. The JWT is valid (`authenticated`), but there is **no matching INSERT policy** for your bucket id, or `bucket_id` in the policy does not match the real bucket id (e.g. you use `social images` but policies still say `post-images`).

Set in app env (optional): `NEXT_PUBLIC_SUPABASE_POST_IMAGES_BUCKET` to your exact bucket id so uploads and API URL checks stay in sync.

**Example** if your bucket id is literally `social images` (path prefix `userId/filename`):

```sql
-- SELECT: public read (bucket must be public in Dashboard, or tighten this)
create policy "social images read"
  on storage.objects for select
  using (bucket_id = 'social images');

-- INSERT: only into own folder (first path segment = auth.uid())
create policy "social images insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'social images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "social images update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'social images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "social images delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'social images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

If Postgres reports **policy already exists**, `drop policy "policy_name" on storage.objects;` first, or pick a new policy name. Prefer renaming the bucket to **`social-images`** (no spaces) in Dashboard and using the same string in env and policies to avoid `%20` in URLs.

### Profile photos (avatars) and the same bucket as posts

The app uploads avatars to **`NEXT_PUBLIC_SUPABASE_POST_IMAGES_BUCKET`** by default (same as post images, e.g. **`social images`**). Path shape is still `{auth.uid()}/{uuid}.jpg|png`, so your existing Storage policies for that bucket already apply—no second bucket required.

Optional: set **`NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET`** only if you want profile images in a different bucket than posts.

Dedicated **`avatars`** bucket (only if you do not share the post bucket):

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Triggers (recommended)

- **`updated_at`**: reuse a generic `set_updated_at()` trigger on `profiles`, `posts`, `comments`.
- **Counts**: optional triggers on `likes`, `comments`, `posts`, `follows` to maintain denormalized counters and avoid drift.

---

## Registration flow vs `profiles`

After `signUp`, insert one row into `public.profiles` with `id = user.id`, `email`, `username`, and optionally `first_name` / `last_name` if you collect them on register. If email confirmation delays the session, handle insert via a trigger on `auth.users` or a server route with service role—whichever matches your Auth settings.

---

## Checklist vs spec

| Requirement                                                 | Table / notes                             |
| ----------------------------------------------------------- | ----------------------------------------- |
| Register: email, username, password                         | Auth + `profiles`                         |
| first_name, last_name                                       | `profiles`                                |
| last login                                                  | `profiles.last_login_at` (set on login)   |
| Profile: bio, avatar_url, website, location                 | `profiles`                                |
| posts_count on profile                                      | `profiles.posts_count` (keep in sync)     |
| Post: content 280, image_url, author, timestamps, is_active | `posts`                                   |
| like_count, comment_count                                   | `posts` + triggers or transactions        |
| Likes / comments                                            | `likes`, `comments`                       |
| Follow / unfollow                                           | `follows` (optional)                      |
| Personalised feed                                           | Query `posts` (optionally join `follows`) |

This file is reference-only; run SQL in Supabase and adjust naming/constraints to match your implemented API routes.

<!-- SQL COMMAND -->

-- Tables
create table public.profiles (
id uuid primary key references auth.users (id) on delete cascade,
email text,
username text not null,
first_name text,
last_name text,
bio text,
avatar_url text,
website text,
location text,
last_login_at timestamptz,
posts_count integer not null default 0,
follower_count integer not null default 0,
following_count integer not null default 0,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
constraint profiles_username_len check (char_length(username) between 3 and 30),
constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_]+$'),
constraint profiles_bio_len check (bio is null or char_length(bio) <= 160)
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));
create index profiles_created_at_idx on public.profiles (created_at desc);

create table public.posts (
id uuid primary key default gen_random_uuid(),
author_id uuid not null references public.profiles (id) on delete cascade,
content text not null,
image_url text,
is_active boolean not null default true,
like_count integer not null default 0,
comment_count integer not null default 0,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
constraint posts_content_len check (char_length(content) <= 280)
);

create index posts_author_created_idx on public.posts (author_id, created_at desc);
create index posts_feed_idx on public.posts (is_active, created_at desc) where is_active = true;

create table public.likes (
id uuid primary key default gen_random_uuid(),
post_id uuid not null references public.posts (id) on delete cascade,
user_id uuid not null references public.profiles (id) on delete cascade,
created_at timestamptz not null default now(),
constraint likes_unique_user_post unique (post_id, user_id)
);

create index likes_post_idx on public.likes (post_id);
create index likes_user_idx on public.likes (user_id);

create table public.comments (
id uuid primary key default gen_random_uuid(),
post_id uuid not null references public.posts (id) on delete cascade,
author_id uuid not null references public.profiles (id) on delete cascade,
content text not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
);

create index comments_post_created_idx on public.comments (post_id, created_at asc);

create table public.follows (
id uuid primary key default gen_random_uuid(),
follower_id uuid not null references public.profiles (id) on delete cascade,
following_id uuid not null references public.profiles (id) on delete cascade,
created_at timestamptz not null default now(),
constraint follows_no_self check (follower_id <> following_id),
constraint follows_unique_pair unique (follower_id, following_id)
);

create index follows_follower_idx on public.follows (follower_id);
create index follows_following_idx on public.follows (following_id);

-- RLS: profiles (minimum so client sign-up insert works)
alter table public.profiles enable row level security;

create policy "Profiles are readable by authenticated users"
on public.profiles for select to authenticated using (true);

create policy "Users insert own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "Users update own profile"
on public.profiles for update to authenticated
using (auth.uid() = id) with check (auth.uid() = id);

-- Enable RLS on other tables — add policies before using from the client
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;

-- Without these, API calls return: new row violates row-level security policy for table "posts"
-- Run after the ALTERs above (drop policies first if names conflict).

-- posts
create policy "posts_select_active_or_own"
  on public.posts for select
  to authenticated
  using (is_active = true or author_id = auth.uid());

create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- likes: SELECT must allow reading all like rows for posts on the feed so the API can
-- compute totals (posts.like_count is not updated unless you add DB triggers).
-- If you created "likes_select_own" earlier, drop it first:
-- drop policy if exists "likes_select_own" on public.likes;
create policy "likes_select_authenticated"
  on public.likes for select
  to authenticated
  using (true);

create policy "likes_insert_own"
  on public.likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "likes_delete_own"
  on public.likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- follows
create policy "follows_select_as_follower"
  on public.follows for select
  to authenticated
  using (auth.uid() = follower_id);

create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

-- comments (list on post thread; counts on feed)
create policy "comments_select_authenticated"
  on public.comments for select
  to authenticated
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);
