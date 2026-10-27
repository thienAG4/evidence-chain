import os
import pytest
from fastapi.testclient import TestClient

from app.db.session import engine, Base, init_db
from app.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    Base.metadata.drop_all(bind=engine)
    init_db()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
