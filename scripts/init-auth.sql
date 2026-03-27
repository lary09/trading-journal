-- Run this once in Neon to align Auth.js tables with our custom adapter.

alter table if exists users add column if not exists email_verified timestamptz;

create table if not exists accounts (
  user_id text not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text,
  primary key (provider, provider_account_id)
);

create table if not exists sessions (
  session_token text primary key,
  user_id text not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

create table if not exists authenticators (
  credential_id text primary key,
  user_id text not null references users(id) on delete cascade,
  provider_account_id text not null,
  credential_public_key text not null,
  counter integer not null,
  credential_device_type text not null,
  credential_backed_up boolean not null,
  transports text
);
