# Fix "uvicorn: not found" Error on Render

## Problem

The error `/bin/sh: 1: uvicorn: not found` means that `uvicorn` wasn't installed during the build process. This typically happens when:

1. **Build command failed** - The `pip install` step failed (likely due to `pywin32`), so packages weren't installed
2. **Requirements didn't install** - Even if build appears to succeed, packages might not have been installed properly

## Solution

### Option 1: Use render.yaml (Recommended)

The `render.yaml` file is already configured with the correct build command that:
- Filters out Windows-only packages (`pywin32`, `pyreadline3`)
- Installs all dependencies including uvicorn
- Uses `python app.py` to start the service

Just deploy using the Blueprint method in Render Dashboard, and it will use the `render.yaml` configuration automatically.

### Option 2: Update Render Service Settings (Manual Configuration)

If you're configuring manually in the Render Dashboard:

1. **Go to your Render service** → **Settings** → **Build & Deploy**

2. **Update Build Command** to:
   ```bash
   pip install --upgrade pip setuptools wheel && python -c "import sys; lines = [l for l in open('requirements.txt') if not l.strip().startswith('pywin32') and not l.strip().startswith('pyreadline3') and not l.strip().startswith('#') and l.strip()]; open('requirements-clean.txt', 'w').writelines(lines)" && pip install --no-cache-dir -r requirements-clean.txt
   ```

3. **Verify Start Command** is:
   ```bash
   python app.py
   ```

4. **Clear build cache and redeploy:**
   - Click "Manual Deploy" → "Clear build cache & deploy"

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

1. **Use render.yaml** (easiest - already configured)
2. **OR Update Build Command** (see Option 2 above)
3. **Clear build cache** in Render dashboard
4. **Redeploy** the service
5. **Check build logs** - should see uvicorn installed
6. **Check deploy logs** - should see service starting successfully

## Verify Installation

After deployment, check the build logs for:
```
Collecting uvicorn==0.30.6
...
Successfully installed uvicorn-0.30.6
```

If you see this, the build succeeded. The service should start with `python app.py` which imports and runs uvicorn internally.
