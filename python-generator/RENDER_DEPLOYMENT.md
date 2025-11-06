# Render Deployment Guide

This guide will help you deploy the Python generator service to Render successfully.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com))
2. Your GitHub repository connected to Render
3. API keys ready:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (service role key)
   - `GEMINI_API_KEY`
   - `COHERE_API_KEY`

## Step-by-Step Deployment

### 1. Remove Windows-Specific Packages

The `requirements.txt` has been updated to remove:
- `pywin32` - Windows-only package that causes build failures on Linux
- `pyreadline3` - Windows-specific readline implementation

### 2. Deploy via render.yaml (Recommended - No Docker Required)

**Easiest method**: Use the `render.yaml` file in the `python-generator` directory. Render will automatically detect and use it.

1. **Ensure `render.yaml` exists** in `python-generator/` directory (already configured)
2. **Push to GitHub** - Render will detect the `render.yaml` file
3. **In Render Dashboard**:
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically configure everything from `render.yaml`
4. **Add Environment Variables** in Render dashboard (see step 4 below)
5. **Deploy** - Render will use the build/start commands from `render.yaml`

**Benefits**:
- ✅ No Docker required
- ✅ Configuration is version-controlled
- ✅ Easy to update and maintain
- ✅ Works with `python app.py` (self-contained)

### 3. Deploy via Render Dashboard (Manual Configuration)

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Select your GitHub repository
   - Choose the branch (usually `main` or `master`)

3. **Configure Service Settings**
   - **Name**: `python-generator` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., `Oregon`, `Frankfurt`)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `python-generator` (important!)
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```
     pip install --upgrade pip setuptools wheel && grep -vE "^(pywin32|pyreadline3)" requirements.txt | grep -v "^#" | grep -v "^[[:space:]]*$" > requirements-clean.txt && pip install --no-cache-dir -r requirements-clean.txt && rm requirements-clean.txt
     ```
   - **Start Command**: 
     ```
     python app.py
     ```
   - **Plan**: Choose `Starter` ($7/month) for better performance, or `Free` for testing
   
   **Note**: The build command automatically filters out Windows-only packages (`pywin32`, `pyreadline3`) during installation.

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   COHERE_API_KEY=your_cohere_api_key
   PYTHON_VERSION=3.11
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will start building your service
   - Monitor the build logs for any issues

### 3. Alternative: Use render.yaml (Infrastructure as Code)

If you prefer configuration as code:

1. The `render.yaml` file is already in `python-generator/` directory
2. In Render Dashboard:
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect and use `render.yaml`
   - Review settings and deploy

## Troubleshooting Build Issues

### Issue: "Failed to install requirements"

**Common causes:**
1. **Memory/timeout issues** - Large packages like `torch` can take time
2. **Missing system dependencies** - Some packages need system libraries
3. **Network issues** - Package downloads timing out

**Solutions:**

1. **Upgrade to Starter Plan** ($7/month)
   - More memory and CPU
   - Longer build timeouts
   - Better for heavy ML packages

2. **Optimize requirements.txt** (if needed)
   - Consider using lighter alternatives:
     - `torch` → Try `torch --index-url https://download.pytorch.org/whl/cpu` for CPU-only
     - Or use `torch==2.0.0` (older, smaller version)

3. **Install in stages** (modify build command in render.yaml)
   ```bash
   # Install core dependencies first
   pip install fastapi uvicorn supabase google-generativeai cohere
   
   # Then install heavy ML packages
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
   
   # Then install rest (filtering Windows packages)
   python -c "import sys; lines = [l for l in open('requirements.txt') if not l.strip().startswith('pywin32') and not l.strip().startswith('pyreadline3') and not l.strip().startswith('#') and l.strip()]; open('requirements-clean.txt', 'w').writelines(lines)" && pip install --no-cache-dir -r requirements-clean.txt
   ```

4. **Check build logs carefully**
   - Look for specific package installation errors
   - Some packages may need additional system dependencies

### Issue: "Service not responding" or Timeout

**Causes:**
- Free tier has 30-second request timeout
- Cold starts take time (service spins down after inactivity)

**Solutions:**
1. **Upgrade to Starter plan** - Longer timeouts
2. **Add health check endpoint** - Keep service warm
3. **Increase timeout in API route** - Already set to 5 minutes in Next.js

### Issue: "Module not found" at runtime

**Causes:**
- Package not installed
- Wrong Python version
- Import errors

**Solutions:**
1. Check build logs - ensure all packages installed
2. Verify Python version matches (3.11)
3. Test locally first with same Python version

## Verifying Deployment

1. **Check service health:**
   ```bash
   curl https://your-service.onrender.com/
   ```
   Should return: `{"ok": true, "service": "python-generator-rag"}`

2. **Test the generate endpoint:**
   ```bash
   curl -X POST https://your-service.onrender.com/generate \
     -H "Content-Type: application/json" \
     -d '{"text": "test", "type": "quiz", "bloom_level": "apply"}'
   ```

3. **Check logs in Render Dashboard:**
   - Go to your service → "Logs" tab
   - Look for any errors or warnings

## Environment Variables in Next.js

After deployment, update your Next.js environment variables:

**In Vercel (or your hosting platform):**
```
PYTHON_GENERATOR_URL=https://your-service.onrender.com/generate
```

**Or in `.env.local` for local development:**
```
NEXT_PUBLIC_PYTHON_GENERATOR_URL=https://your-service.onrender.com/generate
```

## Performance Tips

1. **Use Starter Plan** - Better performance for ML workloads
2. **Enable Auto-Deploy** - Only deploy on push to main branch
3. **Monitor Usage** - Check Render dashboard for resource usage
4. **Optimize Cold Starts** - Consider keeping service warm with scheduled pings

## Cost Considerations

- **Free Tier**: 
  - Limited to 30-second request timeout
  - Service spins down after 15 minutes of inactivity
  - May have build time limits
  
- **Starter Plan ($7/month)**:
  - 90-second request timeout
  - Service stays warm
  - Better for production use

## Next Steps

1. Deploy to Render
2. Get your service URL
3. Update `PYTHON_GENERATOR_URL` in your Next.js app
4. Test content generation
5. Monitor logs for any issues

## Support

If you encounter issues:
1. Check Render build/deploy logs
2. Check Render service logs
3. Verify all environment variables are set
4. Test the service directly with curl/Postman
5. Check Next.js API route logs for connection errors

