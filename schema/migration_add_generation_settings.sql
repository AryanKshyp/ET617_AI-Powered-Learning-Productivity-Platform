-- Migration: Add generation_settings column to generated_items table
-- Run this in your Supabase SQL editor if the column doesn't exist

-- Check if column exists, if not add it
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

