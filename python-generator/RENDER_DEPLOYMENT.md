# Render Deployment Guide

Complete guide for deploying the Python Generator service to Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **API Keys Ready**:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_KEY` - Your Supabase service role key
   - `GEMINI_API_KEY` - Your Google Gemini API key

## Deployment Methods

### Method 1: Using render.yaml (Recommended)

This is the easiest method - Render will automatically detect and use the `render.yaml` file.

#### Steps:

1. **Ensure `render.yaml` exists** in the `python-generator/` directory (already configured)

2. **Push to GitHub** - Make sure your latest code is pushed to your repository

3. **In Render Dashboard**:
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect and use `render.yaml`
   - Review the service configuration
   - Click "Apply"

4. **Add Environment Variables**:
   - In the service settings, go to "Environment" tab
   - Add the following environment variables:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_service_role_key
     GEMINI_API_KEY=your_gemini_api_key
     ```
   - Click "Save Changes"

5. **Deploy**:
   - Render will automatically start building and deploying
   - Monitor the build logs for progress
   - Once deployed, you'll get a URL like: `https://python-generator.onrender.com`

**Benefits:**
- ✅ Configuration is version-controlled
- ✅ Easy to update and maintain
- ✅ No manual configuration needed
- ✅ Works with simple build command (no Windows package filtering needed)

### Method 2: Manual Configuration via Dashboard

If you prefer to configure manually:

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
   - **Root Directory**: `python-generator` ⚠️ **Important!**
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt
     ```
   - **Start Command**: 
     ```bash
     python app.py
     ```
   - **Plan**: 
     - `Starter` ($7/month) - Recommended for production
     - `Free` - For testing (has limitations)

4. **Add Environment Variables**
   - Click "Advanced" → "Add Environment Variable"
   - Add each variable:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_service_role_key
     GEMINI_API_KEY=your_gemini_api_key
     PYTHON_VERSION=3.11
     ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will start building your service
   - Monitor the build logs for any issues

## Verifying Deployment

### 1. Check Service Health

```bash
curl https://your-service.onrender.com/
```

Should return:
```json
{"ok": true, "service": "python-generator"}
```

### 2. Test the Generate Endpoint

```bash
curl -X POST https://your-service.onrender.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Generate a quiz about Python programming",
    "type": "quiz",
    "bloom_level": "apply",
    "settings": {
      "num_questions": 3
    }
  }'
```

### 3. Check Logs

- Go to your service in Render Dashboard
- Click "Logs" tab
- Look for any errors or warnings
- Check both "Build Logs" and "Runtime Logs"

## Environment Variables

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API → service_role key |
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PYTHON_VERSION` | Python version to use | 3.11 |
| `PORT` | Port for the service | 8000 (auto-set by Render) |
| `HOST` | Host binding | 0.0.0.0 (auto-set by Render) |

## Troubleshooting

### Build Fails: "Module not found"

**Cause**: Dependencies not installed properly

**Solution**:
1. Check build logs - ensure all packages from `requirements.txt` are installed
2. Verify `requirements.txt` is in the `python-generator/` directory
3. Check that root directory is set to `python-generator` in Render settings

### Service Not Responding / Timeout

**Causes**:
- Free tier has 30-second request timeout
- Cold starts (service spins down after inactivity)
- Long-running requests (PDF processing + Gemini API calls)

**Solutions**:
1. **Upgrade to Starter Plan** ($7/month)
   - 90-second request timeout
   - Service stays warm
   - Better for production

2. **Optimize Requests**:
   - For large PDFs, consider processing in chunks
   - Use `gemini-1.5-flash` (already configured) for faster responses

3. **Add Health Check**:
   - The `/` endpoint serves as a health check
   - Render will ping it automatically

### "PDF processing failed" Error

**Causes**:
- PDF file corrupted or invalid
- Supabase storage access issues
- Missing `SUPABASE_KEY` or `SUPABASE_URL`

**Solutions**:
1. Verify Supabase credentials are correct
2. Check that PDF exists in Supabase storage
3. Verify bucket name matches (default: `uploadFiles`)
4. Check service logs for detailed error messages

### "Generation error" in Response

**Causes**:
- Invalid Gemini API key
- Gemini API rate limits
- Malformed prompt or response

**Solutions**:
1. Verify `GEMINI_API_KEY` is correct
2. Check Gemini API quota/limits
3. Review service logs for detailed error messages
4. The service includes fallback responses for errors

## Updating Your Next.js App

After deployment, update your Next.js environment variables:

### In Vercel (Production)

Go to your Vercel project → Settings → Environment Variables:

```
PYTHON_GENERATOR_URL=https://your-service.onrender.com/generate
```

### In Local Development (.env.local)

```bash
NEXT_PUBLIC_PYTHON_GENERATOR_URL=https://your-service.onrender.com/generate
```

## Performance Tips

1. **Use Starter Plan** ($7/month)
   - Better performance for API calls
   - Longer request timeouts
   - Service stays warm

2. **Monitor Usage**
   - Check Render dashboard for resource usage
   - Monitor API response times
   - Watch for rate limits on Gemini API

3. **Optimize PDF Processing**
   - Large PDFs take longer to process
   - Consider extracting only relevant pages if possible

4. **Enable Auto-Deploy**
   - Only deploy on push to main branch
   - Reduces unnecessary deployments

## Cost Considerations

### Free Tier
- ✅ Good for testing and development
- ⚠️ 30-second request timeout
- ⚠️ Service spins down after 15 minutes of inactivity
- ⚠️ May have build time limits
- ⚠️ Slower cold starts

### Starter Plan ($7/month)
- ✅ 90-second request timeout
- ✅ Service stays warm
- ✅ Better for production use
- ✅ More reliable performance

## Security Best Practices

1. **Never commit API keys** to your repository
2. **Use environment variables** for all sensitive data
3. **Use service role keys** for Supabase (not anon keys)
4. **Set up API rate limiting** if needed
5. **Monitor logs** for suspicious activity

## Next Steps

1. ✅ Deploy to Render using one of the methods above
2. ✅ Get your service URL from Render dashboard
3. ✅ Update `PYTHON_GENERATOR_URL` in your Next.js app
4. ✅ Test content generation from your frontend
5. ✅ Monitor logs and performance
6. ✅ Set up alerts for errors (if using Starter plan)

## Support

If you encounter issues:

1. **Check Render Build Logs** - Look for installation errors
2. **Check Render Runtime Logs** - Look for runtime errors
3. **Verify Environment Variables** - Ensure all are set correctly
4. **Test Service Directly** - Use curl/Postman to test endpoints
5. **Check Next.js API Route Logs** - Look for connection errors
6. **Review Render Documentation** - [docs.render.com](https://docs.render.com)

## Additional Resources

- [Render Documentation](https://docs.render.com)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)

