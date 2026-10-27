from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str  # ok | degraded | down
    network: str = "sepolia"
    chain_id: int = 11155111
    latest_block: Optional[int] = None
    wallet_address: Optional[str] = None
    wallet_balance_eth: Optional[str] = None
    low_balance: bool = False
    time: datetime
