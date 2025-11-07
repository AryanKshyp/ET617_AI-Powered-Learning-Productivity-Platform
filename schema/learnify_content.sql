-- Schema for courses, sections, materials, and generated items
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete set null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

-- material_type: 'pdf' | 'docx' | 'pptx' | 'txt' | 'note'
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_id uuid references public.sections(id) on delete set null,
  uploader_id uuid references auth.users on delete set null,
  title text not null,
  material_type text not null,
  file_path text, -- path in storage bucket when applicable
  content text,   -- for inline notes
  page_count integer, -- for PDFs
  file_size bigint, -- file size in bytes
  created_at timestamptz not null default now()
);

-- generated_type: 'quiz' | 'assignment' | 'summary'
create table if not exists public.generated_items (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_id uuid references public.sections(id) on delete set null,
  material_id uuid references public.materials(id) on delete cascade,
  generator text,          -- 'python-script', 'manual', etc.
  generated_type text not null,
  payload jsonb not null,  -- the generated content
  generation_settings jsonb, -- stores page range, bloom level, etc.
  created_at timestamptz not null default now()
);

-- Recommended storage buckets
-- Create buckets: 'materials' for uploads


DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'generated_items' 
        AND column_name = 'generation_settings'
    ) THEN
        ALTER TABLE public.generated_items 
        ADD COLUMN generation_settings jsonb;
        
        RAISE NOTICE 'Column generation_settings added to generated_items table';
    ELSE
        RAISE NOTICE 'Column generation_settings already exists';
    END IF;
END $$;
