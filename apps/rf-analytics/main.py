"""RSOCP RF Analytics Microservice — FastAPI entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import spectrum, scoring

app = FastAPI(
    title="RSOCP RF Analytics",
    description="RF Spectrum analysis, channel scoring, and interference detection",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(spectrum.router, prefix="/spectrum", tags=["spectrum"])
app.include_router(scoring.router, prefix="/scoring", tags=["scoring"])


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "rf-analytics"}
