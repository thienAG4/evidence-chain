import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

s = get_settings()

db_dir = os.path.dirname(s.DATABASE_URL.replace("sqlite:///", ""))
if db_dir:
    os.makedirs(db_dir, exist_ok=True)

engine = create_engine(
    s.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in s.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import app.models.evidence  # noqa: F401
    import app.models.audit_log  # noqa: F401
    Base.metadata.create_all(bind=engine)
