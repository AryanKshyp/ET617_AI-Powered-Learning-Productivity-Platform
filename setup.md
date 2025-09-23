# Learnify — Clickstream & PDF Research App

This repository is a scaffold for **Learnify** — a Next.js + Tailwind CSS app using Supabase (PostgreSQL).
Features:
- Supabase Auth (email/password)
- Upload & read research PDFs (Supabase Storage)
- Generate 3 interactive quizzes (easy, medium, hard) using Brainstellar-sourced puzzles (paraphrased)
- Click Speed Game (10s) with visual effects and music; saves highest score
- Clickstream tracking (clicks, scrolls, load) with server-side recording (includes IP)
- Real-time dashboard with charts

**Important:** This scaffold requires you to provide Supabase credentials and a service role key.

## Setup

1. Clone / unzip:
   ```bash
   unzip learnify.zip && cd learnify
   npm install
   ```

2. Create a Supabase project at https://supabase.com

3. Add the SQL schema in `schema/clickstream.sql` using the Supabase SQL editor, and also create the `highscores` table and enable Realtime on tables.

4. Create a Storage bucket in Supabase named `pdfs`.

5. Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXTAUTH_URL=http://localhost:3000
   ```

   - **Do not** commit `SUPABASE_SERVICE_ROLE_KEY` to version control.

6. Run the dev server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

7. Visit:
   - Landing page: `/` (Learnify)
   - Login: `/login`
   - Upload/Reader: `/upload`
   - Dashboard: `/dashboard`

## Notes

- The client-side tracking hook sends structured events to `/api/track` which uses the Supabase service role key to insert server-side and capture request IP.
- The repo contains a placeholder `public/music.mp3`. Replace with a proper audio file for the click-speed game.
- Quizzes are simple interactive components with 5 questions each (easy, medium, hard) derived from Brainstellar puzzles (see brainstellar.com).
- This is a starter scaffold — you should harden auth/session handling for production and configure RLS policies on Supabase.

## Credits / Sources
- Some quiz questions are paraphrased from Brainstellar puzzles (https://brainstellar.com). See `components/quizzes.ts` for the content.

