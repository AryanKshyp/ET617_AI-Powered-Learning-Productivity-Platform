FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip to latest version
RUN pip install --upgrade pip setuptools wheel

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Debug: Check what's in the original requirements.txt
RUN echo "=== Debugging requirements.txt ===" && \
    echo "Total lines in requirements.txt:" && \
    wc -l requirements.txt && \
    echo "Checking for uvicorn in original file:" && \
    (grep -i uvicorn requirements.txt && echo "✓ uvicorn found in original!") || \
    (echo "✗ uvicorn NOT in original requirements.txt!" && \
     echo "Last 20 lines of requirements.txt:" && \
     tail -20 requirements.txt && \
     exit 1) && \
    echo "Checking for pywin32:" && \
    (grep -i pywin32 requirements.txt && echo "⚠ pywin32 found (will be filtered)") || \
    echo "✓ No pywin32 found"

# Create clean requirements file (remove Windows-only packages)
# This handles cases where old requirements.txt might still have pywin32
RUN echo "=== Creating requirements-clean.txt ===" && \
    grep -v "^pywin32" requirements.txt | \
    grep -v "^pyreadline3" | \
    grep -v "^#" | \
    grep -v "^$" > requirements-clean.txt && \
    echo "File created. Total lines:" && \
    wc -l requirements-clean.txt && \
    echo "Checking for uvicorn in clean file:" && \
    (grep -i uvicorn requirements-clean.txt && echo "✓ uvicorn found in clean file!") || \
    (echo "✗ uvicorn NOT found in requirements-clean.txt!" && \
     echo "This is a critical error!" && \
     exit 1)

# Install Python dependencies
# Use --no-cache-dir to reduce image size
# Install core dependencies first (fastapi, uvicorn) to ensure they're available
RUN echo "Installing core dependencies first..." && \
    pip install --no-cache-dir fastapi uvicorn[standard] && \
    echo "Core dependencies installed. Installing remaining packages..." && \
    pip install --no-cache-dir -r requirements-clean.txt || \
    (echo "ERROR: pip install failed! Check logs above." && exit 1)

# Verify uvicorn was installed (critical check)
RUN python -c "import uvicorn; print(f'✓ uvicorn version: {uvicorn.__version__} installed successfully')" || \
    (echo "✗ ERROR: uvicorn installation verification failed!" && \
     echo "Attempting to install uvicorn directly..." && \
     pip install --no-cache-dir uvicorn[standard] && \
     python -c "import uvicorn; print(f'✓ uvicorn installed via fallback')") || \
    (echo "✗ CRITICAL: Cannot install uvicorn! Build will fail." && exit 1)

# Copy application code
COPY . .

# Expose port (Render uses $PORT, default to 8000)
EXPOSE 8000

# Health check (optional - can be configured in Render dashboard)
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#     CMD curl -f http://localhost:${PORT:-8000}/ || exit 1

# Run the application
# Use python -m uvicorn for better reliability
# Render sets PORT as environment variable, read it at runtime
# Shell form allows env var substitution
CMD python -m uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}

