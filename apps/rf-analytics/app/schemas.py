"""Pydantic schemas for RF Analytics."""

from pydantic import BaseModel, Field


class ChannelScanInput(BaseModel):
    """Raw channel scan data from a radio device."""
    device_id: str
    frequency_mhz: float = Field(..., ge=5725.0, le=5825.0, description="Frequency in MHz")
    signal_dbm: float = Field(..., le=0.0, description="Signal strength in dBm")
    noise_dbm: float = Field(..., le=0.0, description="Noise floor in dBm")
    channel_width_mhz: int = Field(..., ge=5, le=80, description="Channel width in MHz")


class ChannelScore(BaseModel):
    """Scored channel recommendation."""
    frequency_mhz: float
    score: float = Field(..., ge=0.0, le=100.0)
    snr_db: float
    is_blacklisted: bool
    recommendation: str


class SpectrumAnalysisResult(BaseModel):
    """Complete spectrum analysis result."""
    device_id: str
    analyzed_channels: list[ChannelScore]
    recommended_frequency_mhz: float
    interference_detected: bool
