"""Channel scoring service."""

import numpy as np
from app.schemas import ChannelScanInput, ChannelScore

BLACKLISTED_RANGES: list[tuple[float, float]] = [
    (5600.0, 5650.0),
    (5725.0, 5730.0),
]


def score_channel(payload: ChannelScanInput) -> ChannelScore:
    """Score a single channel."""
    snr = float(np.round(payload.signal_dbm - payload.noise_dbm, 2))
    blacklisted = any(s <= payload.frequency_mhz <= e for s, e in BLACKLISTED_RANGES)
    score = 0.0 if blacklisted else float(np.clip(snr / 40.0 * 100.0, 0.0, 100.0))

    if blacklisted:
        rec = "AVOID"
    elif snr >= 20:
        rec = "USE"
    else:
        rec = "MARGINAL"

    return ChannelScore(
        frequency_mhz=payload.frequency_mhz,
        score=round(score, 2),
        snr_db=snr,
        is_blacklisted=blacklisted,
        recommendation=rec,
    )
