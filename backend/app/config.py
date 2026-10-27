from functools import lru_cache
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )
    SEPOLIA_RPC_URL: str = "https://rpc.sepolia.org"
    PRIVATE_KEY: str = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
    CHAIN_ID: int = 11155111
    EXPLORER_BASE_URL: str = "https://sepolia.etherscan.io"
    TX_CONFIRM_TIMEOUT_S: int = 180
    LOW_BALANCE_ETH: float = 0.05
    MAX_UPLOAD_MB: int = 200
    STORE_FILES: bool = True
    STORAGE_DIR: str = "./storage/uploads"
    ALLOWED_EXTENSIONS: str = (
        "jpg,jpeg,png,gif,webp,heic,tiff,mp3,wav,m4a,aac,ogg,flac,"
        "mp4,mov,avi,mkv,webm,pdf,doc,docx,txt,rtf,odt,xls,xlsx,csv,"
        "ppt,pptx,json,xml,eml,zip"
    )
    DATABASE_URL: str = "sqlite:///./data/evidence.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "./logs"
    MOCK_BLOCKCHAIN: bool = False

@lru_cache
def get_settings() -> Settings:
    return Settings()
