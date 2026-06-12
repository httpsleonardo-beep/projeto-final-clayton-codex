"""
FleetGuard — Schemas Pydantic V2 para validação de dados.

Define os modelos de entrada e saída da API.
"""

from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ── User Schemas ───────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Schema para criação de usuário."""
    nome: str
    email: str
    plano: str = "GRATUITO"
    empresa_nome: Optional[str] = None


class UserRead(BaseModel):
    """Schema de leitura de usuário."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    plano: str
    empresa_nome: Optional[str] = None
    total_veiculos: Optional[int] = None


# ── Vehicle Schemas ────────────────────────────────────────────────────────────

class VehicleCreate(BaseModel):
    """Schema para criação de veículo."""
    user_id: int
    tipo: str
    marca: str
    modelo: str
    ano: int
    placa: str
    renavam: Optional[str] = None
    km_atual: float = 0
    status: str = "ATIVO"
    saude_percentual: int = 100


class VehicleRead(BaseModel):
    """Schema de leitura de veículo."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    tipo: str
    marca: str
    modelo: str
    ano: int
    placa: str
    renavam: Optional[str] = None
    km_atual: float
    status: str
    saude_percentual: int


# ── Maintenance Schemas ────────────────────────────────────────────────────────

class MaintenanceCreate(BaseModel):
    """Schema para criação de manutenção."""
    vehicle_id: int
    categoria: str
    data: date
    km_registro: float
    valor: float = 0
    oficina: Optional[str] = None
    mecanico: Optional[str] = None
    garantia_dias: int = 0


class MaintenanceRead(BaseModel):
    """Schema de leitura de manutenção."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    categoria: str
    data: date
    data_formatada: Optional[str] = None
    km_registro: float
    valor: float
    oficina: Optional[str] = None
    mecanico: Optional[str] = None
    garantia_dias: int
    garantia_vencimento: Optional[date] = None
    garantia_vencimento_formatada: Optional[str] = None

    @field_validator("data_formatada", mode="before")
    @classmethod
    def format_data(cls, v, info):
        """Formata a data para dd/mm/yyyy."""
        data_val = info.data.get("data")
        if data_val:
            return data_val.strftime("%d/%m/%Y")
        return v

    @field_validator("garantia_vencimento_formatada", mode="before")
    @classmethod
    def format_garantia(cls, v, info):
        """Formata a data de vencimento da garantia para dd/mm/yyyy."""
        garantia_val = info.data.get("garantia_vencimento")
        if garantia_val:
            return garantia_val.strftime("%d/%m/%Y")
        return v


# ── Alert Schemas ──────────────────────────────────────────────────────────────

class AlertCreate(BaseModel):
    """Schema para criação de alerta."""
    vehicle_id: int
    tipo: str
    mensagem: str
    urgencia: str = "MEDIA"
    ativo: bool = True


class AlertRead(BaseModel):
    """Schema de leitura de alerta."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    tipo: str
    mensagem: str
    urgencia: str
    ativo: bool


# ── Dashboard Schema ──────────────────────────────────────────────────────────

class DashboardData(BaseModel):
    """Schema com dados agregados para o dashboard."""
    total_veiculos: int = 0
    em_manutencao: int = 0
    gasto_mensal: float = 0.0
    alertas_garantia: int = 0
    custos_por_categoria: dict[str, float] = Field(default_factory=dict)
    custo_por_km: float = 0.0


# ── Smart Schedule Schema ────────────────────────────────────────────────────

class SmartScheduleItem(BaseModel):
    """Item individual do agendamento inteligente."""
    servico: str
    categoria: str
    km_intervalo: int
    km_ultima_manutencao: float
    km_proxima: float
    km_restantes: float
    urgencia: str
    mensagem: str


class SmartScheduleResponse(BaseModel):
    """Resposta completa do agendamento inteligente."""
    vehicle_id: int
    veiculo: str
    km_atual: float
    servicos: list[SmartScheduleItem] = Field(default_factory=list)
