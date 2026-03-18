-- Migration: Add HTML support for single-file generation
-- This allows storing complete HTML/CSS/JS as a single string

alter table public.sites
  add column if not exists html text,
  add column if not exists menu_html text,
  alter column blocks drop not null,
  alter column theme drop not null;

-- Update updated_at trigger to work with html changes
-- (trigger already exists, no changes needed)
