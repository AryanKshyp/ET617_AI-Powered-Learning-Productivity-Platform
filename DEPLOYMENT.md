# Deployment Guide

This guide covers deploying both the Next.js frontend and the Python FastAPI backend service.

## Overview

Your application consists of two parts:
1. **Next.js Application** - Frontend (deploys to Vercel)
2. **Python FastAPI Service** - Backend RAG/Generation service (needs separate hosting)

## Part 1: Deploy Next.js to Vercel

### Prerequisites
- GitHub account (recommended) or GitLab/Bitbucket
- Vercel account (free tier available)

### Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   In Vercel dashboard, go to Project Settings → Environment Variables and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PYTHON_GENERATOR_URL=https://your-python-service-url.com/generate
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   ```
   
   **Important**: 
   - Replace `PYTHON_GENERATOR_URL` with the URL of your deployed Python service (see Part 2).
   - Replace `NEXT_PUBLIC_APP_URL` with your actual Vercel deployment URL. This ensures authentication redirects work correctly in production and don't default to localhost.

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

## Part 2: Deploy Python FastAPI Service

Vercel doesn't support Python backend services. You need to deploy the Python service separately. Here are the best options:

### Option A: Railway (Recommended - Easiest)

1. **Sign up** at [railway.app](https://railway.app) (free tier available)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (recommended) or "Empty Project"

3. **Configure the Service**
   - If using GitHub: Connect your repo, select `python-generator` folder
   - If empty project: Add the `python-generator` folder files

4. **Set Environment Variables**
   In Railway dashboard, add these variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   COHERE_API_KEY=your_cohere_api_key
   ```

5. **Configure Build Settings**
   - Set root directory: `python-generator`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

6. **Deploy**
   - Railway will auto-deploy
   - Get your service URL from the dashboard (e.g., `https://your-service.railway.app`)
   - Use this URL as `PYTHON_GENERATOR_URL` in Vercel

### Option B: Render

1. **Sign up** at [render.com](https://render.com)

2. **Create New Web Service**
   - Connect your GitHub repo
   - Set:
     - **Name**: `learnify-python-generator`
     - **Root Directory**: `python-generator`
     - **Environment**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables**
   Same as Railway (see above)

4. **Deploy**
   - Service will be available at `https://your-service.onrender.com`

### Option C: Fly.io

1. **Install Fly CLI**
   ```bash
   # Windows PowerShell
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login and Setup**
   ```bash
   fly auth login
   cd python-generator
   fly launch
   ```

3. **Configure `fly.toml`**
   ```toml
   [build]
     builder = "paketobuildpacks/builder:base"

   [env]
     PORT = "8000"

   [[services]]
     internal_port = 8000
     protocol = "tcp"
   ```

4. **Set Secrets**
   ```bash
   fly secrets set SUPABASE_URL=your_url
   fly secrets set SUPABASE_KEY=your_key
   fly secrets set GEMINI_API_KEY=your_key
   fly secrets set COHERE_API_KEY=your_key
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

### Option D: Google Cloud Run

1. **Install gcloud CLI** and authenticate
2. **Create Dockerfile** in `python-generator/`:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
   ```

3. **Deploy**
   ```bash
   gcloud run deploy learnify-generator \
     --source python-generator \
     --region us-central1 \
     --allow-unauthenticated
   ```

## Part 3: Configure Supabase Dashboard

**Critical**: Update your Supabase project settings to use your production URL:

1. Go to your Supabase Dashboard → Project Settings → Authentication → URL Configuration
2. Set **Site URL** to your production URL (e.g., `https://your-project.vercel.app`)
3. Add your production URL to **Redirect URLs** (e.g., `https://your-project.vercel.app/dashboard`)
4. Save the changes

This prevents authentication redirects from defaulting to localhost in production.

## Part 4: Update Environment Variables

After deploying the Python service, update your Vercel environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `PYTHON_GENERATOR_URL` to your deployed Python service URL
3. Ensure `NEXT_PUBLIC_APP_URL` is set to your production URL (e.g., `https://your-project.vercel.app`)
4. Redeploy your Next.js app (or wait for auto-deploy)

## Troubleshooting

### Common Issues

1. **Python service not responding**
   - Check that the service URL is correct
   - Verify all environment variables are set
   - Check service logs for errors

2. **CORS errors**
   - Add CORS middleware to your FastAPI app if needed:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   app.add_middleware(CORSMiddleware, allow_origins=["*"])
   ```

3. **Build fails on Vercel**
   - Check Node.js version (should be 18+)
   - Verify all environment variables are set
   - Check build logs for specific errors

4. **Python service timeout**
   - Some platforms have timeout limits (e.g., Render free tier: 30s)
   - Consider upgrading or using async processing for long-running tasks

5. **Authentication redirects to localhost after login**
   - Ensure `NEXT_PUBLIC_APP_URL` environment variable is set to your production URL in Vercel
   - Update Supabase Dashboard → Authentication → URL Configuration:
     - Set **Site URL** to your production URL
     - Add your production URL (e.g., `https://your-project.vercel.app/dashboard`) to **Redirect URLs**
   - Redeploy your application after making these changes

## Testing the Deployment

1. **Test Next.js app**: Visit your Vercel URL
2. **Test Python service**: 
   ```bash
   curl https://your-python-service.com/
   # Should return: {"ok": true, "service": "python-generator-rag"}
   ```
3. **Test integration**: Try generating content from your Next.js app

## Production Checklist

- [ ] All environment variables set in both services
- [ ] Python service is accessible and responding
- [ ] Next.js app can communicate with Python service
- [ ] CORS configured if needed
- [ ] Database connections working
- [ ] API keys are secure (not in code)
- [ ] Error handling and logging in place

## Cost Considerations

- **Vercel**: Free tier for Next.js (hobby projects)
- **Railway**: $5/month for hobby plan
- **Render**: Free tier available (with limitations)
- **Fly.io**: Pay-as-you-go, generous free tier
- **Cloud Run**: Pay per request, very affordable

For production, consider using Railway or Render's paid plans for better performance and reliability.

