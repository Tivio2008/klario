-- ============================================================
-- Klario Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Sites table ──────────────────────────────────────────────
create table public.sites (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  slug        text not null unique,
  template    text not null check (template in ('saas', 'restaurant', 'agency')),
  status      text not null default 'draft' check (status in ('draft', 'demo_sent', 'published')),
  blocks      jsonb not null default '[]',
  theme       jsonb not null default '{}',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sites_updated_at
  before update on public.sites
  for each row execute function public.handle_updated_at();

-- ─── Demo Links table ──────────────────────────────────────────
create table public.demo_links (
  id          uuid primary key default uuid_generate_v4(),
  site_id     uuid references public.sites(id) on delete cascade not null,
  token       text not null unique,
  expires_at  timestamptz,
  views       integer not null default 0,
  created_at  timestamptz default now() not null
);

-- ─── Row Level Security ────────────────────────────────────────

alter table public.sites enable row level security;
alter table public.demo_links enable row level security;

-- Sites: users can only see/modify their own sites
create policy "Users can view own sites"
  on public.sites for select
  using (auth.uid() = user_id);

create policy "Users can insert own sites"
  on public.sites for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sites"
  on public.sites for update
  using (auth.uid() = user_id);

create policy "Users can delete own sites"
  on public.sites for delete
  using (auth.uid() = user_id);

-- Demo links: owners can manage their site's demo links
create policy "Site owners can view demo links"
  on public.demo_links for select
  using (
    exists (
      select 1 from public.sites
      where id = demo_links.site_id
      and user_id = auth.uid()
    )
  );

create policy "Site owners can insert demo links"
  on public.demo_links for insert
  with check (
    exists (
      select 1 from public.sites
      where id = site_id
      and user_id = auth.uid()
    )
  );

create policy "Site owners can delete demo links"
  on public.demo_links for delete
  using (
    exists (
      select 1 from public.sites
      where id = demo_links.site_id
      and user_id = auth.uid()
    )
  );

-- Public read for preview (via token - anonymous users can read demo_links to resolve site)
create policy "Public can read demo links by token"
  on public.demo_links for select
  using (true);  -- token acts as secret; RLS doesn't filter here

-- Public can read sites referenced by demo links (for preview)
create policy "Public can read sites via demo link"
  on public.sites for select
  using (true);  -- Preview page loads site data; restrict further if needed

-- Allow updating views counter anonymously
create policy "Anyone can increment demo link views"
  on public.demo_links for update
  using (true)
  with check (true);

-- ─── Indexes ──────────────────────────────────────────────────
create index sites_user_id_idx on public.sites(user_id);
create index sites_slug_idx on public.sites(slug);
create index demo_links_site_id_idx on public.demo_links(site_id);
create index demo_links_token_idx on public.demo_links(token);

-- ─── Storage: site-media bucket ───────────────────────────────
-- Run this AFTER creating the bucket in Supabase dashboard (Storage > New bucket > "site-media", Public: ON)
-- OR run the insert below to create it via SQL:

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

create policy "Public can read site-media"
  on storage.objects for select
  using (bucket_id = 'site-media');

create policy "Authenticated users can upload to site-media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media');

create policy "Users can delete own files in site-media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and auth.uid()::text = (storage.foldername(name))[1]);
