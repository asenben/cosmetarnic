// The database tables, one statement per entry. Apply them with `npm run db:migrate`.
// Every statement is safe to run again on a database that already has the tables.
export const schema = [
  `create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    username text not null,
    email text not null,
    password_hash text not null,
    role text not null default 'user',
    created_at timestamptz not null default now()
  )`,
  // Usernames and emails are unique regardless of letter case.
  `create unique index if not exists users_username_key on users (lower(username))`,
  `create unique index if not exists users_email_key on users (lower(email))`,
  // One row per signed-in browser. Only a hash of the cookie's token is kept.
  `create table if not exists sessions (
    token_hash text primary key,
    user_id uuid not null references users (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
  )`,
  `create index if not exists sessions_user_id_idx on sessions (user_id)`,
  // Empty until the owner opens the confirmation link sent to their email; sign-in requires it.
  `alter table users add column if not exists email_verified_at timestamptz`,
  // The confirmation links that are still waiting to be opened. Only a hash of each token is kept.
  `create table if not exists email_verifications (
    token_hash text primary key,
    user_id uuid not null references users (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
  )`,
  `create index if not exists email_verifications_user_id_idx on email_verifications (user_id)`,
  // The "forgotten password" links that are still waiting to be used. Only a hash of each token is kept.
  `create table if not exists password_resets (
    token_hash text primary key,
    user_id uuid not null references users (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
  )`,
  `create index if not exists password_resets_user_id_idx on password_resets (user_id)`,
  // Asked for at sign-up. Nullable only because accounts created before these fields have none.
  `alter table users add column if not exists full_name text`,
  `alter table users add column if not exists phone text`,
  // The file name of the profile picture in the bucket (see src/lib/auth/avatar.ts), if one is set.
  `alter table users add column if not exists avatar text`,
  // The "about me" text from the profile settings.
  `alter table users add column if not exists bio text`,
  // The user's social profiles and pages on other marketplaces, by key (see src/lib/auth/profileLinks.ts).
  `alter table users add column if not exists links jsonb not null default '{}'`,
  // The town the user chose in the profile settings, if any.
  `alter table users add column if not exists city text`,
  // Whether the counts of listings, sales and favourites are shown on the user's profile.
  `alter table users add column if not exists show_stats boolean not null default true`,
  // For the list of signed-in devices in the security settings: an id to refer to a session by
  // without exposing its token hash, and the browser it was started from.
  `alter table sessions add column if not exists id uuid not null default gen_random_uuid()`,
  `create unique index if not exists sessions_id_key on sessions (id)`,
  `alter table sessions add column if not exists user_agent text`,
  // The listings published through the "Добави обява" form. `description` is HTML that was cleaned
  // on the way in, and `images` holds file names in the bucket, cover first (see src/lib/listings).
  `create table if not exists listings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    title text not null,
    brand text not null,
    category text not null,
    condition text not null,
    price numeric(10, 2) not null,
    color text,
    delivery text[] not null,
    phone text not null,
    city text not null,
    description text not null,
    images text[] not null default '{}',
    status text not null default 'active',
    created_at timestamptz not null default now()
  )`,
  `create index if not exists listings_created_at_idx on listings (created_at desc)`,
  `create index if not exists listings_user_id_idx on listings (user_id)`,
  // Who has opened each listing, one row per device, so a listing's views are counted once per
  // device however many times it is opened. `viewer` is a hash, not an address (see src/lib/listings).
  `create table if not exists listing_views (
    listing_id uuid not null references listings (id) on delete cascade,
    viewer text not null,
    created_at timestamptz not null default now(),
    primary key (listing_id, viewer)
  )`,
  // The first version counted every opening of the page in this column; listing_views replaced it.
  `alter table listings drop column if exists views`,
  // The number shown on the listing's page as its ID: 1 for the first listing published, 2 for the
  // next, and so on. A number is never given out again, even after its listing is deleted.
  `alter table listings add column if not exists number bigint generated always as identity`,
  // When the seller marked the listing as sold (its status is then 'sold'), for showing it so.
  `alter table listings add column if not exists sold_at timestamptz`,
  // The "Търся" posts: what a registered user is looking for, so that sellers can get in touch.
  // Not listings: nothing is on sale and there are no photos (see src/lib/requests).
  `create table if not exists requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    title text not null,
    brand text,
    category text not null,
    condition text not null,
    budget numeric(10, 2),
    city text not null,
    phone text not null,
    description text not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists requests_created_at_idx on requests (created_at desc)`,
  // A picture of the product wanted, if the author added one: its file name in the bucket.
  `alter table requests add column if not exists image text`,
  // The "Търся" posts each user marked with the heart.
  `create table if not exists request_favorites (
    user_id uuid not null references users (id) on delete cascade,
    request_id uuid not null references requests (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, request_id)
  )`,
  `create index if not exists request_favorites_request_id_idx on request_favorites (request_id)`,
  // The listings each user marked with the heart.
  `create table if not exists favorites (
    user_id uuid not null references users (id) on delete cascade,
    listing_id uuid not null references listings (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, listing_id)
  )`,
  `create index if not exists favorites_listing_id_idx on favorites (listing_id)`,
];
