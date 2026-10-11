# 🚀 Hosting & Deployment Guide

This guide explains how to host your **YouTube Lecture to PDF Converter** application. Everything is pre-configured and ready for one-click hosting.

---

## 📋 Table of Contents
1. [Prerequisites: Push to GitHub](#prerequisites-push-to-github)
2. [Option 1: All-In-One Docker Deployment (Recommended - Easiest & Free)](#option-1-all-in-one-docker-deployment-recommended)
   - [Deploying on Render](#deploying-on-render)
   - [Deploying on Railway](#deploying-on-railway)
3. [Option 2: Decoupled Deployment (Vercel + Render)](#option-2-decoupled-deployment-vercel--render)
   - [Step A: Backend on Render](#step-a-backend-on-render)
   - [Step B: Frontend on Vercel](#step-b-frontend-on-vercel)
4. [Option 3: VPS Deployment (DigitalOcean / EC2 / Hetzner)](#option-3-vps-deployment-docker-compose)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Local Production Test](#testing-production-locally)

---

## Prerequisites: Push to GitHub

Before deploying, commit and push your code to your GitHub repository:

```bash
git init
git add .
git commit -m "Configure project for hosting"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

*(Note: The root `.gitignore` is already configured to exclude heavy temporary video and PDF files, protecting GitHub's 100MB file limit).*

---

## Option 1: All-In-One Docker Deployment (Recommended)

In this approach, the multi-stage [Dockerfile](file:///Dockerfile) automatically:
1. Builds the React frontend with Node.js.
2. Installs Python 3.11, `ffmpeg` (required for YouTube video extraction), and OpenCV.
3. Serves both the interactive frontend UI and the FastAPI backend together from a single service!
- ✅ **No CORS configuration needed**
- ✅ **Runs on a single free-tier container**
- ✅ **Zero configuration required**

### Deploying on Render

1. Go to [Render.com](https://render.com) and sign in.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Select **Docker** as the Runtime (or select Blueprint to use `render.yaml`).
5. Settings:
   - **Name**: `youtube-lecture-pdf`
   - **Region**: Choose the closest region (e.g. Frankfurt, Oregon, Singapore)
   - **Branch**: `main`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/api/health`
6. Click **Deploy Web Service**!
   Render will build the container and provide you with a live URL (e.g., `https://youtube-lecture-pdf.onrender.com`).

---

### Deploying on Railway

1. Go to [Railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select this repository.
4. Railway will automatically detect the [Dockerfile](file:///Dockerfile) and [railway.json](file:///railway.json).
5. In **Settings** -> **Networking**, click **Generate Domain**.
6. That's it! Your app will be live with full SSL enabled.

---

## Option 2: Decoupled Deployment (Vercel + Render)

If you prefer hosting the React frontend on **Vercel** and the Python API on **Render**:

### Step A: Backend on Render
1. Go to [Render.com](https://render.com) -> **New Web Service**.
2. Select your repository.
3. Choose **Docker** environment.
4. Set Environment Variables:
   - `CORS_ORIGINS`: `*` (or your future Vercel frontend URL)
5. Deploy and copy your backend URL (e.g., `https://my-backend-api.onrender.com`).

### Step B: Frontend on Vercel
1. Go to [Vercel.com](https://vercel.com) and log in.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. In the project setup:
   - **Root Directory**: Click edit and select `frontend`.
   - **Framework Preset**: `Vite` (auto-detected).
   - **Environment Variables**:
     - Key: `VITE_API_URL`
     - Value: `https://my-backend-api.onrender.com` (your Render backend URL from Step A)
5. Click **Deploy**. Vercel uses [frontend/vercel.json](file:///frontend/vercel.json) to handle SPA routing automatically.

---

## Option 3: VPS Deployment (Docker Compose)

To host on an Ubuntu/Debian VPS (such as DigitalOcean droplet, Hetzner, AWS EC2, Linode):

1. Install Docker and Docker Compose on your server:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-v2
   ```

2. Clone your repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

3. Launch with Docker Compose in background:
   ```bash
   docker compose up -d --build
   ```

4. The app is now running on port `8000`. You can configure Nginx or Caddy as a reverse proxy with Let's Encrypt SSL:
   ```nginx
   server {
       server_name yourdomain.com;
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_read_timeout 600s;
           proxy_send_timeout 600s;
       }
   }
   ```

---

## Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port on which the FastAPI server listens (automatically set by Render / Railway). |
| `HOST` | `0.0.0.0` | Bind host address. |
| `CORS_ORIGINS` | `*` | Allowed CORS origins for external frontends (e.g. `https://my-app.vercel.app`). |
| `VITE_API_URL` | `""` *(empty)* | Frontend setting: Base URL of backend API when frontend is hosted separately on Vercel/Netlify. |

---

## Testing Production Locally

To preview the production build locally before hosting:

```bash
# 1. Build Frontend
cd frontend
npm run build
cd ..

# 2. Run Backend with production static mounting
cd backend
python -m app.main
```

Then open `http://localhost:8000` in your browser. Both the React UI and API conversion pipeline will run together!
