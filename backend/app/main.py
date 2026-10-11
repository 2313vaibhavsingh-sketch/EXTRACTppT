import os
import glob
import uuid
import time
import shutil
import asyncio
from typing import Dict, List
from fastapi import FastAPI, BackgroundTasks, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.schemas import ConvertRequest, TaskStatusResponse
from app.converter import validate_youtube_url, LecturePDFConverter

app = FastAPI(
    title="YouTube Lecture to PDF Converter API",
    description="Extract unique presentation slides from YouTube video lectures and compile clean PDF notes.",
    version="1.0.0",
)

# Configure CORS for decoupled frontend (e.g. Vercel, Netlify) or unified origin
cors_origins_raw = os.environ.get("CORS_ORIGINS", "*")
if cors_origins_raw.strip() == "*":
    origins: List[str] = ["*"]
    allow_credentials = False
else:
    origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory Task State Registry
TASKS: Dict[str, Dict] = {}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
TEMP_DIR = os.path.join(BASE_DIR, "temp")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)


def cleanup_stale_files(max_age_seconds: int = 7200):
    """
    Cleans up old generated PDFs, previews, and temporary video artifacts older than max_age_seconds (default 2 hours).
    Prevents hosted disk volume from overflowing on servers with limited disk space.
    """
    now = time.time()
    try:
        # Clean stale outputs
        for filename in os.listdir(OUTPUT_DIR):
            file_path = os.path.join(OUTPUT_DIR, filename)
            if os.path.isfile(file_path):
                if now - os.path.getmtime(file_path) > max_age_seconds:
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass

        # Clean stale temp task folders
        for folder_name in os.listdir(TEMP_DIR):
            folder_path = os.path.join(TEMP_DIR, folder_name)
            if os.path.isdir(folder_path):
                if now - os.path.getmtime(folder_path) > max_age_seconds:
                    try:
                        shutil.rmtree(folder_path, ignore_errors=True)
                    except Exception:
                        pass
    except Exception:
        pass


def run_conversion_task(task_id: str, youtube_url: str, sample_interval: float, hash_threshold: int):
    """Background task runner for executing video download and slide extraction."""
    # Run house-keeping cleanup before processing new task
    cleanup_stale_files()

    def progress_callback(progress: float, step_status: str, message: str):
        if task_id in TASKS:
            TASKS[task_id]["progress"] = progress
            TASKS[task_id]["status"] = step_status
            TASKS[task_id]["message"] = message

    try:
        converter = LecturePDFConverter(
            task_id=task_id,
            youtube_url=youtube_url,
            sample_interval=sample_interval,
            hash_threshold=hash_threshold,
            base_dir=BASE_DIR
        )

        result = converter.process(progress_callback=progress_callback)

        TASKS[task_id].update({
            "status": "completed",
            "progress": 100.0,
            "message": f"Successfully compiled {result['slide_count']} slides into PDF!",
            "video_title": result["video_title"],
            "video_duration": result["video_duration"],
            "slide_count": result["slide_count"],
            "pdf_filename": result["pdf_filename"],
            "download_url": f"/api/download/{task_id}",
            "preview_url": f"/api/preview/{task_id}",
        })

    except Exception as e:
        TASKS[task_id].update({
            "status": "failed",
            "progress": 0.0,
            "message": "Conversion failed.",
            "error": str(e),
        })


@app.on_event("startup")
async def on_startup():
    """Initial server boot housekeeping."""
    cleanup_stale_files(max_age_seconds=3600)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "YouTube Lecture to PDF Converter API",
        "timestamp": time.time(),
        "active_tasks": len(TASKS)
    }


@app.post("/api/convert", response_model=TaskStatusResponse)
def start_conversion(request: ConvertRequest, background_tasks: BackgroundTasks):
    """
    Accepts a YouTube URL, validates it, and starts an async background pipeline
    to extract slides and generate a PDF.
    Supports all YouTube URL formats: /watch?v=, /live/, /shorts/, youtu.be/, ?si= params.
    """
    if not validate_youtube_url(request.youtube_url):
        raise HTTPException(
            status_code=400,
            detail="Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link."
        )

    task_id = str(uuid.uuid4())
    task_info = {
        "task_id": task_id,
        "status": "queued",
        "progress": 0.0,
        "message": "Task queued. Initializing YouTube pipeline...",
        "video_title": None,
        "video_duration": None,
        "slide_count": 0,
        "preview_url": None,
        "download_url": None,
        "pdf_filename": None,
        "error": None,
        "created_at": time.time(),
    }

    TASKS[task_id] = task_info

    background_tasks.add_task(
        run_conversion_task,
        task_id=task_id,
        youtube_url=request.youtube_url,
        sample_interval=request.sample_interval_sec,
        hash_threshold=request.hash_threshold
    )

    return TaskStatusResponse(**task_info)


@app.get("/api/status/{task_id}", response_model=TaskStatusResponse)
def get_task_status(task_id: str = Path(..., description="Unique task ID")):
    """Returns the current processing status and progress for a task."""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task ID not found.")

    return TaskStatusResponse(**TASKS[task_id])


@app.get("/api/download/{task_id}")
def download_pdf(task_id: str = Path(..., description="Unique task ID")):
    """Serves the generated PDF file for download."""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task ID not found.")

    task = TASKS[task_id]
    if task["status"] != "completed" or not task.get("pdf_filename"):
        raise HTTPException(status_code=400, detail="PDF is not ready or task failed.")

    pdf_filename = task["pdf_filename"]
    pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Requested PDF file missing on server.")

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=pdf_filename,
        headers={"Content-Disposition": f'attachment; filename="{pdf_filename}"'}
    )


@app.get("/api/preview/{task_id}")
def get_preview_image(task_id: str = Path(..., description="Unique task ID")):
    """Serves the preview image (first extracted slide)."""
    preview_filename = f"{task_id}_preview.jpg"
    preview_path = os.path.join(OUTPUT_DIR, preview_filename)

    if not os.path.exists(preview_path):
        raise HTTPException(status_code=404, detail="Preview thumbnail not found.")

    return FileResponse(path=preview_path, media_type="image/jpeg")


# ---------------------------------------------------------------------------
# Static frontend serving for unified / all-in-one production hosting (Docker / VPS / Render)
# ---------------------------------------------------------------------------
def resolve_frontend_dist():
    candidates = [
        os.environ.get("FRONTEND_DIST"),
        os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist")),
        os.path.abspath(os.path.join(BASE_DIR, "dist")),
        os.path.abspath(os.path.join(BASE_DIR, "frontend", "dist")),
    ]
    for c in candidates:
        if c and os.path.isdir(c) and os.path.exists(os.path.join(c, "index.html")):
            return c
    return None

FRONTEND_DIST = resolve_frontend_dist()

if FRONTEND_DIST:
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_frontend_spa(full_path: str):
        # Allow API routes to 404 naturally
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="Endpoint not found")

        # Static assets in root of dist (e.g. favicon, robots.txt, preview image)
        candidate_file = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(candidate_file):
            return FileResponse(candidate_file)

        # Fallback to SPA index.html
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)

        raise HTTPException(status_code=404, detail="Not Found")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
