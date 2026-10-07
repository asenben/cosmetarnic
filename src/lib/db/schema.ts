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
];
