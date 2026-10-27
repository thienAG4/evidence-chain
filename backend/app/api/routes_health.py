from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import get_settings
from app.services.blockchain_service import get_blockchain_service
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    settings = get_settings()
    bc = get_blockchain_service()
    try:
        conn = bc.check_connection()
        bal_str = conn.get("balance_eth", "0")
        try:
            bal_float = float(bal_str)
        except ValueError:
            bal_float = 0.0

        low_balance = bal_float < settings.LOW_BALANCE_ETH
        status = "degraded" if low_balance else "ok"

        return HealthResponse(
            status=status,
            network="sepolia",
            chain_id=conn.get("chain_id", settings.CHAIN_ID),
            latest_block=conn.get("latest_block"),
            wallet_address=bc.address,
            wallet_balance_eth=bal_str,
            low_balance=low_balance,
            time=datetime.now(timezone.utc)
        )
    except Exception:
        return HealthResponse(
            status="down",
            network="sepolia",
            chain_id=settings.CHAIN_ID,
            latest_block=None,
            wallet_address=bc.address,
            wallet_balance_eth=None,
            low_balance=True,
            time=datetime.now(timezone.utc)
        )
