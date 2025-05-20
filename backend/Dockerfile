FROM nvidia/cuda:11.8.0-base-ubuntu22.04

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive \
    USE_GPU_ACCELERATION=true

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    curl \
    git \
    libopenmpi-dev \
    openmpi-bin \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir -r requirements.txt

# Optional: Install additional GPU-specific packages
RUN pip3 install torch==2.0.1+cu118 -f https://download.pytorch.org/whl/torch_stable.html

# Copy application code
COPY . .

# Create results directory
RUN mkdir -p /app/results

# Expose the API port
EXPOSE 8888

# Set entry point
CMD ["python3", "start_backend.py"]