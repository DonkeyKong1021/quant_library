#!/bin/bash
# Script to run Streamlit app with correct Python path

# Get the project root directory (parent of scripts/)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"
source .venv/bin/activate
export PYTHONPATH="${PYTHONPATH}:${PROJECT_ROOT}"
streamlit run streamlit_app/app.py
