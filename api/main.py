"""
FastAPI application for QuantLib REST API
"""

import sys
from pathlib import Path

# Add project root to path so we can import quantlib
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
from api.routers import database, data, backtest, strategies, indicators

app = FastAPI(
    title="QuantLib API",
    description="REST API for QuantLib quantitative trading library",
    version="0.1.0"
)

# CORS middleware - allow React app to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(database.router, prefix="/api/database", tags=["database"])
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(backtest.router, prefix="/api/backtest", tags=["backtest"])
app.include_router(strategies.router, prefix="/api/strategies", tags=["strategies"])
app.include_router(indicators.router, prefix="/api/indicators", tags=["indicators"])


@app.get("/")
async def root():
    return {"message": "QuantLib API", "version": "0.1.0"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)