"""Channel scoring router."""

from fastapi import APIRouter
from app.schemas import ChannelScanInput, ChannelScore
from app.services.scoring_service import score_channel

router = APIRouter()


@router.post("/channel", response_model=ChannelScore)
def score(payload: ChannelScanInput) -> ChannelScore:
    """Score a single channel based on SNR and compliance."""
    return score_channel(payload)
