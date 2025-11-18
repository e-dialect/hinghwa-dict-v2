# Audio Synthesis Microservice

FastAPI-based audio synthesis service for combining phoneme audio files.

## Features

- Combine multiple phoneme MP3 files into a single audio file
- Support input by Chinese characters, IPA, or pinyin
- Fallback to tone-neutral matching when exact match not found
- 44100Hz sample rate with 100ms silence between segments

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Docker

```bash
docker build -t audio-service .
docker run -p 8001:8001 audio-service
```

## API Endpoints

### GET /audio/combine

Combine phoneme audio files based on input.

**Query Parameters:**
- `words` (optional): Chinese characters (e.g., "兴化")
- `ipas` (optional): IPA transcription (e.g., "hiŋ1 hua2")
- `pinyins` (optional): Pinyin romanization (e.g., "heng1 hua2")

**Response:**
```json
{
  "url": "https://storage/audio/combined_20231117_heng1hua2.mp3",
  "tts": "https://storage/audio/tts_version.mp3"
}
```

### GET /health

Health check endpoint.

## Future Enhancements

This is a basic implementation. Future versions may use:
- **omnilingual-asr**: Multilingual automatic speech recognition
- **DiaMoE-TTS**: Dialect-specific text-to-speech
- **Other TTS/ASR models** as needed

The interface is designed to remain compatible while backend implementations can be swapped.
