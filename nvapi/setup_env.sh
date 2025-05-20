#!/bin/bash
# Setup script for NVIDIA API integration

# Set environment variables for NVIDIA API
export NVIDIA_API_KEY="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"
export NVIDIA_ORG_ID="user-2stkWZ2ynBU9ojxF1bciSNDOUv2"
export NVIDIA_API_BASE_URL="https://api.nvidia.com/v1"
export NVIDIA_NGC_URL="https://api.ngc.nvidia.com/v2"
export NVIDIA_NEMO_URL="https://api.nemo.nvidia.com/v1"
export NVIDIA_LLM_MODEL="nvidia/research-llm-70b"
export NVIDIA_FINANCE_MODEL="nvidia/finance-forecast-2025"

# Print environment variables
echo "NVIDIA API environment variables set:"
echo "====================================="
echo "NVIDIA_API_KEY: ${NVIDIA_API_KEY:0:10}...${NVIDIA_API_KEY:(-5)}"
echo "NVIDIA_ORG_ID: $NVIDIA_ORG_ID"
echo "NVIDIA_API_BASE_URL: $NVIDIA_API_BASE_URL"
echo "NVIDIA_NGC_URL: $NVIDIA_NGC_URL"
echo "NVIDIA_NEMO_URL: $NVIDIA_NEMO_URL"
echo "NVIDIA_LLM_MODEL: $NVIDIA_LLM_MODEL"
echo "NVIDIA_FINANCE_MODEL: $NVIDIA_FINANCE_MODEL"
echo

# Instructions for usage
echo "To use these environment variables in your current shell, run:"
echo "source nvapi/setup_env.sh"
echo
echo "To test the NVIDIA API integration, run:"
echo "python backend/nvidia_integration.py"
echo