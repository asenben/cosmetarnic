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
];
