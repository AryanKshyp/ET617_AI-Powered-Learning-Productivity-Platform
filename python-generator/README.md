# ProLearnAI Python Generator

A lightweight FastAPI service for generating educational content using Gemini AI.

## Features

- **Lightweight**: Direct Gemini API integration (no RAG pipeline)
- **PDF Processing**: Extract text from PDFs using pdfplumber
- **Content Generation**: Generate quizzes, assignments, and summaries
- **Fast**: Simple "Extract Text → Call Gemini" workflow

## Quick Start

### 1. Create Virtual Environment

**Important**: Since dependencies have changed significantly, recreate your virtual environment:

```bash
cd python-generator

# Remove old virtual environment (if exists)
rm -rf .venv  # Linux/Mac
# OR on Windows:
rmdir /s .venv

# Create new virtual environment
python -m venv .venv

# Activate virtual environment
# Linux/Mac:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Environment Variables

Create a `.env` file (or set environment variables):

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the Service

```bash
python app.py
```

Or with uvicorn directly:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Test the Service

```bash
curl http://localhost:8000/
# Should return: {"ok": true, "service": "python-generator"}
```

## API Endpoints

### POST `/generate`

Generate quiz, assignment, or summary from text or PDF.

**Request:**
```json
{
  "text": "Generate a quiz about photosynthesis",
  "type": "quiz",
  "bloom_level": "apply",
  "material_meta": { "id": "material_123" },
  "pdf_id": "optional_pdf_id_from_supabase",
  "settings": {
    "num_questions": 5,
    "page_range": "1-10"
  }
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What is photosynthesis?",
      "choices": ["A: Process of...", "B: ...", "C: ...", "D: ..."],
      "answer": "A",
      "level": "apply",
      "explanation": "..."
    }
  ],
  "metadata": {
    "source": "python-generator",
    "total_questions": 5,
    "bloom_level": "apply"
  }
}
```

### POST `/process-pdf`

Extract text from a PDF stored in Supabase.

**Request:**
```json
{
  "pdf_id": "path/to/file.pdf",
  "bucket_name": "uploadFiles"
}
```

**Response:**
```json
{
  "success": true,
  "text_length": 12345,
  "message": "PDF processed successfully"
}
```

## Deployment

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed instructions on deploying to Render.
