# Klario Deployment Guide

## Required Environment Variables

### Vercel Environment Variables

To deploy Klario to Vercel, you **must** set the following environment variables in your Vercel project:

1. **ANTHROPIC_API_KEY** (required for AI generation)
   - Get your API key from: https://console.anthropic.com/
   - In Vercel dashboard: Project Settings → Environment Variables
   - Add: `ANTHROPIC_API_KEY` = `sk-ant-...`
   - Set for: Production, Preview, Development

2. **NEXT_PUBLIC_SUPABASE_URL** (required for database)
   - Your Supabase project URL
   - Format: `https://xxxxx.supabase.co`

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (required for database)
   - Your Supabase anon/public key
   - Found in: Supabase → Project Settings → API

## Steps to Deploy

1. **Set environment variables** in Vercel:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Verify** the deployment:
   - Test site creation at `/sites/new`
   - If AI generation fails, check Vercel function logs for API key errors

## Troubleshooting

### "API key not configured" error
- Check that `ANTHROPIC_API_KEY` is set in Vercel → Environment Variables
- Ensure the key starts with `sk-ant-api03-`
- Redeploy after adding environment variables

### Sites generate but use fallback template
- The ANTHROPIC_API_KEY is either:
  - Not set in Vercel
  - Invalid/expired
  - Rate limited
- Check Vercel function logs: `vercel logs [deployment-url]`

### Demo links show 404
- Ensure RLS policies are set up in Supabase (see `supabase/schema.sql`)
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

## Supabase Setup

Run the SQL in `supabase/schema.sql` to create:
- `sites` table
- `demo_links` table
- RLS policies for public preview access
- `site-media` storage bucket

## Local Development

Create `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
```

Then:
```bash
npm install
npm run dev
```
