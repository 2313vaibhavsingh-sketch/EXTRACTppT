# 📚 YouTube Lecture to PDF Converter

Extract clean, unique presentation slides from any YouTube lecture video and automatically compile them into a high-quality PDF document.

---

## ✨ Features
- ⚡ **Auto Slide Detection**: Uses OpenCV and perceptual hash comparison (pHash + dHash) to filter out static talking heads, animations, and camera noise.
- 📝 **Accumulative Blackboard / Whiteboard Settling**: Automatically detects incremental writing and saves the final, most complete version of each slide.
- 📄 **Lossless PDF Compilation**: High-resolution image processing and instant PDF generation via `img2pdf`.
- 🎨 **Modern Dark UI**: Built with React, Tailwind CSS, Lucide icons, live progress monitoring, and interactive preview cards.
- 🌐 **Ready for Cloud Hosting**: Includes multi-stage Dockerfile, Vercel SPA rules, Render blueprint, Railway config, and automatic stale file cleanup.

---

## 🚀 Quick Deployment Guide

See [DEPLOYMENT.md](file:///DEPLOYMENT.md) for detailed, step-by-step instructions.

### 1-Click Hosting Options:
- **Render / Railway (Recommended)**: Deploy using the pre-configured [Dockerfile](file:///Dockerfile) or [render.yaml](file:///render.yaml).
- **Vercel + Render**: Host frontend on Vercel with [vercel.json](file:///frontend/vercel.json) and backend on Render.
- **Docker Compose (VPS)**: Run `docker compose up -d --build`.

---

## 🛠 Local Development

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```
Backend runs at `http://localhost:8000`.

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000` (proxies `/api` requests to backend).
