from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List

class ConvertRequest(BaseModel):
    youtube_url: str = Field(..., description="YouTube video URL")
    sample_interval_sec: float = Field(default=2.0, ge=0.5, le=10.0, description="Sampling interval in seconds between frame checks")
    hash_threshold: int = Field(default=10, ge=2, le=30, description="Perceptual hash Hamming distance threshold for new slide detection")

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str  # queued, downloading, extracting, compiling, completed, failed
    progress: float  # 0.0 to 100.0
    message: str
    video_title: Optional[str] = None
    video_duration: Optional[float] = None
    slide_count: int = 0
    preview_url: Optional[str] = None
    download_url: Optional[str] = None
    pdf_filename: Optional[str] = None
    error: Optional[str] = None
    created_at: float
