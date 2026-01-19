#!/bin/bash
# Start the QuantLib API server

cd "$(dirname "$0")"
source .venv/bin/activate

# Set PYTHONPATH to include src directory
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"

# Start uvicorn
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
