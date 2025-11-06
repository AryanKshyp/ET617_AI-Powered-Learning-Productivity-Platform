# Docker-Based Deployment on Render

Since Render detects your `Dockerfile` and uses Docker-based deployment, all configuration comes from the Dockerfile itself.

## How Render Uses Docker

When Render detects a `Dockerfile`:
- ✅ **No Build Command** needed - Dockerfile handles installation
- ✅ **No Start Command** needed - Dockerfile CMD handles startup
- ✅ **PORT environment variable** is automatically set by Render

## Dockerfile Configuration

The Dockerfile is configured to:

1. **Filter out Windows packages** during build:
   ```dockerfile
   RUN grep -v "^pywin32" requirements.txt | \
       grep -v "^pyreadline3" | \
       grep -v "^#" | \
       grep -v "^$" > requirements-clean.txt || true
   ```

2. **Install all dependencies** including uvicorn:
   ```dockerfile
   RUN pip install --no-cache-dir -r requirements-clean.txt
   ```

3. **Start the application** using Python module syntax:
   ```dockerfile
   CMD python -m uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}
   ```

## Why "uvicorn: not found" Happened

If you see this error, it means:
1. The `pip install` step in the Dockerfile **failed** (likely due to `pywin32`)
2. Packages weren't installed, so `uvicorn` doesn't exist
3. The CMD step tries to run `uvicorn` but can't find it

## Fix

The Dockerfile now:
1. ✅ Filters out `pywin32` and `pyreadline3` before installation
2. ✅ Uses `python -m uvicorn` (more reliable than just `uvicorn`)
3. ✅ Reads `$PORT` from environment variable (set by Render)

## Deploy Steps

1. **Commit and push** your updated Dockerfile:
   ```bash
   git add python-generator/Dockerfile
   git commit -m "Fix Dockerfile: Filter Windows packages, use python -m uvicorn"
   git push
   ```

2. **In Render Dashboard:**
   - Go to your service
   - Click "Manual Deploy" → "Clear build cache & deploy"
   - This forces a fresh build with the updated Dockerfile

3. **Monitor build logs:**
   - Check that `requirements-clean.txt` is created
   - Verify `uvicorn` is installed: Look for "Successfully installed uvicorn"
   - Check that the service starts without "uvicorn: not found" error

## Verify Build Success

In the build logs, you should see:
```
Step 6/8 : RUN pip install --no-cache-dir -r requirements-clean.txt
...
Successfully installed fastapi-0.115.0 uvicorn-0.30.6 ...
```

Then in deploy logs:
```
python -m uvicorn app:app --host 0.0.0.0 --port 8000
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Troubleshooting

### Build Fails with "pywin32" Error
- **Cause**: Old requirements.txt still has pywin32
- **Fix**: The Dockerfile now filters it out automatically
- **Action**: Clear build cache and redeploy

### "uvicorn: not found" at Runtime
- **Cause**: Build step failed, packages weren't installed
- **Fix**: Dockerfile now uses `python -m uvicorn` which is more reliable
- **Action**: Check build logs to see why pip install failed

### Port Binding Issues
- **Cause**: Hardcoded port instead of using $PORT
- **Fix**: Dockerfile now uses `${PORT:-8000}` (defaults to 8000 if PORT not set)
- **Action**: Render automatically sets PORT, should work as-is

## Environment Variables

Render will automatically set:
- `PORT` - The port your service should listen on (usually 10000 for free tier)

You still need to set in Render dashboard:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GEMINI_API_KEY`
- `COHERE_API_KEY`

These are read by your app.py at runtime.

## Notes

- The Dockerfile uses **shell form** CMD to allow `${PORT}` variable substitution
- `python -m uvicorn` is more reliable than calling `uvicorn` directly
- The build process filters Windows packages automatically, so even if requirements.txt has them, they won't break the build

