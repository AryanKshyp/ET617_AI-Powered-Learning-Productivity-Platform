# Course Management System Setup Guide

## 🎯 **What's Been Implemented**

I've successfully implemented a comprehensive course management system with the following features:

### ✅ **Core Features**
1. **Course Creation & Management** - Teachers/students can create courses after login
2. **PDF Upload System** - Upload PDFs to courses with metadata tracking
3. **Course Dashboard** - Similar to main dashboard but course-specific
4. **Content Generation** - Generate quizzes, assignments, and summaries from PDFs
5. **Advanced Generation Options** - Page range, Bloom's taxonomy, question count, etc.

### 📁 **New Files Created**
- `app/courses/[id]/page.tsx` - Course dashboard
- `app/courses/[id]/upload/page.tsx` - PDF upload page
- `app/courses/[id]/generated/[generatedId]/page.tsx` - View generated content
- `app/api/generate-content/route.ts` - Content generation API
- `app/api/courses/[id]/route.ts` - Individual course API
- `app/api/materials/[id]/route.ts` - Material deletion API
- `app/api/generated/[id]/route.ts` - Generated content API

### 🔧 **Updated Files**
- `schema/learnify_content.sql` - Added page_count, file_size, generation_settings
- `app/dashboard/page.tsx` - Added course links
- `app/api/materials/route.ts` - Enhanced with new fields
- `python-generator/app.py` - Added summary generation and settings support

## 🚀 **Setup Instructions**

### 1. **Database Setup**
Run the updated SQL schema in your Supabase SQL editor:
```sql
-- The updated schema is in schema/learnify_content.sql
-- This adds page_count, file_size, and generation_settings fields
```

### 2. **Environment Variables**
Add these to your `.env.local` file:
```bash
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# New variables for course system
NEXT_PUBLIC_PYTHON_GENERATOR_URL=http://localhost:8000
GEMINI_API_KEY=your-gemini-api-key
COHERE_API_KEY=your-cohere-api-key
```

### 3. **Python Generator Setup**
```bash
cd python-generator
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 4. **Storage Bucket**
Create a storage bucket named `materials` in Supabase for PDF uploads.

## 🎮 **How to Use**

### **For Teachers/Students:**
1. **Login** → Redirected to dashboard
2. **Create Course** → Click "Add" in courses section
3. **Open Course** → Click "Open" next to course name
4. **Upload PDF** → Click "Upload Material" → Select PDF
5. **Generate Content** → Click "Generate" on PDF → Choose options:
   - Content type: Quiz, Assignment, or Summary
   - Page range: Select specific pages
   - Questions: Number of questions (for quiz/assignment)
   - Length: Short/Medium/Long (for summary)
   - Bloom's level: Remember, Understand, Apply, Analyze, Evaluate, Create

### **Generation Options Explained:**
- **Page Range**: Specify which pages of the PDF to use (e.g., 1-5, 10-15)
- **Number of Questions**: How many questions for quizzes/assignments (1-20)
- **Summary Length**: 
  - Short: 1-2 paragraphs
  - Medium: 3-4 paragraphs  
  - Long: 5+ paragraphs
- **Bloom's Taxonomy**: Cognitive complexity level

## 🔄 **System Flow**

1. **User uploads PDF** → Stored in Supabase Storage
2. **User clicks Generate** → Modal opens with options
3. **User selects settings** → Page range, type, etc.
4. **System calls Python generator** → Processes PDF with RAG
5. **Content generated** → Saved to database
6. **User views content** → Formatted display with all options

## 🎨 **UI Features**

- **Course Dashboard**: Clean, modern interface similar to main dashboard
- **Generation Modal**: Intuitive popup with all required options
- **Content Viewer**: Formatted display for quizzes, assignments, summaries
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Graceful error messages and fallbacks

## 🔧 **Technical Details**

- **RAG Pipeline**: Uses LangChain + FAISS + Cohere for intelligent content generation
- **PDF Processing**: Advanced document conversion with Docling
- **Page Range Support**: Can process specific pages from PDFs
- **Settings Storage**: All generation settings saved for reference
- **Type Safety**: Full TypeScript support throughout

## 🚨 **Important Notes**

1. **PDF Processing**: The system can read PDFs uploaded by users and extract text for generation
2. **Page Range**: Users can specify which pages to use for content generation
3. **AI Integration**: Requires Gemini and Cohere API keys for content generation
4. **Storage**: PDFs are stored in Supabase Storage with proper metadata
5. **Scalability**: System is designed to handle multiple courses and materials

The system is now ready to use! Users can create courses, upload PDFs, and generate educational content with full control over the generation parameters.
