import os
import re
import glob
import shutil
import time
import logging
from typing import Dict, Any, List, Optional, Tuple
import cv2
from PIL import Image
import imagehash
import img2pdf
import yt_dlp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("youtube_pdf_converter")

# Broad regex — supports watch, live, shorts, embed, youtu.be, with optional ?si= or other params
YOUTUBE_URL_REGEX = re.compile(
    r'(https?://)?(www\.)?(youtube\.com/(watch|live|embed|v|shorts|e)/|youtu\.be/)'
)

def validate_youtube_url(url: str) -> bool:
    """Validates if the provided string is a recognizable YouTube URL.
    Supports formats: /watch?v=, /live/, /shorts/, /embed/, youtu.be/, ?si= params, etc.
    Deep validation (private/unavailable video) is handled by yt-dlp at download time.
    """
    if not url or len(url.strip()) < 10:
        return False
    u = url.strip()
    # Accept any youtube.com or youtu.be URL
    return bool(YOUTUBE_URL_REGEX.search(u)) or 'youtube.com' in u or 'youtu.be' in u

def clean_filename(title: str) -> str:
    """Sanitizes video title for safe file naming."""
    clean = re.sub(r'[^\w\s-]', '', title).strip()
    return re.sub(r'[-\s]+', '_', clean)[:50] or "lecture_slides"

class LecturePDFConverter:
    def __init__(self, task_id: str, youtube_url: str, sample_interval: float = 2.0, hash_threshold: int = 10, base_dir: str = "."):
        self.task_id = task_id
        self.youtube_url = youtube_url.strip()
        self.sample_interval = sample_interval
        self.hash_threshold = hash_threshold
        
        self.temp_dir = os.path.join(base_dir, "temp", task_id)
        self.output_dir = os.path.join(base_dir, "output")
        self.slides_dir = os.path.join(self.temp_dir, "slides")
        
        os.makedirs(self.slides_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)

    def process(self, progress_callback=None) -> Dict[str, Any]:
        """
        Executes the 5-step lecture to PDF processing pipeline:
        1. Download / Stream video info via yt-dlp
        2. Frame sampling with OpenCV
        3. Slide deduplication via ImageHash perceptual hashing
        4. PDF compilation via img2pdf
        5. Temp directory cleanup
        """
        try:
            # Step 1: Download / Stream Video
            if progress_callback:
                progress_callback(10.0, "fetching_info", "Fetching YouTube lecture metadata...")
            
            video_path, title, duration = self._download_video(progress_callback)
            
            if progress_callback:
                progress_callback(25.0, "extracting", f"Processing video stream: '{title}'...")

            # Step 2 & 3: Frame Sampling and Perceptual Hash Filtering
            slide_paths = self._extract_unique_slides(video_path, duration, progress_callback)
            
            if not slide_paths:
                raise Exception("No readable frames found in the video stream.")

            # Step 4: PDF Compilation
            if progress_callback:
                progress_callback(85.0, "compiling", f"Compiling {len(slide_paths)} unique slides into PDF...")
            
            pdf_filename = f"{clean_filename(title)}_{self.task_id[:8]}.pdf"
            pdf_path = os.path.join(self.output_dir, pdf_filename)
            preview_filename = f"{self.task_id}_preview.jpg"
            preview_path = os.path.join(self.output_dir, preview_filename)

            self._compile_pdf(slide_paths, pdf_path, preview_path)

            if progress_callback:
                progress_callback(100.0, "completed", f"PDF successfully created with {len(slide_paths)} slides!")

            return {
                "success": True,
                "video_title": title,
                "video_duration": duration,
                "slide_count": len(slide_paths),
                "pdf_filename": pdf_filename,
                "pdf_path": pdf_path,
                "preview_filename": preview_filename,
            }

        except Exception as e:
            logger.error(f"Task {self.task_id} failed: {str(e)}", exc_info=True)
            raise e
        finally:
            self._cleanup()

    def _download_video(self, progress_callback=None) -> Tuple[str, str, float]:
        """Downloads high-definition video stream with concurrent fragments and real-time progress hook."""
        
        def download_progress_hook(d):
            if d.get('status') == 'downloading' and progress_callback:
                total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                downloaded = d.get('downloaded_bytes', 0)
                if total > 0:
                    pct = 5.0 + 20.0 * (downloaded / total)
                    speed_mb = (d.get('speed') or 0) / (1024 * 1024)
                    progress_callback(
                        round(pct, 1), "downloading",
                        f"Downloading HD video stream: {downloaded/(1024*1024):.1f}MB / {total/(1024*1024):.1f}MB ({speed_mb:.1f} MB/s)"
                    )

        ydl_opts = {
            # Prefer 720p HD video-only stream: crystal clear text quality, 4x smaller file size, superfast download
            'format': 'bestvideo[height<=720][ext=mp4]/bestvideo[height<=720]/best[height<=720]/best',
            'outtmpl': os.path.join(self.temp_dir, 'lecture.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'concurrent_fragment_downloads': 5,
            'progress_hooks': [download_progress_hook],
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                if progress_callback:
                    progress_callback(5.0, "downloading", "Connecting to YouTube stream...")

                info = ydl.extract_info(self.youtube_url, download=False)
                title = info.get('title', 'Lecture Video')
                duration = info.get('duration', 0)

                ydl.download([self.youtube_url])
                
                # Locate downloaded file
                downloaded_files = glob.glob(os.path.join(self.temp_dir, 'lecture.*'))
                if not downloaded_files:
                    raise Exception("Failed to locate downloaded video file.")
                
                return downloaded_files[0], title, float(duration)

            except yt_dlp.utils.DownloadError as de:
                raise Exception(f"YouTube Download Error: {str(de)}")
            except Exception as e:
                raise Exception(f"Error extracting video metadata: {str(e)}")

    def _extract_unique_slides(self, video_path: str, duration: float, progress_callback=None) -> List[str]:
        """
        ACCUMULATIVE SLIDE DETECTION WITH IN-PLACE REPLACEMENT & HD QUALITY:
        
        1. Stability Filter: Fine 1.0s scan. Waits for `sample_interval` sec of stability.
        2. In-Place Update (Same Slide Progressive Writing):
           If the distance between current hash and `last_saved_hash` is moderate
           (i.e. < NEW_SLIDE_THRESHOLD), it means the teacher is writing more on the SAME slide/board!
           Instead of appending a new slide, we OVERWRITE the last saved slide image with the newer,
           more complete version!
        3. Lossless HD Image Saving: Saved as 100% crisp PNG files.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception("Unable to open video file for processing.")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if not fps or fps <= 0:
            fps = 30.0

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        INTERNAL_SCAN_INTERVAL_SEC = max(1.0, min(3.0, self.sample_interval))
        scan_step = max(1, int(fps * INTERNAL_SCAN_INTERVAL_SEC))
        stability_needed = max(2, int(self.sample_interval / INTERNAL_SCAN_INTERVAL_SEC))

        STABILITY_THRESHOLD = 5
        NEW_SLIDE_THRESHOLD = max(16, self.hash_threshold + 6)

        slide_paths = []
        last_saved_hash = None
        candidate_hash = None
        stable_count = 0
        saved_current_candidate = False
        slide_counter = 0

        logger.info(
            f"Ultra-Fast HD Slide Detection — FPS={fps:.1f}, TotalFrames={total_frames}, "
            f"ScanStep={scan_step} ({INTERNAL_SCAN_INTERVAL_SEC}s), "
            f"StabilityNeeded={stability_needed} scans ({self.sample_interval}s), "
            f"NewSlideThreshold={NEW_SLIDE_THRESHOLD}"
        )

        # FAST SEEKING LOOP: Jumps directly to sample frames instead of decoding every single frame
        for current_frame in range(0, total_frames, scan_step):
            cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
            ret, frame = cap.read()
            if not ret:
                break

            if progress_callback and total_frames > 0:
                pct = 25.0 + 65.0 * (current_frame / total_frames)
                progress_callback(
                    round(pct, 1), "extracting",
                    f"Scanning HD frame {current_frame}/{total_frames} — "
                    f"{len(slide_paths)} complete slides captured..."
                )

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_frame)

            # Crop 5% top and bottom to ignore video player bars/timestamps
            w, h = pil_img.size
            crop_box = (0, int(h * 0.05), w, int(h * 0.95))
            cropped_img = pil_img.crop(crop_box)

            # Compute dual hashes (phash + dhash) for accurate layout comparison
            curr_phash = imagehash.phash(cropped_img)
            curr_dhash = imagehash.dhash(cropped_img)

            if candidate_hash is None:
                candidate_hash = (curr_phash, curr_dhash)
                candidate_pil = pil_img
                stable_count = 1
                saved_current_candidate = False
            else:
                diff_p = curr_phash - candidate_hash[0]
                diff_d = curr_dhash - candidate_hash[1]
                diff_from_candidate = (diff_p + diff_d) // 2

                if diff_from_candidate <= STABILITY_THRESHOLD:
                    stable_count += 1
                    candidate_pil = pil_img  # update to latest stable version

                    if stable_count >= stability_needed and not saved_current_candidate:
                        if last_saved_hash is None:
                            # First slide ever — save as lossless HD PNG
                            slide_counter += 1
                            slide_path = os.path.join(self.slides_dir, f"slide_{slide_counter:04d}.png")
                            candidate_pil.save(slide_path, "PNG")
                            slide_paths.append(slide_path)
                            last_saved_hash = (curr_phash, curr_dhash)
                            logger.info(f"  → Created initial HD slide_0001.png")
                        else:
                            diff_p_last = curr_phash - last_saved_hash[0]
                            diff_d_last = curr_dhash - last_saved_hash[1]
                            diff_from_last = (diff_p_last + diff_d_last) // 2

                            if diff_from_last >= NEW_SLIDE_THRESHOLD:
                                # Major slide/board change -> NEW SLIDE
                                slide_counter += 1
                                slide_path = os.path.join(self.slides_dir, f"slide_{slide_counter:04d}.png")
                                candidate_pil.save(slide_path, "PNG")
                                slide_paths.append(slide_path)
                                last_saved_hash = (curr_phash, curr_dhash)
                                logger.info(f"  → New HD slide {slide_counter} (diff_from_last={diff_from_last})")
                            else:
                                # Same slide being updated with more writing -> OVERWRITE last slide with lossless PNG!
                                last_slide_path = slide_paths[-1]
                                candidate_pil.save(last_slide_path, "PNG")
                                last_saved_hash = (curr_phash, curr_dhash)
                                logger.info(f"  ↻ Overwrote slide {slide_counter} with full HD settled version (diff={diff_from_last})")

                        saved_current_candidate = True

                else:
                    candidate_hash = (curr_phash, curr_dhash)
                    candidate_pil = pil_img
                    stable_count = 1
                    saved_current_candidate = False

        cap.release()

        # Fallback: if no slides extracted (e.g. tiny video), capture 1st frame
        if not slide_paths and total_frames > 0:
            cap = cv2.VideoCapture(video_path)
            ret, frame = cap.read()
            if ret:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)
                slide_path = os.path.join(self.slides_dir, "slide_0001.png")
                pil_img.save(slide_path, "PNG")
                slide_paths.append(slide_path)
            cap.release()

        return slide_paths

    def _compile_pdf(self, slide_paths: List[str], pdf_output_path: str, preview_output_path: str):
        """Compiles image list into a single PDF document using img2pdf."""
        if not slide_paths:
            raise Exception("No slide images available for PDF compilation.")

        # Save first slide copy as high quality preview thumbnail
        first_img = Image.open(slide_paths[0])
        first_img.convert("RGB").save(preview_output_path, "JPEG", quality=95)

        try:
            # Use img2pdf for lossless high speed PDF compilation
            with open(pdf_output_path, "wb") as f:
                f.write(img2pdf.convert(slide_paths))
        except Exception as e:
            logger.warning(f"img2pdf failed ({e}), falling back to PIL image PDF export.")
            images = [Image.open(p).convert("RGB") for p in slide_paths]
            images[0].save(pdf_output_path, save_all=True, append_images=images[1:])

    def _cleanup(self):
        """Removes temporary files and directory."""
        if os.path.exists(self.temp_dir):
            try:
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temp directory: {self.temp_dir}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp directory {self.temp_dir}: {e}")
