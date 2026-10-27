import logging
import threading
import time
import os
from typing import Optional, Dict, Any
from eth_account import Account
from web3 import Web3
from web3.exceptions import TimeExhausted
from app.config import get_settings
from app.core.errors import AppError

log = logging.getLogger("blockchain")
PREFIX = "EVD1:"

class BlockchainService:
    def __init__(self):
        s = get_settings()
        self.s = s
        self._lock = threading.Lock()
        self.mock_mode = s.MOCK_BLOCKCHAIN
        
        # In-memory mock storage for testing & offline mode
        self._mock_txs: Dict[str, Dict[str, Any]] = {}
        self._mock_nonce = 100
        self._mock_block = 7345200

        try:
            self.account = Account.from_key(s.PRIVATE_KEY)
            self.address = self.account.address
            log.info("Loaded system wallet address: %s", self.address)
        except Exception as e:
            # Fallback test account if key format invalid
            self.account = Account.create()
            self.address = self.account.address
            if not self.mock_mode:
                log.warning(
                    "PRIVATE_KEY trong cấu hình không hợp lệ (%s). "
                    "Hệ thống tạm thời tạo ví ngẫu nhiên: %s. "
                    "Lưu ý: PRIVATE_KEY phải là chuỗi Hex 64 ký tự (bắt đầu bằng 0x), không phải địa chỉ ví công khai (42 ký tự).",
                    e, self.address
                )

        if not self.mock_mode:
            try:
                self.w3 = Web3(Web3.HTTPProvider(s.SEPOLIA_RPC_URL, request_kwargs={"timeout": 15}))
            except Exception as e:
                log.warning("Could not initialize Web3 RPC provider, falling back to mock mode: %s", e)
                self.mock_mode = True
        else:
            self.w3 = None

    def check_connection(self) -> Dict[str, Any]:
        """Verify RPC connection, chain ID, and wallet balance."""
        if self.mock_mode:
            return {
                "chain_id": self.s.CHAIN_ID,
                "latest_block": self._mock_block,
                "balance_eth": "0.4821"
            }
        try:
            chain_id = self.w3.eth.chain_id
            block = self.w3.eth.block_number
            bal = self.w3.from_wei(self.w3.eth.get_balance(self.address), "ether")
        except Exception as e:
            raise AppError("CHAIN_UNAVAILABLE", "Không kết nối được RPC Sepolia.", 503) from e

        if chain_id != self.s.CHAIN_ID:
            raise AppError(
                "WRONG_NETWORK",
                f"RPC trả chain ID {chain_id}, cần {self.s.CHAIN_ID}.",
                503
            )
        return {"chain_id": chain_id, "latest_block": block, "balance_eth": str(bal)}

    def anchor_hash(self, sha256_hex: str) -> Dict[str, Any]:
        """Anchor SHA-256 hash onto Ethereum Sepolia via self-transfer EIP-1559 tx."""
        assert len(sha256_hex) == 64
        sha256_hex = sha256_hex.lower()
        data_str = PREFIX + sha256_hex
        data_hex = "0x" + data_str.encode("utf-8").hex()

        if self.mock_mode:
            with self._lock:
                self._mock_nonce += 1
                self._mock_block += 1
                tx_hash = "0x" + os.urandom(32).hex()
                now_ts = int(time.time())
                self._mock_txs[tx_hash.lower()] = {
                    "sha256": sha256_hex,
                    "input_raw": data_str,
                    "from": self.address,
                    "blockNumber": self._mock_block,
                    "timestamp": now_ts,
                    "status": 1
                }
                log.info("Mock TX sent %s nonce=%s data=%s", tx_hash, self._mock_nonce, data_str)
                return {
                    "tx_hash": tx_hash,
                    "nonce": self._mock_nonce,
                    "gas": 22400,
                    "max_fee": 2000000000
                }

        last_err = None
        for attempt in range(3):
            try:
                with self._lock:
                    nonce = self.w3.eth.get_transaction_count(self.address, "pending")
                    latest_block = self.w3.eth.get_block("latest")
                    base = latest_block.get("baseFeePerGas", 1000000000)
                    tip = self.w3.to_wei(2, "gwei")
                    tx = {
                        "type": 2,
                        "chainId": self.s.CHAIN_ID,
                        "nonce": nonce,
                        "from": self.address,
                        "to": self.address,
                        "value": 0,
                        "data": data_hex,
                        "maxPriorityFeePerGas": tip,
                        "maxFeePerGas": base * 2 + tip,
                    }
                    tx["gas"] = int(self.w3.eth.estimate_gas(tx) * 1.2)
                    signed = self.account.sign_transaction(tx)
                    tx_hash = self.w3.to_hex(self.w3.eth.send_raw_transaction(signed.raw_transaction))
                    log.info("TX sent %s nonce=%s gas=%s", tx_hash, nonce, tx["gas"])
                    return {
                        "tx_hash": tx_hash,
                        "nonce": nonce,
                        "gas": tx["gas"],
                        "max_fee": tx["maxFeePerGas"]
                    }
            except Exception as e:
                msg = str(e).lower()
                if "insufficient funds" in msg:
                    raise AppError("INSUFFICIENT_FUNDS", "Ví hệ thống không đủ ETH trả phí gas.", 503) from e
                last_err = e
                log.warning("anchor attempt %s failed: %s", attempt + 1, e)
                time.sleep(2 ** attempt)

        raise AppError("CHAIN_UNAVAILABLE", "Không gửi được giao dịch lên Sepolia.", 503) from last_err

    def wait_confirmation(self, tx_hash: str) -> Dict[str, Any]:
        """Wait for transaction receipt and confirm status."""
        tx_hash_lower = tx_hash.lower()
        if self.mock_mode:
            time.sleep(1.0)
            mock_data = self._mock_txs.get(tx_hash_lower)
            if not mock_data:
                return {"ok": False, "error": "Giao dịch không tồn tại trên mạng thử nghiệm."}
            return {
                "ok": True,
                "block_number": mock_data["blockNumber"],
                "block_timestamp": mock_data["timestamp"]
            }

        try:
            r = self.w3.eth.wait_for_transaction_receipt(
                tx_hash,
                timeout=self.s.TX_CONFIRM_TIMEOUT_S,
                poll_latency=3
            )
        except TimeExhausted:
            return {"ok": False, "error": "Hết thời gian chờ xác nhận."}
        except Exception as e:
            return {"ok": False, "error": f"Lỗi truy vấn receipt: {e}"}

        if r.get("status") != 1:
            return {"ok": False, "error": "Giao dịch bị revert."}

        block = self.w3.eth.get_block(r["blockNumber"])
        return {
            "ok": True,
            "block_number": r["blockNumber"],
            "block_timestamp": block["timestamp"]
        }

    def read_anchor(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Read transaction directly from chain and parse EVD1:<sha256> payload."""
        tx_hash_lower = tx_hash.lower()
        if self.mock_mode:
            mock_data = self._mock_txs.get(tx_hash_lower)
            if not mock_data:
                return None
            return {
                "sha256": mock_data["sha256"],
                "valid_format": True,
                "from": mock_data["from"],
                "issuer_is_system_wallet": mock_data["from"].lower() == self.address.lower(),
                "block_number": mock_data["blockNumber"],
                "block_timestamp": mock_data["timestamp"],
                "confirmed": True
            }

        try:
            tx = self.w3.eth.get_transaction(tx_hash)
        except Exception:
            return None

        try:
            raw = bytes(tx["input"]).decode("utf-8", errors="ignore")
        except Exception:
            raw = ""

        valid = raw.startswith(PREFIX) and len(raw) == len(PREFIX) + 64
        r = None
        try:
            r = self.w3.eth.get_transaction_receipt(tx_hash)
        except Exception:
            pass

        ts = None
        if r and "blockNumber" in r:
            try:
                block = self.w3.eth.get_block(r["blockNumber"])
                ts = block["timestamp"]
            except Exception:
                pass

        return {
            "sha256": raw[len(PREFIX):].lower() if valid else None,
            "valid_format": valid,
            "from": tx["from"],
            "issuer_is_system_wallet": tx["from"].lower() == self.address.lower(),
            "block_number": r["blockNumber"] if r else None,
            "block_timestamp": ts,
            "confirmed": bool(r and r.get("status") == 1),
        }

_blockchain_service = None

def get_blockchain_service() -> BlockchainService:
    global _blockchain_service
    if _blockchain_service is None:
        _blockchain_service = BlockchainService()
    return _blockchain_service
