# 🍱 Mess Memory
React + Vite + Supabase app that reduces mess food waste (tracks **unserved food** and **plate waste** separately).

## Run locally
1. Install Node.js (LTS) from https://nodejs.org
2. `npm install`, then copy `.env.example` to `.env` and fill in your Supabase values
3. `npm run dev` → http://localhost:5173

## Supabase
1. Create a project at https://supabase.com
2. SQL Editor → paste `supabase/schema.sql` → Run (creates tables, RLS, demo data)
3. Project Settings → API: copy **Project URL** and **anon public** key into `.env` (never use the service-role key)
4. Authentication → Providers → Email: turn off "Confirm email" for quick demos

## First staff account
Sign up as a student, then in the SQL Editor run:
`update profiles set role='staff' where id=(select id from auth.users where email='YOU@EMAIL');`
Log in via **Kitchen Dashboard** on the landing page.

## Deploy
`git init && git add . && git commit -m init`, create a GitHub repo, `git remote add origin <url> && git push -u origin main`. Import the repo in Vercel, add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then Deploy (`vercel.json` handles routing).

## Test the flow
Staff: Publish today's meal → Student (other browser): eat + Regular → Staff: refresh, see expected attendance → enter kitchen data → recommendations, chart and Waste Impact update.
Remove demo data: dashboard button, or `delete from meals where is_demo;`
