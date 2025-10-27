# Learnify Python Generator

A minimal FastAPI service you can paste your generation logic into.

## Quick start

1. Create a venv and install deps:
```bash
cd python-generator
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

2. Run the service:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

3. Set the URL in your Next.js `.env.local`:
```bash
NEXT_PUBLIC_PYTHON_GENERATOR_URL=http://localhost:8000/generate
```

4. Use the "Generate with Python" button on the material Generate page.

## API
- POST `/generate`
  - Request JSON:
```json
{
  "text": "full material text",
  "type": "quiz",
  "bloom_level": "apply",
  "material_meta": { "id": "<material_id>" }
}
```
  - Response JSON (example quiz):
```json
{
  "questions": [
    { "question": "What is X?", "choices": ["A","B","C","D"], "answer": "A", "level": "apply" }
  ],
  "metadata": { "source": "python-script" }
}
```
