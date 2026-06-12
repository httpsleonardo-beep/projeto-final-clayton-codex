"""
FleetGuard — Módulo de configuração do banco de dados.

Configura o SQLAlchemy síncrono com SQLite para persistência local.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# String de conexão SQLite — arquivo local fleetguard.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./fleetguard.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # Necessário para SQLite
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependência do FastAPI que fornece uma sessão do banco de dados.
    Garante que a sessão é fechada após o uso.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
