"""
Audio Synthesis Microservice
FastAPI-based service for combining phoneme audio files

This is a basic implementation that can be replaced with advanced TTS/ASR models
in the future (omnilingual-asr, DiaMoE-TTS, etc.)
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment
import os
from pathlib import Path
from datetime import datetime
import re

app = FastAPI(title="Audio Synthesis Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
PHONEME_DIR = os.getenv("PHONEME_DIR", "/app/phonemes")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "/app/output")
SAMPLE_RATE = 44100
SILENCE_MS = 100

# Ensure directories exist
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)


def split_pinyin(text: str) -> str:
    """Add spaces after numbers in pinyin: 'heng1hua2' -> 'heng1 hua2'"""
    return re.sub(r'(\d)([^\d\s])', r'\1 \2', text.replace(' ', '')).strip()


def get_phoneme_file(pinyin: str, tone_neutral: bool = False) -> str | None:
    """Get phoneme file path, with optional tone-neutral fallback"""
    if tone_neutral and pinyin:
        pinyin = pinyin[:-1]  # Remove last character (tone number)
    
    filepath = os.path.join(PHONEME_DIR, f"{pinyin}.mp3")
    return filepath if os.path.exists(filepath) else None


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "audio-synthesis"}


@app.get("/audio/combine")
async def combine_audio(
    words: str = Query(None, description="Chinese characters"),
    ipas: str = Query(None, description="IPA transcription"),
    pinyins: str = Query(None, description="Pinyin romanization")
):
    """
    Combine phoneme audio files based on input
    
    Args:
        words: Chinese characters (e.g., "兴化")
        ipas: IPA transcription (e.g., "hiŋ1 hua2")
        pinyins: Pinyin romanization (e.g., "heng1 hua2")
    
    Returns:
        JSON with 'url' and 'tts' fields
    """
    
    # Determine input type and convert to pinyin list
    pinyin_list = []
    
    if pinyins:
        # Direct pinyin input
        pinyin_list = split_pinyin(pinyins).split(' ')
    elif ipas:
        # IPA to pinyin conversion (simplified - would need full mapping)
        # For now, just split by spaces
        pinyin_list = split_pinyin(ipas).split(' ')
    elif words:
        # Character to pinyin conversion
        # This would need a character-to-pinyin database
        # For now, return error
        raise HTTPException(
            status_code=501,
            detail="Character-to-pinyin conversion not yet implemented. Please provide pinyin or IPA."
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Must provide at least one of: words, ipas, or pinyins"
        )
    
    # Combine audio files
    try:
        # Start with short silence
        combined = AudioSegment.silent(duration=SILENCE_MS, frame_rate=SAMPLE_RATE)
        
        for pinyin in pinyin_list:
            if not pinyin:
                continue
                
            # Try exact match first
            audio_file = get_phoneme_file(pinyin)
            
            # Fallback to tone-neutral
            if not audio_file:
                audio_file = get_phoneme_file(pinyin, tone_neutral=True)
            
            if audio_file:
                segment = AudioSegment.from_mp3(audio_file)
                segment = segment.set_frame_rate(SAMPLE_RATE)
                combined += segment
            else:
                # Phoneme not found - add extra silence
                combined += AudioSegment.silent(duration=SILENCE_MS, frame_rate=SAMPLE_RATE)
        
        # Export combined audio
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"combined_{timestamp}_{''.join(pinyin_list)}.mp3"
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        combined.export(output_path, format="mp3")
        
        # In production, upload to object storage and return URL
        # For now, return local path
        url = f"/audio/files/{filename}"
        
        return {
            "url": url,
            "tts": url,  # Same for now
            "contributor": "system",
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio processing error: {str(e)}")


@app.get("/audio/files/{filename}")
async def get_audio_file(filename: str):
    """Serve audio file (in production, use object storage instead)"""
    from fastapi.responses import FileResponse
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(filepath, media_type="audio/mpeg")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
