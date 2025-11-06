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

# Create clean requirements file (remove Windows-only packages)
# This handles cases where old requirements.txt might still have pywin32
RUN grep -v "^pywin32" requirements.txt | \
    grep -v "^pyreadline3" | \
    grep -v "^#" | \
    grep -v "^$" > requirements-clean.txt || true

# Install Python dependencies
# Use --no-cache-dir to reduce image size
# Fail the build if installation fails (remove || true to catch errors)
RUN pip install --no-cache-dir -r requirements-clean.txt

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

