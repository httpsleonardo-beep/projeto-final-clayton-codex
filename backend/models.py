"""
FleetGuard — Modelos ORM do banco de dados.

Define as tabelas: User, Vehicle, Maintenance e Alert.
"""

import enum
from datetime import date

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, ForeignKey, Enum
)
from sqlalchemy.orm import relationship

from database import Base


# ── Enums ──────────────────────────────────────────────────────────────────────

class PlanoEnum(str, enum.Enum):
    """Planos disponíveis para o usuário."""
    GRATUITO = "GRATUITO"
    PREMIUM = "PREMIUM"
    EMPRESARIAL = "EMPRESARIAL"


class TipoVeiculoEnum(str, enum.Enum):
    """Tipos de veículo suportados."""
    CARRO = "CARRO"
    MOTO = "MOTO"
    CAMINHAO = "CAMINHAO"


class StatusVeiculoEnum(str, enum.Enum):
    """Status possíveis do veículo."""
    ATIVO = "ATIVO"
    EM_MANUTENCAO = "EM_MANUTENCAO"


class CategoriaManutencaoEnum(str, enum.Enum):
    """Categorias de manutenção."""
    OLEO = "OLEO"
    PNEUS = "PNEUS"
    FREIOS = "FREIOS"
    REVISAO = "REVISAO"


class UrgenciaEnum(str, enum.Enum):
    """Níveis de urgência para alertas."""
    BAIXA = "BAIXA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    CRITICA = "CRITICA"


# ── Modelos ────────────────────────────────────────────────────────────────────

class User(Base):
    """Modelo de usuário do sistema."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    plano = Column(Enum(PlanoEnum), nullable=False, default=PlanoEnum.GRATUITO)
    empresa_nome = Column(String(200), nullable=True)

    # Relacionamentos
    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")


class Vehicle(Base):
    """Modelo de veículo."""
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(Enum(TipoVeiculoEnum), nullable=False)
    marca = Column(String(100), nullable=False)
    modelo = Column(String(100), nullable=False)
    ano = Column(Integer, nullable=False)
    placa = Column(String(10), unique=True, nullable=False, index=True)
    renavam = Column(String(20), nullable=True)
    km_atual = Column(Float, nullable=False, default=0)
    status = Column(Enum(StatusVeiculoEnum), nullable=False, default=StatusVeiculoEnum.ATIVO)
    saude_percentual = Column(Integer, nullable=False, default=100)

    # Relacionamentos
    owner = relationship("User", back_populates="vehicles")
    maintenances = relationship("Maintenance", back_populates="vehicle", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="vehicle", cascade="all, delete-orphan")


class Maintenance(Base):
    """Modelo de registro de manutenção."""
    __tablename__ = "maintenances"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    categoria = Column(Enum(CategoriaManutencaoEnum), nullable=False)
    data = Column(Date, nullable=False, default=date.today)
    km_registro = Column(Float, nullable=False)
    valor = Column(Float, nullable=False, default=0)
    oficina = Column(String(200), nullable=True)
    mecanico = Column(String(200), nullable=True)
    garantia_dias = Column(Integer, nullable=False, default=0)
    garantia_vencimento = Column(Date, nullable=True)

    # Relacionamentos
    vehicle = relationship("Vehicle", back_populates="maintenances")


class Alert(Base):
    """Modelo de alerta do sistema."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(String(100), nullable=False)
    mensagem = Column(String(500), nullable=False)
    urgencia = Column(Enum(UrgenciaEnum), nullable=False, default=UrgenciaEnum.MEDIA)
    ativo = Column(Boolean, nullable=False, default=True)

    # Relacionamentos
    vehicle = relationship("Vehicle", back_populates="alerts")
