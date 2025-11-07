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

# ============================================================================
# CONFIGURATION
# ============================================================================

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "your-supabase-url")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-key")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-api-key")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="ProLearnAI Python Generator", version="1.0.0")

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
        try:
            response = supabase.storage.from_(bucket_name).download(pdf_id)
            return response
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"PDF not found: {str(e)}")
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract full text from PDF using pdfplumber"""
        try:
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_path = tmp_file.name
            
            # Extract text from all pages
            full_text = ""
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        full_text += page_text + "\n\n"
            
            # Clean up
            os.unlink(tmp_path)
            
            return full_text.strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

# Initialize global PDF processor
pdf_processor = PDFProcessor()

# ============================================================================
# GENERATION WITH GEMINI
# ============================================================================

def build_prompt(query: str, full_text: str, generation_type: str, 
                bloom_level: Optional[str] = None, settings: Optional[Dict[str, Any]] = None) -> str:
    """Build a simple prompt for Gemini"""
    bloom_level = bloom_level or ("remember" if generation_type == "quiz" else "apply")
    settings = settings or {}
    
    if generation_type == "quiz":
        num_questions = settings.get("num_questions", 5)
        page_range = settings.get("page_range", "1-10")
        prompt = f"""Generate a comprehensive quiz based on the following text.

Text:
{full_text}

Requirements:
- Create {num_questions} multiple-choice questions
- Bloom's Taxonomy Level: {bloom_level}
- Each question should have 4 choices (A, B, C, D)
- Indicate the correct answer
- Questions should test understanding of the material
- Focus on content from pages {page_range}
- Ensure questions are appropriate for the {bloom_level} cognitive level

Query: {query}

Return the response in JSON format:
{{
    "questions": [
        {{
            "question": "...",
            "choices": ["A: ...", "B: ...", "C: ...", "D: ..."],
            "answer": "A",
            "level": "{bloom_level}",
            "explanation": "..."
        }}
    ],
    "metadata": {{
        "total_questions": {num_questions},
        "bloom_level": "{bloom_level}",
        "page_range": "{page_range}",
        "generated_from": "gemini-direct"
    }}
}}

JSON Response:"""
    
    elif generation_type == "assignment":
        num_questions = settings.get("num_questions", 5)
        page_range = settings.get("page_range", "1-10")
        prompt = f"""Generate a comprehensive assignment based on the following text.

Text:
{full_text}

Requirements:
- Create a detailed assignment prompt
- Bloom's Taxonomy Level: {bloom_level}
- Include clear instructions
- Provide a grading rubric
- Estimated completion time
- Focus on content from pages {page_range}
- Design {num_questions} assignment tasks/questions
- Ensure tasks are appropriate for the {bloom_level} cognitive level

Query: {query}

Return the response in JSON format:
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
            "points": "..."
        }}
    ],
    "metadata": {{
        "total_tasks": {num_questions},
        "bloom_level": "{bloom_level}",
        "page_range": "{page_range}",
        "generated_from": "gemini-direct"
    }}
}}

JSON Response:"""
    
    elif generation_type == "summary":
        length = settings.get("length", "medium")
        page_range = settings.get("page_range", "1-10")
        prompt = f"""Generate a comprehensive summary based on the following text.

Text:
{full_text}

Requirements:
- Bloom's Taxonomy Level: {bloom_level}
- Length: {length}
- Focus on key concepts and main ideas from pages {page_range}
- Use clear, concise language
- Organize information logically
- Ensure summary depth matches the {bloom_level} cognitive level
- For {length} length: {{
    "short": "1-2 paragraphs, focus on main points only",
    "medium": "3-4 paragraphs, include key details and examples", 
    "long": "5+ paragraphs, comprehensive coverage with detailed analysis"
  }}

Query: {query}

Return the response in JSON format:
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
        "length": "{length}",
        "generated_from": "gemini-direct"
    }}
}}

JSON Response:"""
    else:
        # Fallback to assignment
        num_questions = settings.get("num_questions", 5)
        page_range = settings.get("page_range", "1-10")
        prompt = f"""Generate a comprehensive assignment based on the following text.

Text:
{full_text}

Requirements:
- Create a detailed assignment prompt
- Bloom's Taxonomy Level: {bloom_level}
- Include clear instructions
- Provide a grading rubric
- Estimated completion time
- Focus on content from pages {page_range}
- Design {num_questions} assignment tasks/questions
- Ensure tasks are appropriate for the {bloom_level} cognitive level

Query: {query}

Return the response in JSON format:
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
            "points": "..."
        }}
    ],
    "metadata": {{
        "total_tasks": {num_questions},
        "bloom_level": "{bloom_level}",
        "page_range": "{page_range}",
        "generated_from": "gemini-direct"
    }}
}}

JSON Response:"""
    
    return prompt


def generate_with_gemini(query: str, full_text: str, generation_type: str,
                        bloom_level: Optional[str] = None, settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generate content using Gemini directly"""
    
    try:
        # Build prompt
        prompt = build_prompt(query, full_text, generation_type, bloom_level, settings)
        
        # Initialize Gemini model
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Generate response
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Try to parse JSON from response
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].split("```")[0].strip()
        else:
            json_str = response_text.strip()
        
        result = json.loads(json_str)
        return result
        
    except Exception as e:
        print(f"Generation error: {e}")
        # Fallback response
        bloom_level = bloom_level or ("remember" if generation_type == "quiz" else "apply")
        settings = settings or {}
        
        if generation_type == "quiz":
            num_questions = settings.get("num_questions", 5)
            page_range = settings.get("page_range", "1-10")
            questions = []
            for i in range(num_questions):
                questions.append({
                    "question": f"Based on the material, {query} (Question {i+1})",
                    "choices": ["A: Option 1", "B: Option 2", "C: Option 3", "D: Option 4"],
                    "answer": "A",
                    "level": bloom_level,
                    "explanation": f"Generated from text focusing on pages {page_range}"
                })
            return {
                "questions": questions,
                "metadata": {
                    "total_questions": num_questions,
                    "bloom_level": bloom_level,
                    "page_range": page_range,
                    "generated_from": "gemini-direct (fallback)",
                    "error": str(e)
                }
            }
        elif generation_type == "summary":
            length = settings.get("length", "medium")
            page_range = settings.get("page_range", "1-10")
            return {
                "title": f"Summary: {query}",
                "content": f"Based on the provided material from pages {page_range}: {query}. This is a {length} summary generated from the text.",
                "key_points": ["Key concept 1", "Key concept 2", "Key concept 3"],
                "length": length,
                "bloom_level": bloom_level,
                "page_range": page_range,
                "word_count": "~200 words",
                "metadata": {
                    "bloom_level": bloom_level,
                    "page_range": page_range,
                    "length": length,
                    "generated_from": "gemini-direct (fallback)",
                    "error": str(e)
                }
            }
        else:
            num_questions = settings.get("num_questions", 5)
            page_range = settings.get("page_range", "1-10")
            return {
                "title": f"Assignment: {query}",
                "instructions": f"Analyze and discuss the concepts from the provided material focusing on pages {page_range}.",
                "rubric": ["Understanding", "Analysis", "Critical Thinking"],
                "estimated_time": "2-3 hours",
                "assignment_tasks": [
                    {
                        "task_number": i+1,
                        "description": f"Task {i+1}: Analyze concepts from pages {page_range}",
                        "bloom_level": bloom_level,
                        "points": "10 points"
                    } for i in range(num_questions)
                ],
                "metadata": {
                    "total_tasks": num_questions,
                    "bloom_level": bloom_level,
                    "page_range": page_range,
                    "generated_from": "gemini-direct (fallback)",
                    "error": str(e)
                }
            }

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    return {"ok": True, "service": "python-generator"}

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
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
def generate(req: GenerateRequest):
    """Generate quiz or assignment using Gemini directly"""
    try:
        full_text = ""
        
        # If PDF ID provided, extract text from PDF
        if req.pdf_id:
            pdf_bytes = pdf_processor.download_pdf_from_supabase(req.pdf_id)
            full_text = pdf_processor.extract_text_from_pdf(pdf_bytes)
        else:
            # Use provided text directly
            full_text = req.text
        
        # Generate with Gemini directly
        result = generate_with_gemini(
            req.text,
            full_text,
            req.type,
            req.bloom_level,
            req.settings
        )
        
        # Add metadata
        if "metadata" in result:
            result["metadata"].update({
                "source": "python-generator",
                "material_meta": req.material_meta,
                "pdf_id": req.pdf_id if req.pdf_id else None
            })
        else:
            result["metadata"] = {
                "source": "python-generator",
                "material_meta": req.material_meta,
                "pdf_id": req.pdf_id if req.pdf_id else None
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Run the application
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Get port from environment variable (Render uses $PORT, default to 8000)
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    # Run the server
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=False  # Set to True for local development
    )

# ============================================================================
# Run locally:
#   pip install fastapi uvicorn supabase google-generativeai pdfplumber
#
#   python app.py
#   OR
#   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
# ============================================================================