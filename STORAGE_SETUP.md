# Storage Bucket Setup Guide

This application requires two storage buckets in Supabase Storage:

1. **`pdfs`** - Used for general PDF uploads (via `/api/upload`)
2. **`materials`** - Used for course materials (via `/api/materials`)

## How to Create Storage Buckets in Supabase

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project at https://supabase.com
2. Navigate to **Storage** in the left sidebar

### Step 2: Create the `pdfs` Bucket
1. Click **"New bucket"** button
2. Set the bucket name to: `pdfs`
3. Choose visibility:
   - **Public bucket**: Recommended for development (files accessible via public URL)
   - **Private bucket**: More secure, requires RLS policies for access
4. Click **"Create bucket"**

### Step 3: Create the `materials` Bucket
1. Click **"New bucket"** button again
2. Set the bucket name to: `materials`
3. Choose visibility (same as above)
4. Click **"Create bucket"**

### Step 4: Configure RLS Policies (Recommended for Production)

If you created **private buckets**, you'll need to set up Row Level Security (RLS) policies:

#### For the `pdfs` bucket:
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
```

#### For the `materials` bucket:
```sql
-- Allow authenticated users to upload materials
CREATE POLICY "Authenticated users can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials');

-- Allow authenticated users to read materials
CREATE POLICY "Authenticated users can read materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'materials');

-- Allow authenticated users to delete materials
CREATE POLICY "Authenticated users can delete materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materials');
```

## Troubleshooting

### Error: "Bucket not found"
- Make sure you've created both buckets with the exact names: `pdfs` and `materials`
- Check that the bucket names match exactly (case-sensitive)

### Error: "Permission denied"
- If using private buckets, ensure RLS policies are set up correctly
- For public buckets, make sure they're set to "Public" in Supabase dashboard
- Verify your service role key is correctly set in `.env.local`

### Files not uploading
- Check that your `.env.local` has the correct `SUPABASE_SERVICE_ROLE_KEY`
- Verify the bucket exists and is accessible
- Check browser console and server logs for detailed error messages

## Quick Verification

After creating the buckets, try uploading a file through the application. The upload should succeed if everything is configured correctly.

