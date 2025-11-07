from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
from supabase import create_client, Client
import google.generativeai as genai
import pdfplumber
import tempfile
import json
import logging

# ============================================================================
# CONFIGURATION
# ============================================================================

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Supabase
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.warning("Supabase URL/Key not found. PDF processing will fail.")
    # You might want to raise an Exception here if Supabase is critical
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found. Generation will fail.")
    # Raise Exception if Gemini is critical
else:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="ProLearnAI Python Generator", version="1.0.1")

# Add CORS middleware to allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# DATA MODELS
# ============================================================================

class GenerateRequest(BaseModel):
    text: str
    type: str  # "quiz" | "assignment" | "summary"
    bloom_level: Optional[str] = None
    material_meta: Optional[Dict[str, Any]] = None
    pdf_id: Optional[str] = None  # Supabase storage PDF identifier
    bucket_name: Optional[str] = "materials"  # Supabase storage bucket name
    settings: Optional[Dict[str, Any]] = None  # Additional generation settings

class PDFProcessRequest(BaseModel):
    pdf_id: str
    bucket_name: Optional[str] = "uploadFiles"

# ============================================================================
# PDF PROCESSING
# ============================================================================

class PDFProcessor:
    def download_pdf_from_supabase(self, pdf_id: str, bucket_name: str = "uploadFiles") -> bytes:
        """Download PDF from Supabase storage"""
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase client not initialized.")
        try:
            logger.info(f"Downloading PDF: {pdf_id} from bucket: {bucket_name}")
            response = supabase.storage.from_(bucket_name).download(pdf_id)
            logger.info("PDF downloaded successfully.")
            return response
        except Exception as e:
            logger.error(f"Supabase download error: {e}")
            raise HTTPException(status_code=404, detail=f"PDF not found or Supabase error: {str(e)}")
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract full text from PDF using pdfplumber"""
        tmp_path = None
        try:
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_path = tmp_file.name
            
            logger.info(f"Extracting text from temporary PDF: {tmp_path}")
            # Extract text from all pages
            full_text = ""
            with pdfplumber.open(tmp_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        full_text += f"\n\n--- Page {i+1} ---\n\n" + page_text
            
            logger.info(f"Text extraction complete. Total length: {len(full_text)}")
            return full_text.strip()
        
        except Exception as e:
            logger.error(f"PDF processing failed: {e}")
            raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")
        
        finally:
            # Clean up the temporary file
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
                logger.info(f"Cleaned up temporary file: {tmp_path}")

# Initialize global PDF processor
pdf_processor = PDFProcessor()

# ============================================================================
# GENERATION WITH GEMINI
# ============================================================================

def build_prompt(query: str, full_text: str, generation_type: str, 
                 bloom_level: Optional[str] = None, settings: Optional[Dict[str, Any]] = None) -> str:
    """
    Build a simple prompt for Gemini.
    Note: The JSON format description is still useful for the model to understand
    the *schema* (the structure and keys) you want.
    """
    bloom_level = bloom_level or ("remember" if generation_type == "quiz" else "apply")
    settings = settings or {}
    
    # Common intro for context
    context_prompt = f"""You are an expert educational content generator. Analyze the following text and generate the requested material.
    
    Text:
    {full_text}
    
    User Query: {query}
    Bloom's Taxonomy Level: {bloom_level}
    """

    if generation_type == "quiz":
        num_questions = settings.get("num_questions", 5)
        page_range = settings.get("page_range", "all") # Default to "all"
        
        prompt = f"""{context_prompt}

Requirements:
- Type: Quiz
- Create {num_questions} multiple-choice questions
- Each question should have 4 choices
- Indicate the correct answer key (e.g., "A")
- Provide a brief explanation for the correct answer
- Focus on content from pages: {page_range} (if applicable)
- Ensure questions are appropriate for the {bloom_level} cognitive level

Return the response in this exact JSON schema:
{{
    "questions": [
        {{
            "question": "...",
            "choices": {{ "A": "...", "B": "...", "C": "...", "D": "..." }},
            "answer": "A",
            "level": "{bloom_level}",
            "explanation": "..."
        }}
    ],
    "metadata": {{
        "total_questions": {num_questions},
        "bloom_level": "{bloom_level}",
        "page_range": "{page_range}"
    }}
}}"""
    
    elif generation_type == "assignment":
        num_questions = settings.get("num_questions", 3) # Fewer tasks for an assignment
        page_range = settings.get("page_range", "all")
        
        prompt = f"""{context_prompt}

Requirements:
- Type: Assignment
- Create a detailed assignment prompt with {num_questions} tasks/questions
- Include clear instructions
- Provide a simple grading rubric (array of strings)
- Estimate completion time
- Focus on content from pages: {page_range} (if applicable)
- Ensure tasks are appropriate for the {bloom_level} cognitive level

Return the response in this exact JSON schema:
{{
    "title": "...",
    "instructions": "...",
    "rubric": ["criterion1", "criterion2", ...],
    "estimated_time": "...",
    "learning_objectives": ["obj1", "obj2", ...],
    "assignment_tasks": [
        {{
            "task_number": 1,
            "description": "...",
            "bloom_level": "{bloom_level}",
            "points": 10
        }}
    ],
    "metadata": {{
        "total_tasks": {num_questions},
        "bloom_level": "{bloom_level}",
        "page_range": "{page_range}"
    }}
}}"""
    
    elif generation_type == "summary":
        length = settings.get("length", "medium")
        page_range = settings.get("page_range", "all")
        
        length_desc = {
            "short": "1-2 concise paragraphs, focus on main points only",
            "medium": "3-4 paragraphs, include key details and examples", 
            "long": "5+ paragraphs, comprehensive coverage with detailed analysis"
        }
        
        prompt = f"""{context_prompt}

Requirements:
- Type: Summary
- Length: {length} ({length_desc.get(length, 'medium')})
- Focus on key concepts and main ideas from pages: {page_range} (if applicable)
- Use clear, concise language
- Organize information logically
- Ensure summary depth matches the {bloom_level} cognitive level

Return the response in this exact JSON schema:
{{
    "title": "Summary: {query}",
    "content": "...",
    "key_points": ["point1", "point2", ...],
    "length": "{length}",
    "bloom_level": "{bloom_level}",
    "page_range": "{page_range}",
    "word_count": "...",
    "metadata": {{
        "bloom_level": "{bloom_level}",
        "page_range": "{page_range}",
        "length": "{length}"
    }}
}}"""
    else:
        # Fallback to a generic prompt if type is unknown
        prompt = f"""{context_prompt}

Requirements:
- Generate content based on the user query.
- Bloom's Taxonomy Level: {bloom_level}
- Return a structured JSON response.
{{
    "title": "Generated Content",
    "content": "...",
    "metadata": {{
        "bloom_level": "{bloom_level}",
        "query": "{query}"
    }}
}}"""
    
    return prompt


def generate_with_gemini(query: str, full_text: str, generation_type: str,
                         bloom_level: Optional[str] = None, settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generate content using Gemini with native JSON mode"""
    
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured.")
        
    try:
        # 1. Build prompt
        prompt = build_prompt(query, full_text, generation_type, bloom_level, settings)
        
        # 2. Initialize Gemini model
        model = genai.GenerativeModel("gemini-2.5-flash-preview-09-2025")
        
        # 3. *** NEW: Configure for JSON output ***
        generation_config = genai.GenerationConfig(
            response_mime_type="application/json"
        )
        
        logger.info(f"Generating content for type: {generation_type}, bloom: {bloom_level}")
        
        # 4. Generate response
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        # 5. *** NEW: Simplified JSON parsing ***
        # The response.text is now a guaranteed JSON string
        result = json.loads(response.text)
        
        # Add 'generated_from' to metadata
        if "metadata" in result:
            result["metadata"]["generated_from"] = "gemini-2.5-flash-json-mode"
        else:
            result["metadata"] = {"generated_from": "gemini-2.5-flash-json-mode"}

        logger.info("Gemini generation successful.")
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {e}")
        logger.error(f"Response text (first 500 chars): {response.text[:500] if 'response' in locals() else 'N/A'}")
        # Only use fallback for JSON parsing errors
        return generate_fallback_response(query, generation_type, bloom_level, settings, f"JSON parsing error: {str(e)}")
    except Exception as e:
        error_type = type(e).__name__
        logger.error(f"Gemini generation failed ({error_type}): {e}")
        logger.error(f"Failed prompt (first 500 chars): {prompt[:500] if 'prompt' in locals() else 'N/A'}")
        
        # For critical errors (auth, quota, etc.), raise HTTPException instead of fallback
        error_msg = str(e).lower()
        if any(keyword in error_msg for keyword in ['api key', 'authentication', 'permission', 'quota', 'rate limit']):
            raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
        
        # For other generation errors, use fallback
        return generate_fallback_response(query, generation_type, bloom_level, settings, f"{error_type}: {str(e)}")


def generate_fallback_response(query: str, generation_type: str, 
                               bloom_level: Optional[str], settings: Optional[Dict[str, Any]], error_msg: str) -> Dict[str, Any]:
    """Creates a fallback JSON response in case of generation failure"""
    
    logger.warning("Generating fallback response due to error.")
    
    bloom_level = bloom_level or ("remember" if generation_type == "quiz" else "apply")
    settings = settings or {}
    page_range = settings.get("page_range", "all")

    metadata = {
        "bloom_level": bloom_level,
        "page_range": page_range,
        "generated_from": "gemini-direct (fallback)",
        "error": error_msg
    }

    if generation_type == "quiz":
        num_questions = settings.get("num_questions", 5)
        metadata["total_questions"] = num_questions
        questions = [
            {
                "question": f"Fallback: Based on the material, {query} (Question {i+1})",
                "choices": {"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"},
                "answer": "A",
                "level": bloom_level,
                "explanation": f"This is a fallback response. Generation failed."
            } for i in range(num_questions)
        ]
        return {"questions": questions, "metadata": metadata}
    
    elif generation_type == "summary":
        length = settings.get("length", "medium")
        metadata["length"] = length
        return {
            "title": f"Summary: {query}",
            "content": f"AI generation failed. This is a fallback summary for: {query}.",
            "key_points": ["Generation failed"],
            "length": length,
            "bloom_level": bloom_level,
            "page_range": page_range,
            "word_count": "0",
            "metadata": metadata
        }
        
    else: # Default to assignment
        num_tasks = settings.get("num_questions", 3)
        metadata["total_tasks"] = num_tasks
        tasks = [
            {
                "task_number": i+1,
                "description": f"Fallback task {i+1}: Analyze concepts from pages {page_range}",
                "bloom_level": bloom_level,
                "points": 10
            } for i in range(num_tasks)
        ]
        return {
            "title": f"Assignment: {query}",
            "instructions": "AI generation failed. This is a fallback assignment.",
            "rubric": ["Generation failed"],
            "estimated_time": "N/A",
            "learning_objectives": ["N/A"],
            "assignment_tasks": tasks,
            "metadata": metadata
        }

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    return {"ok": True, "service": "python-generator", "version": "1.0.1"}

@app.post("/process-pdf")
def process_pdf(req: PDFProcessRequest):
    """Process PDF from Supabase and extract text"""
    try:
        # Download PDF
        pdf_bytes = pdf_processor.download_pdf_from_supabase(
            req.pdf_id, 
            req.bucket_name
        )
        
        # Extract text with pdfplumber
        text = pdf_processor.extract_text_from_pdf(pdf_bytes)
        
        return {
            "success": True,
            "text_length": len(text),
            "message": "PDF processed successfully"
        }
    except Exception as e:
        # HTTPException raised in processors will be bubbled up
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Unexpected error in /process-pdf: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
def generate(req: GenerateRequest):
    """Generate quiz or assignment using Gemini directly"""
    try:
        full_text = ""
        
        # If PDF ID provided, extract text from PDF
        if req.pdf_id:
            logger.info(f"Processing PDF ID: {req.pdf_id}")
            bucket_name = req.bucket_name or "materials"
            pdf_bytes = pdf_processor.download_pdf_from_supabase(req.pdf_id, bucket_name)
            full_text = pdf_processor.extract_text_from_pdf(pdf_bytes)
        else:
            # Use provided text directly
            logger.info("Using provided text directly.")
            full_text = req.text
        
        if not full_text:
            raise HTTPException(status_code=400, detail="No text content provided or extracted.")

        # Generate with Gemini directly
        result = generate_with_gemini(
            req.text,  # req.text is the user's query/prompt
            full_text, # full_text is the source material (from PDF or req.text)
            req.type,
            req.bloom_level,
            req.settings
        )
        
        # Add final metadata
        result["metadata"].update({
            "source": "python-generator",
            "material_meta": req.material_meta,
            "pdf_id": req.pdf_id if req.pdf_id else None
        })
        
        return result
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Unexpected error in /generate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Run the application
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variable (Render uses $PORT, default to 8000)
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    # Check for reload flag (e.g., for local dev)
    reload = os.getenv("UVICORN_RELOAD", "false").lower() == "true"
    
    logger.info(f"Starting server on {host}:{port} (Reload: {reload})")
    
    # Run the server
    uvicorn.run(
        "app:app",  # Point to app.py and app instance
        host=host,
        port=port,
        reload=reload
    )