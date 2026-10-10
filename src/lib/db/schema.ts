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
  // From when listings could be marked as sold; no longer used, since a sold product's listing
  // is deleted instead. Left in place so that nothing stored is lost.
  `alter table listings add column if not exists sold_at timestamptz`,
  // A listing can be in several categories. `category` keeps the first of them, as it did when
  // there was only one.
  `alter table listings add column if not exists categories text[] not null default '{}'`,
  `update listings set categories = array[category] where categories = '{}'`,
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
  // A post can be in several categories. `category` keeps the first of them, as it did when
  // there was only one.
  `alter table requests add column if not exists categories text[] not null default '{}'`,
  `update requests set categories = array[category] where categories = '{}'`,
  // The "Търся" posts each user marked with the heart.
  `create table if not exists request_favorites (
    user_id uuid not null references users (id) on delete cascade,
    request_id uuid not null references requests (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, request_id)
  )`,
  `create index if not exists request_favorites_request_id_idx on request_favorites (request_id)`,
  // Conversations between two users about a "Търся" post or a listing: the one who wrote first
  // (starter) and the one who published it (owner). `subject` keeps the title as it was, so the
  // conversation still reads well after the post or the listing is deleted (see src/lib/messages).
  `create table if not exists conversations (
    id uuid primary key default gen_random_uuid(),
    kind text not null,
    request_id uuid references requests (id) on delete set null,
    listing_id uuid references listings (id) on delete set null,
    subject text not null,
    starter_id uuid not null references users (id) on delete cascade,
    owner_id uuid not null references users (id) on delete cascade,
    created_at timestamptz not null default now(),
    last_message_at timestamptz not null default now()
  )`,
  `create index if not exists conversations_starter_id_idx on conversations (starter_id)`,
  `create index if not exists conversations_owner_id_idx on conversations (owner_id)`,
  // `read_at` is empty until the other person opens the conversation.
  `create table if not exists messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references conversations (id) on delete cascade,
    sender_id uuid not null references users (id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now(),
    read_at timestamptz
  )`,
  `create index if not exists messages_conversation_id_idx on messages (conversation_id, created_at)`,
  // Set when an administrator blocks the account: it cannot sign in, and what it published is
  // not shown to anybody but administrators, until it is unblocked.
  `alter table users add column if not exists blocked_at timestamptz`,
  // The categories a listing or a "Търся" post can be in; the administrator adds to them from the
  // panel. `value` is what is stored with a listing, `label` what people see, `icon` the name of
  // its picture (see src/data/categoryIcons.ts).
  `create table if not exists categories (
    value text primary key,
    label text not null,
    icon text not null default 'Tag',
    position integer not null default 0,
    created_at timestamptz not null default now()
  )`,
  // The six categories the site started with. Skipped where they are there already, so a
  // category the administrator renamed or removed is not brought back.
  `insert into categories (value, label, icon, position)
   select * from (values
     ('makeup', 'Грим', 'Brush', 1),
     ('skincare', 'Грижа за кожата', 'Droplet', 2),
     ('hair', 'Коса', 'Scissors', 3),
     ('nails', 'Нокти', 'Hand', 4),
     ('perfumes', 'Парфюми', 'SprayCan', 5),
     ('accessories', 'Аксесоари', 'Gem', 6)
   ) as first (value, label, icon, position)
   where not exists (select 1 from categories)`,
  // The towns the filters and the forms offer; the administrator edits the list from the panel.
  `create table if not exists cities (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    position integer not null default 0,
    created_at timestamptz not null default now()
  )`,
  `create unique index if not exists cities_name_key on cities (lower(name))`,
  // The ten towns the site started with; skipped once the table has any town.
  `insert into cities (name, position)
   select * from (values
     ('София', 1), ('Пловдив', 2), ('Варна', 3), ('Бургас', 4), ('Русе', 5),
     ('Стара Загора', 6), ('Плевен', 7), ('Сливен', 8), ('Добрич', 9), ('Шумен', 10)
   ) as first (name, position)
   where not exists (select 1 from cities)`,
  // Single values the administrator sets, by key: 'price_range' holds the ends of the price
  // slider in the filters as {"min": 0, "max": 500}.
  `create table if not exists settings (
    key text primary key,
    value jsonb not null
  )`,
  // Reports sent with the "Докладвай" button on a listing's page, for the administrator. The
  // listing's title and number are written down too, so a report still says what it was about
  // after the listing, its seller or the reporter is deleted (see src/lib/reports).
  `create table if not exists reports (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid references listings (id) on delete set null,
    listing_title text not null,
    listing_number bigint,
    seller_id uuid references users (id) on delete set null,
    reporter_id uuid references users (id) on delete set null,
    reason text not null,
    details text,
    status text not null default 'open',
    created_at timestamptz not null default now(),
    resolved_at timestamptz
  )`,
  `create index if not exists reports_status_idx on reports (status, created_at desc)`,
  // The listings each user marked with the heart.
  `create table if not exists favorites (
    user_id uuid not null references users (id) on delete cascade,
    listing_id uuid not null references listings (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, listing_id)
  )`,
  `create index if not exists favorites_listing_id_idx on favorites (listing_id)`,
];
