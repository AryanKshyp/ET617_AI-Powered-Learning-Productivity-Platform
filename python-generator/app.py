from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
from supabase import create_client, Client
import google.generativeai as genai
from docling.document_converter import DocumentConverter
import tempfile
import json
import cohere

# LangChain imports
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# ============================================================================
# CONFIGURATION
# ============================================================================

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "your-supabase-url")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-key")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini via LangChain
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-api-key")
gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro",
    google_api_key=GEMINI_API_KEY,
    temperature=0.7
)

# Initialize Cohere for reranking
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "your-cohere-api-key")
cohere_client = cohere.Client(COHERE_API_KEY)

# Initialize embedding model via LangChain (Nomic-AI)
embedding_model = HuggingFaceEmbeddings(
    model_name="nomic-ai/nomic-embed-text-v1.5",
    model_kwargs={'trust_remote_code': True},
    encode_kwargs={'normalize_embeddings': True}
)

# Initialize text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""]
)

# Document converter
doc_converter = DocumentConverter()

app = FastAPI(title="Learnify Python Generator", version="1.0.0")

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
# RAG COMPONENTS
# ============================================================================

class RAGPipeline:
    def __init__(self):
        self.vectorstore: Optional[FAISS] = None
        self.documents: List[Document] = []
    
    def download_pdf_from_supabase(self, pdf_id: str, bucket_name: str = "uploadFiles") -> bytes:
        """Download PDF from Supabase storage"""
        try:
            response = supabase.storage.from_(bucket_name).download(pdf_id)
            return response
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"PDF not found: {str(e)}")
    
    def process_pdf_with_docling(self, pdf_bytes: bytes) -> str:
        """Advanced PDF processing using Docling"""
        try:
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_path = tmp_file.name
            
            # Convert document
            result = doc_converter.convert(tmp_path)
            
            # Extract text with structure
            full_text = result.document.export_to_markdown()
            
            # Clean up
            os.unlink(tmp_path)
            
            return full_text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")
    
    def chunk_text(self, text: str) -> List[Document]:
        """Chunk text using LangChain's RecursiveCharacterTextSplitter"""
        # Create documents
        docs = [Document(page_content=text, metadata={"source": "pdf"})]
        
        # Split documents
        chunks = text_splitter.split_documents(docs)
        self.documents = chunks
        
        return chunks
    
    def build_vectorstore(self, documents: List[Document]) -> FAISS:
        """Build FAISS vector store using LangChain"""
        self.vectorstore = FAISS.from_documents(
            documents=documents,
            embedding=embedding_model
        )
        return self.vectorstore
    
    def semantic_search(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Perform semantic search using LangChain FAISS"""
        if self.vectorstore is None:
            raise ValueError("Vector store not built yet")
        
        # Search with scores
        results = self.vectorstore.similarity_search_with_score(query, k=top_k)
        
        search_results = []
        for doc, score in results:
            search_results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score)
            })
        
        return search_results
    
    def rerank_with_cohere(self, query: str, documents: List[Dict[str, Any]], 
                          top_k: int = 5) -> List[Dict[str, Any]]:
        """Rerank results using Cohere's rerank API"""
        if not documents:
            return []
        
        try:
            # Prepare documents for Cohere
            doc_texts = [doc["content"] for doc in documents]
            
            # Call Cohere rerank API
            rerank_response = cohere_client.rerank(
                model="rerank-english-v3.0",
                query=query,
                documents=doc_texts,
                top_n=top_k,
                return_documents=True
            )
            
            # Process reranked results
            reranked = []
            for result in rerank_response.results:
                original_doc = documents[result.index]
                reranked.append({
                    "content": original_doc["content"],
                    "metadata": original_doc["metadata"],
                    "semantic_score": original_doc["score"],
                    "rerank_score": result.relevance_score,
                    "index": result.index
                })
            
            return reranked
            
        except Exception as e:
            print(f"Cohere reranking failed: {e}")
            # Fallback to original ranking
            return documents[:top_k]
    
    def retrieve_context(self, query: str, top_k: int = 5) -> tuple[str, List[Dict[str, Any]]]:
        """Complete retrieval pipeline with Cohere reranking"""
        # Semantic search
        initial_results = self.semantic_search(query, top_k=10)
        
        # Rerank with Cohere
        reranked_results = self.rerank_with_cohere(query, initial_results, top_k=top_k)
        
        # Combine chunks into context
        context = "\n\n---\n\n".join([r["content"] for r in reranked_results])
        
        return context, reranked_results

# Initialize global RAG pipeline
rag_pipeline = RAGPipeline()

# ============================================================================
# LANGCHAIN PROMPT TEMPLATES
# ============================================================================

quiz_prompt_template = PromptTemplate(
    input_variables=["context", "query", "bloom_level", "num_questions", "page_range"],
    template="""Based on the following context, generate a comprehensive quiz.

Context:
{context}

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
        "generated_from": "RAG-enhanced content"
    }}
}}

JSON Response:"""
)

assignment_prompt_template = PromptTemplate(
    input_variables=["context", "query", "bloom_level", "num_questions", "page_range"],
    template="""Based on the following context, generate a comprehensive assignment.

Context:
{context}

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
        "generated_from": "RAG-enhanced content"
    }}
}}

JSON Response:"""
)

summary_prompt_template = PromptTemplate(
    input_variables=["context", "query", "bloom_level", "length", "page_range"],
    template="""Based on the following context, generate a comprehensive summary.

Context:
{context}

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
        "generated_from": "RAG-enhanced content"
    }}
}}

JSON Response:"""
)

# ============================================================================
# GENERATION WITH LANGCHAIN
# ============================================================================

def generate_with_langchain(query: str, context: str, generation_type: str, 
                           bloom_level: Optional[str] = None, settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generate content using LangChain with Gemini and RAG context"""
    
    bloom_level = bloom_level or ("remember" if generation_type == "quiz" else "apply")
    settings = settings or {}
    
    # Select appropriate prompt template
    if generation_type == "quiz":
        prompt = quiz_prompt_template
    elif generation_type == "assignment":
        prompt = assignment_prompt_template
    elif generation_type == "summary":
        prompt = summary_prompt_template
    else:
        prompt = assignment_prompt_template  # fallback
    
    # Create LangChain chain
    chain = LLMChain(llm=gemini_llm, prompt=prompt)
    
    try:
        # Prepare input variables
        input_vars = {
            "context": context,
            "query": query,
            "bloom_level": bloom_level,
            "num_questions": settings.get("num_questions", 5),
            "page_range": settings.get("page_range", "1-10")
        }
        
        # Add length for summary
        if generation_type == "summary":
            input_vars["length"] = settings.get("length", "medium")
        
        # Run chain
        response = chain.run(**input_vars)
        
        # Extract JSON from response
        response_text = response
        
        # Try to parse JSON
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
        if generation_type == "quiz":
            num_questions = settings.get("num_questions", 5)
            page_range = settings.get("page_range", "1-10")
            questions = []
            for i in range(num_questions):
                questions.append({
                    "question": f"Based on the material from pages {page_range}, {query} (Question {i+1})",
                    "choices": ["A: Option 1", "B: Option 2", "C: Option 3", "D: Option 4"],
                    "answer": "A",
                    "level": bloom_level,
                    "explanation": f"Generated from RAG context focusing on pages {page_range}"
                })
            return {
                "questions": questions,
                "metadata": {
                    "total_questions": num_questions,
                    "bloom_level": bloom_level,
                    "page_range": page_range,
                    "generated_from": "RAG-enhanced content (fallback)",
                    "error": str(e)
                }
            }
        elif generation_type == "summary":
            length = settings.get("length", "medium")
            page_range = settings.get("page_range", "1-10")
            return {
                "title": f"Summary: {query}",
                "content": f"Based on the provided material from pages {page_range}: {query}. This is a {length} summary generated from the RAG context.",
                "key_points": ["Key concept 1", "Key concept 2", "Key concept 3"],
                "length": length,
                "bloom_level": bloom_level,
                "page_range": page_range,
                "word_count": "~200 words",
                "metadata": {
                    "bloom_level": bloom_level,
                    "page_range": page_range,
                    "length": length,
                    "generated_from": "RAG-enhanced content (fallback)",
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
                    "generated_from": "RAG-enhanced content (fallback)",
                    "error": str(e)
                }
            }

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    return {"ok": True, "service": "python-generator-rag"}

@app.post("/process-pdf")
def process_pdf(req: PDFProcessRequest):
    """Process PDF from Supabase and build RAG index"""
    try:
        # Download PDF
        pdf_bytes = rag_pipeline.download_pdf_from_supabase(
            req.pdf_id, 
            req.bucket_name
        )
        
        # Process with Docling
        text = rag_pipeline.process_pdf_with_docling(pdf_bytes)
        
        # Chunk text with LangChain
        chunks = rag_pipeline.chunk_text(text)
        
        # Build FAISS vector store
        rag_pipeline.build_vectorstore(chunks)
        
        return {
            "success": True,
            "chunks_created": len(chunks),
            "message": "PDF processed and indexed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
def generate(req: GenerateRequest):
    """Generate quiz or assignment with RAG using LangChain and Cohere"""
    try:
        # If PDF ID provided, process it first
        if req.pdf_id and rag_pipeline.vectorstore is None:
            pdf_bytes = rag_pipeline.download_pdf_from_supabase(req.pdf_id)
            text = rag_pipeline.process_pdf_with_docling(pdf_bytes)
            chunks = rag_pipeline.chunk_text(text)
            rag_pipeline.build_vectorstore(chunks)
        
        # Retrieve relevant context with Cohere reranking
        if rag_pipeline.vectorstore is not None:
            context, retrieved_chunks = rag_pipeline.retrieve_context(
                req.text, 
                top_k=5
            )
        else:
            context = ""
            retrieved_chunks = []
        
        # Generate with LangChain + Gemini
        result = generate_with_langchain(
            req.text,
            context,
            req.type,
            req.bloom_level,
            req.settings
        )
        
        # Add metadata
        result["metadata"] = {
            "source": "python-rag-pipeline",
            "material_meta": req.material_meta,
            "retrieved_chunks": len(retrieved_chunks),
            "rag_enabled": rag_pipeline.vectorstore is not None,
            "reranking": "cohere"
        }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
def query_rag(query: str, top_k: int = 5):
    """Query the RAG system directly"""
    try:
        if rag_pipeline.vectorstore is None:
            raise HTTPException(status_code=400, detail="No PDF processed yet")
        
        context, results = rag_pipeline.retrieve_context(query, top_k=top_k)
        
        return {
            "query": query,
            "context": context,
            "chunks": results,
            "total_chunks": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag-status")
def rag_status():
    """Check RAG pipeline status"""
    return {
        "indexed": rag_pipeline.vectorstore is not None,
        "chunks": len(rag_pipeline.documents),
        "vectorstore_type": "FAISS",
        "embedding_model": "nomic-ai/nomic-embed-text-v1.5",
        "reranker": "cohere-rerank-english-v3.0"
    }

@app.post("/save-vectorstore")
def save_vectorstore(path: str = "vectorstore"):
    """Save FAISS vectorstore to disk"""
    try:
        if rag_pipeline.vectorstore is None:
            raise HTTPException(status_code=400, detail="No vectorstore to save")
        
        rag_pipeline.vectorstore.save_local(path)
        return {"success": True, "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/load-vectorstore")
def load_vectorstore(path: str = "vectorstore"):
    """Load FAISS vectorstore from disk"""
    try:
        rag_pipeline.vectorstore = FAISS.load_local(
            path, 
            embedding_model,
            allow_dangerous_deserialization=True
        )
        return {"success": True, "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Run locally:
#   pip install fastapi uvicorn supabase google-generativeai cohere docling
#   pip install langchain langchain-google-genai langchain-community faiss-cpu
#   pip install sentence-transformers
#
#   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
# ============================================================================