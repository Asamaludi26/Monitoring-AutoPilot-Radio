"""Spectrum analysis business logic."""

import numpy as np
from app.schemas import ChannelScanInput, ChannelScore, SpectrumAnalysisResult

# DFS / protected frequency ranges (MHz)
BLACKLISTED_RANGES: list[tuple[float, float]] = [
    (5600.0, 5650.0),  # DFS Radar
    (5725.0, 5730.0),  # BMKG
]


def _is_blacklisted(freq_mhz: float) -> bool:
    return any(start <= freq_mhz <= end for start, end in BLACKLISTED_RANGES)


def _compute_snr(signal_dbm: float, noise_dbm: float) -> float:
    return float(np.round(signal_dbm - noise_dbm, 2))


def _score_channel(
    freq_mhz: float,
    snr_db: float,
    is_blacklisted: bool,
) -> float:
    """Compute 0–100 weighted score for a channel."""
    if is_blacklisted:
        return 0.0
    # SNR weight: clamp 0–40 dB → 0–100 points
    snr_score = float(np.clip(snr_db / 40.0 * 100.0, 0.0, 100.0))
    return round(snr_score, 2)


def analyze_spectrum(payload: ChannelScanInput) -> SpectrumAnalysisResult:
    """Analyze a channel scan and recommend best frequency."""
    snr = _compute_snr(payload.signal_dbm, payload.noise_dbm)
    blacklisted = _is_blacklisted(payload.frequency_mhz)
    score = _score_channel(payload.frequency_mhz, snr, blacklisted)

    channel = ChannelScore(
        frequency_mhz=payload.frequency_mhz,
        score=score,
        snr_db=snr,
        is_blacklisted=blacklisted,
        recommendation="AVOID" if blacklisted else ("USE" if snr >= 20 else "MARGINAL"),
    )

    return SpectrumAnalysisResult(
        device_id=payload.device_id,
        analyzed_channels=[channel],
        recommended_frequency_mhz=payload.frequency_mhz,
        interference_detected=snr < 10,
    )
