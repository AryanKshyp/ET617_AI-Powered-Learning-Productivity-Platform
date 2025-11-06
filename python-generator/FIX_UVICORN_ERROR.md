# Fix "uvicorn: not found" Error on Render

## Problem

The error `/bin/sh: 1: uvicorn: not found` means that `uvicorn` wasn't installed during the build process. This typically happens when:

1. **Build command failed** - The `pip install` step failed (likely due to `pywin32`), so packages weren't installed
2. **Requirements didn't install** - Even if build appears to succeed, packages might not have been installed properly

## Solution

### Option 1: Update Render Service Settings (Recommended)

If you're using the Render Dashboard (not render.yaml):

1. **Go to your Render service** → **Settings** → **Build & Deploy**

2. **Update Build Command** to:
   ```bash
   pip install --upgrade pip setuptools wheel && grep -v "^pywin32" requirements.txt | grep -v "^pyreadline3" | grep -v "^#" | grep -v "^$" > requirements-clean.txt && pip install --no-cache-dir -r requirements-clean.txt
   ```

3. **Verify Start Command** is:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port $PORT
   ```

4. **Clear build cache and redeploy:**
   - Click "Manual Deploy" → "Clear build cache & deploy"

### Option 2: Use Python Module Syntax

Alternatively, update the **Start Command** to use Python module syntax:

```bash
python -m uvicorn app:app --host 0.0.0.0 --port $PORT
```

This ensures Python can find uvicorn even if PATH issues occur.

### Option 3: Verify Build Logs

Check your Render build logs to see if:
- The build command actually ran
- Packages were installed successfully
- There were any errors during installation

Look for lines like:
```
Successfully installed fastapi-0.115.0 uvicorn-0.30.6 ...
```

If you don't see `uvicorn` in the installed packages list, the build failed.

## Quick Fix Steps

1. **Update Build Command** (see Option 1 above)
2. **Clear build cache** in Render dashboard
3. **Redeploy** the service
4. **Check build logs** - should see uvicorn installed
5. **Check deploy logs** - should see service starting successfully

## Verify Installation

After deployment, check the build logs for:
```
Collecting uvicorn==0.30.6
...
Successfully installed uvicorn-0.30.6
```

If you see this, the build succeeded. If the deploy still fails with "uvicorn: not found", use the Python module syntax in the start command.

## Alternative: Use Python -m

If the issue persists, change your **Start Command** in Render to:

```bash
python -m uvicorn app:app --host 0.0.0.0 --port $PORT
```

This explicitly tells Python to run uvicorn as a module, which is more reliable.

