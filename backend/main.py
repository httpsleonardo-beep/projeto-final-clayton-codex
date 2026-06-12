"""
FleetGuard — Aplicação FastAPI principal.

Define todas as rotas da API e inicializa o servidor.
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from schemas import (
    UserCreate, UserRead,
    VehicleCreate, VehicleRead,
    MaintenanceCreate, MaintenanceRead,
    AlertRead,
    DashboardData,
    SmartScheduleResponse,
)
import crud

# ── Inicialização da Aplicação ─────────────────────────────────────────────────

app = FastAPI(
    title="FleetGuard API",
    description="API de gerenciamento de manutenção veicular — MVP SaaS",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup Event ─────────────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    """Cria todas as tabelas no banco de dados ao iniciar o servidor."""
    Base.metadata.create_all(bind=engine)


# ═══════════════════════════════════════════════════════════════════════════════
# Rotas — Usuários
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/users", response_model=list[UserRead], tags=["Usuários"])
def list_users(db: Session = Depends(get_db)):
    """Lista todos os usuários cadastrados."""
    users = crud.get_users(db)
    result = []
    for u in users:
        user_data = UserRead.model_validate(u)
        user_data.total_veiculos = len(u.vehicles)
        result.append(user_data)
    return result


@app.get("/api/users/{user_id}", response_model=UserRead, tags=["Usuários"])
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Retorna os detalhes de um usuário."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    user_data = UserRead.model_validate(user)
    user_data.total_veiculos = len(user.vehicles)
    return user_data


# ═══════════════════════════════════════════════════════════════════════════════
# Rotas — Dashboard
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/dashboard/{user_id}", response_model=DashboardData, tags=["Dashboard"])
def get_dashboard(user_id: int, db: Session = Depends(get_db)):
    """Retorna os dados agregados do dashboard para um usuário."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return crud.get_dashboard_data(db, user_id)


# ═══════════════════════════════════════════════════════════════════════════════
# Rotas — Veículos
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/vehicles/{user_id}", response_model=list[VehicleRead], tags=["Veículos"])
def list_vehicles(user_id: int, db: Session = Depends(get_db)):
    """Lista todos os veículos de um usuário."""
    return crud.get_vehicles_by_user(db, user_id)


@app.post("/api/vehicles", response_model=VehicleRead, status_code=201, tags=["Veículos"])
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    """
    Cria um novo veículo, validando os limites do plano do usuário.

    - GRATUITO: máximo 1 veículo
    - PREMIUM: ilimitado
    - EMPRESARIAL: ilimitado + recursos de frota
    """
    try:
        return crud.create_vehicle(db, vehicle)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/maintenances/{maintenance_id}", tags=["ManutenÃ§Ãµes"])
def delete_maintenance(maintenance_id: int, db: Session = Depends(get_db)):
    """Exclui uma ordem de servico pelo ID."""
    success = crud.delete_maintenance(db, maintenance_id)
    if not success:
        raise HTTPException(status_code=404, detail="Ordem de servico nao encontrada.")
    return {"detail": "Ordem de servico excluida com sucesso."}


@app.delete("/api/vehicles/{vehicle_id}", tags=["Veículos"])
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    """Exclui um veículo pelo ID."""
    success = crud.delete_vehicle(db, vehicle_id)
    if not success:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")
    return {"detail": "Veículo excluído com sucesso."}


# ═══════════════════════════════════════════════════════════════════════════════
# Rotas — Manutenções
# ═══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/api/maintenances/{vehicle_id}",
    response_model=list[MaintenanceRead],
    tags=["Manutenções"],
)
def list_maintenances_by_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    """Lista o histórico de manutenções de um veículo."""
    maintenances = crud.get_maintenances_by_vehicle(db, vehicle_id)
    return _serialize_maintenances(maintenances)


@app.get(
    "/api/maintenances/user/{user_id}",
    response_model=list[MaintenanceRead],
    tags=["Manutenções"],
)
def list_maintenances_by_user(user_id: int, db: Session = Depends(get_db)):
    """Lista todas as manutenções de todos os veículos de um usuário."""
    maintenances = crud.get_maintenances_by_user(db, user_id)
    return _serialize_maintenances(maintenances)


@app.post(
    "/api/maintenances",
    response_model=MaintenanceRead,
    status_code=201,
    tags=["Manutenções"],
)
def create_maintenance(maint: MaintenanceCreate, db: Session = Depends(get_db)):
    """
    Cria um novo registro de manutenção.

    Efeitos automáticos:
    - Atualiza km_atual do veículo
    - Recalcula alertas preventivos
    - Calcula data de vencimento da garantia
    """
    try:
        m = crud.create_maintenance(db, maint)
        return _serialize_maintenance(m)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# Rotas — Alertas
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/alerts/{user_id}", response_model=list[AlertRead], tags=["Alertas"])
def list_alerts(user_id: int, db: Session = Depends(get_db)):
    """Retorna todos os alertas ativos dos veículos de um usuário."""
    return crud.get_active_alerts_by_user(db, user_id)


# ═══════════════════════════════════════════════════════════════════════════════
# Rotas — Smart Schedule
# ═══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/api/smart-schedule/{vehicle_id}",
    response_model=SmartScheduleResponse,
    tags=["Smart Schedule"],
)
def get_smart_schedule(vehicle_id: int, db: Session = Depends(get_db)):
    """
    Retorna o agendamento inteligente de manutenção preventiva.

    Calcula os próximos serviços com base nos intervalos de km
    e classifica a urgência de cada um.
    """
    try:
        return crud.get_smart_schedule(db, vehicle_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# Rotas — Garantias
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/warranty-alerts/{user_id}", tags=["Garantias"])
def get_warranty_alerts(user_id: int, db: Session = Depends(get_db)):
    """Retorna alertas de garantias que vencem nos próximos 30 dias."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return crud.check_warranty_alerts(db, user_id)


# ═══════════════════════════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/health", tags=["Sistema"])
def health_check():
    """Verifica se a API está funcionando."""
    return {"status": "ok", "app": "FleetGuard", "version": "1.0.0"}


# ═══════════════════════════════════════════════════════════════════════════════
# Funções auxiliares
# ═══════════════════════════════════════════════════════════════════════════════

def _serialize_maintenance(m) -> dict:
    """Serializa uma manutenção com datas formatadas."""
    return {
        "id": m.id,
        "vehicle_id": m.vehicle_id,
        "categoria": m.categoria.value if hasattr(m.categoria, "value") else m.categoria,
        "data": m.data,
        "data_formatada": m.data.strftime("%d/%m/%Y") if m.data else None,
        "km_registro": m.km_registro,
        "valor": m.valor,
        "oficina": m.oficina,
        "mecanico": m.mecanico,
        "garantia_dias": m.garantia_dias,
        "garantia_vencimento": m.garantia_vencimento,
        "garantia_vencimento_formatada": (
            m.garantia_vencimento.strftime("%d/%m/%Y")
            if m.garantia_vencimento
            else None
        ),
    }


def _serialize_maintenances(maintenances: list) -> list[dict]:
    """Serializa uma lista de manutenções."""
    return [_serialize_maintenance(m) for m in maintenances]
