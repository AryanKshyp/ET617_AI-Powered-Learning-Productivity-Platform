# Supabase Bucket Setup Instructions

## Quick Setup Guide for `uploadFiles` Bucket

Follow these steps to create the `uploadFiles` bucket in your Supabase project:

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com and log in to your account
2. Select your project (or create a new one if needed)

### Step 2: Navigate to Storage
1. In the left sidebar, click on **"Storage"**
2. You should see a list of existing buckets (if any)

### Step 3: Create the `uploadFiles` Bucket
1. Click the **"New bucket"** button (usually at the top right)
2. In the bucket creation form:
   - **Name**: Enter exactly `uploadFiles` (case-sensitive, no spaces)
   - **Public bucket**: ✅ **Check this box** (recommended for file uploads to work properly)
     - This makes files accessible via public URLs
     - If you prefer private buckets, you'll need to set up RLS policies (see below)
3. Click **"Create bucket"**

### Step 4: Verify Bucket Creation
- You should see `uploadFiles` in your bucket list
- Make sure the name matches exactly: `uploadFiles` (not `uploadfiles` or `UploadFiles`)

### Step 5: Configure Bucket Settings (Optional but Recommended)
1. Click on the `uploadFiles` bucket to open its settings
2. Verify it's set to **Public** (if you want public access)
3. Check file size limits if needed (default is usually fine)

### For Private Buckets (If you didn't check "Public bucket")

If you created a private bucket, you need to set up Row Level Security (RLS) policies:

1. Go to **SQL Editor** in Supabase dashboard
2. Run the following SQL:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploadFiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'uploadFiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploadFiles' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Troubleshooting

**If you get "Bucket not found" error:**
- Double-check the bucket name is exactly `uploadFiles` (case-sensitive)
- Make sure you're in the correct Supabase project
- Refresh the page and try again

**If you get "Permission denied" error:**
- Make sure the bucket is set to Public, OR
- If using a private bucket, ensure RLS policies are correctly set up
- Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct in `.env.local`

**If files still don't upload:**
- Check browser console for detailed error messages
- Check server logs for Supabase errors
- Verify your Supabase project is active and not paused

### After Setup

Once the bucket is created:
1. Restart your Next.js development server if it's running
2. Try uploading a PDF through the application
3. The upload should now work without the "[object Object]" error

### Additional Notes

- The `uploadFiles` bucket will store files in the format: `{userId}/{timestamp}_{filename}`
- Files are organized by user ID for better management
- Make sure you have sufficient storage quota in your Supabase plan

