-- Productivity & Wellness Features Schema

-- Focus Sessions (Pomodoro/Forest-style)
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  session_type text not null default 'pomodoro', -- 'pomodoro', 'forest', 'custom'
  duration_minutes integer not null default 25,
  completed boolean default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  distraction_count integer default 0,
  created_at timestamptz not null default now()
);

-- Task Boards
create table if not exists public.task_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  color text default 'blue', -- color theme for the board
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.task_boards(id) on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo', -- 'todo', 'in_progress', 'completed'
  priority text default 'medium', -- 'low', 'medium', 'high'
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Wellness Habits
create table if not exists public.wellness_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  habit_type text not null, -- 'sleep', 'hydration', 'mindfulness', 'movement'
  target_value numeric, -- e.g., 8 hours sleep, 8 glasses water
  unit text, -- 'hours', 'glasses', 'minutes', 'steps'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habit Logs (daily tracking)
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.wellness_habits(id) on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  value numeric not null,
  notes text,
  created_at timestamptz not null default now(),
  unique(habit_id, log_date)
);

-- Gamification System
create table if not exists public.user_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users on delete cascade,
  total_xp integer default 0,
  level integer default 1,
  current_level_xp integer default 0,
  total_study_hours numeric default 0,
  streak_days integer default 0,
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Badges
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text, -- emoji or icon identifier
  xp_reward integer default 0,
  created_at timestamptz not null default now()
);

-- User Badges (earned)
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

-- XP Transactions (for tracking)
create table if not exists public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  amount integer not null,
  source text not null, -- 'focus_session', 'game', 'habit', 'task', 'badge'
  source_id uuid, -- reference to the source (focus_session id, task id, etc.)
  description text,
  created_at timestamptz not null default now()
);

-- Game Scores (for leaderboards - extending highscores concept)
create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  game_type text not null, -- 'clickspeed', 'memory', 'reaction', 'sequence'
  score integer not null,
  metadata jsonb, -- additional game-specific data
  created_at timestamptz default now()
);

-- Learning Analytics
create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  session_date date not null,
  duration_minutes numeric not null,
  material_id uuid references public.materials(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  study_method text, -- 'reading', 'quiz', 'flashcards', 'practice'
  retention_score numeric, -- 0-100, calculated from follow-up quizzes
  efficiency_score numeric, -- calculated metric
  created_at timestamptz not null default now()
);

-- Distraction Events (for distraction detector)
create table if not exists public.distraction_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  event_type text not null, -- 'tab_switch', 'app_switch', 'idle', 'away'
  detected_at timestamptz not null default now(),
  focus_session_id uuid references public.focus_sessions(id) on delete set null,
  metadata jsonb
);

-- Create indexes for better query performance
create index if not exists idx_focus_sessions_user_id on public.focus_sessions(user_id);
create index if not exists idx_focus_sessions_created_at on public.focus_sessions(created_at);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_board_id on public.tasks(board_id);
create index if not exists idx_habit_logs_user_id on public.habit_logs(user_id);
create index if not exists idx_habit_logs_log_date on public.habit_logs(log_date);
create index if not exists idx_game_scores_game_type on public.game_scores(game_type);
create index if not exists idx_game_scores_score on public.game_scores(score);
create index if not exists idx_learning_sessions_user_id on public.learning_sessions(user_id);
create index if not exists idx_learning_sessions_session_date on public.learning_sessions(session_date);