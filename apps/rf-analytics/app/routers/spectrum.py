"""Spectrum analysis router."""

from fastapi import APIRouter
from app.schemas import ChannelScanInput, SpectrumAnalysisResult
from app.services.spectrum_service import analyze_spectrum

router = APIRouter()


@router.post("/analyze", response_model=SpectrumAnalysisResult)
def analyze(payload: ChannelScanInput) -> SpectrumAnalysisResult:
    """Analyze a channel scan and return interference + recommendations."""
    return analyze_spectrum(payload)
