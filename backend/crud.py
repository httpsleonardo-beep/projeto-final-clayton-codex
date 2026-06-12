"""
FleetGuard — Operações CRUD e lógica de negócio.

Contém todas as operações de banco de dados e os algoritmos
de agendamento inteligente e verificação de garantias.
"""

from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from models import (
    User, Vehicle, Maintenance, Alert,
    PlanoEnum, StatusVeiculoEnum, CategoriaManutencaoEnum, UrgenciaEnum,
)
from schemas import (
    UserCreate, VehicleCreate, MaintenanceCreate, AlertCreate,
    DashboardData, SmartScheduleItem, SmartScheduleResponse,
)


# ── Limites por plano ─────────────────────────────────────────────────────────

LIMITE_VEICULOS_POR_PLANO = {
    PlanoEnum.GRATUITO: 1,
    PlanoEnum.PREMIUM: None,       # Ilimitado
    PlanoEnum.EMPRESARIAL: None,   # Ilimitado + recursos de frota
}

# Intervalos de manutenção preventiva (em km)
INTERVALOS_MANUTENCAO = {
    CategoriaManutencaoEnum.OLEO: {
        "nome": "Troca de Óleo",
        "intervalo_km": 10_000,
    },
    CategoriaManutencaoEnum.PNEUS: {
        "nome": "Rodízio de Pneus",
        "intervalo_km": 20_000,
    },
    CategoriaManutencaoEnum.FREIOS: {
        "nome": "Pastilhas de Freio",
        "intervalo_km": 30_000,
    },
    CategoriaManutencaoEnum.REVISAO: {
        "nome": "Revisão Geral",
        "intervalo_km": 40_000,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD — Usuários
# ═══════════════════════════════════════════════════════════════════════════════

def get_users(db: Session) -> list[User]:
    """Retorna todos os usuários."""
    return db.query(User).all()


def get_user(db: Session, user_id: int) -> Optional[User]:
    """Retorna um usuário pelo ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Retorna um usuário pelo e-mail."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    """Cria um novo usuário."""
    db_user = User(
        nome=user_data.nome,
        email=user_data.email,
        plano=user_data.plano,
        empresa_nome=user_data.empresa_nome,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD — Veículos
# ═══════════════════════════════════════════════════════════════════════════════

def get_vehicles_by_user(db: Session, user_id: int) -> list[Vehicle]:
    """Retorna todos os veículos de um usuário."""
    return db.query(Vehicle).filter(Vehicle.user_id == user_id).all()


def get_vehicle(db: Session, vehicle_id: int) -> Optional[Vehicle]:
    """Retorna um veículo pelo ID."""
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()


def create_vehicle(db: Session, vehicle_data: VehicleCreate) -> Vehicle:
    """
    Cria um novo veículo, respeitando os limites do plano do usuário.

    Raises:
        ValueError: Se o limite de veículos do plano foi atingido.
    """
    user = get_user(db, vehicle_data.user_id)
    if not user:
        raise ValueError("Usuário não encontrado.")

    # Verificar limite do plano
    plano = PlanoEnum(user.plano)
    limite = LIMITE_VEICULOS_POR_PLANO.get(plano)
    if limite is not None:
        count = db.query(Vehicle).filter(Vehicle.user_id == user.id).count()
        if count >= limite:
            raise ValueError(
                f"Limite de veículos atingido para o plano {plano.value}. "
                f"Máximo: {limite} veículo(s). Faça upgrade para adicionar mais."
            )

    db_vehicle = Vehicle(
        user_id=vehicle_data.user_id,
        tipo=vehicle_data.tipo,
        marca=vehicle_data.marca,
        modelo=vehicle_data.modelo,
        ano=vehicle_data.ano,
        placa=vehicle_data.placa,
        renavam=vehicle_data.renavam,
        km_atual=vehicle_data.km_atual,
        status=vehicle_data.status,
        saude_percentual=vehicle_data.saude_percentual,
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


def delete_vehicle(db: Session, vehicle_id: int) -> bool:
    """
    Exclui um veículo pelo ID.

    Returns:
        True se o veículo foi excluído, False se não foi encontrado.
    """
    vehicle = get_vehicle(db, vehicle_id)
    if not vehicle:
        return False
    db.delete(vehicle)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD — Manutenções
# ═══════════════════════════════════════════════════════════════════════════════

def get_maintenances_by_vehicle(db: Session, vehicle_id: int) -> list[Maintenance]:
    """Retorna todas as manutenções de um veículo, ordenadas por data desc."""
    return (
        db.query(Maintenance)
        .filter(Maintenance.vehicle_id == vehicle_id)
        .order_by(Maintenance.data.desc())
        .all()
    )


def get_maintenances_by_user(db: Session, user_id: int) -> list[Maintenance]:
    """Retorna todas as manutenções de todos os veículos de um usuário."""
    vehicle_ids = [
        v.id for v in db.query(Vehicle).filter(Vehicle.user_id == user_id).all()
    ]
    if not vehicle_ids:
        return []
    return (
        db.query(Maintenance)
        .filter(Maintenance.vehicle_id.in_(vehicle_ids))
        .order_by(Maintenance.data.desc())
        .all()
    )


def get_maintenance(db: Session, maintenance_id: int) -> Optional[Maintenance]:
    """Retorna uma manutencao pelo ID."""
    return db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()


def create_maintenance(db: Session, maint_data: MaintenanceCreate) -> Maintenance:
    """
    Cria um novo registro de manutenção.

    Efeitos colaterais:
    - Atualiza o km_atual do veículo se o km_registro for maior.
    - Calcula automaticamente a data de vencimento da garantia.
    - Recalcula alertas do veículo.
    """
    vehicle = get_vehicle(db, maint_data.vehicle_id)
    if not vehicle:
        raise ValueError("Veículo não encontrado.")

    # Calcular vencimento da garantia
    garantia_vencimento = None
    if maint_data.garantia_dias > 0:
        garantia_vencimento = maint_data.data + timedelta(days=maint_data.garantia_dias)

    db_maint = Maintenance(
        vehicle_id=maint_data.vehicle_id,
        categoria=maint_data.categoria,
        data=maint_data.data,
        km_registro=maint_data.km_registro,
        valor=maint_data.valor,
        oficina=maint_data.oficina,
        mecanico=maint_data.mecanico,
        garantia_dias=maint_data.garantia_dias,
        garantia_vencimento=garantia_vencimento,
    )
    db.add(db_maint)

    # Atualizar km do veículo se necessário
    if maint_data.km_registro > vehicle.km_atual:
        vehicle.km_atual = maint_data.km_registro

    db.commit()
    db.refresh(db_maint)

    # Recalcular alertas para o veículo
    _recalculate_vehicle_alerts(db, vehicle)

    return db_maint


def delete_maintenance(db: Session, maintenance_id: int) -> bool:
    """
    Exclui uma manutencao pelo ID.

    Returns:
        True se a manutencao foi excluida, False se nao foi encontrada.
    """
    maintenance = get_maintenance(db, maintenance_id)
    if not maintenance:
        return False

    vehicle = maintenance.vehicle
    db.delete(maintenance)
    db.commit()

    if vehicle:
        _recalculate_vehicle_alerts(db, vehicle)

    return True


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD — Alertas
# ═══════════════════════════════════════════════════════════════════════════════

def get_active_alerts_by_user(db: Session, user_id: int) -> list[Alert]:
    """Retorna todos os alertas ativos dos veículos de um usuário."""
    vehicle_ids = [
        v.id for v in db.query(Vehicle).filter(Vehicle.user_id == user_id).all()
    ]
    if not vehicle_ids:
        return []
    return (
        db.query(Alert)
        .filter(Alert.vehicle_id.in_(vehicle_ids), Alert.ativo == True)
        .all()
    )


def create_alert(db: Session, alert_data: AlertCreate) -> Alert:
    """Cria um novo alerta."""
    db_alert = Alert(
        vehicle_id=alert_data.vehicle_id,
        tipo=alert_data.tipo,
        mensagem=alert_data.mensagem,
        urgencia=alert_data.urgencia,
        ativo=alert_data.ativo,
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


# ═══════════════════════════════════════════════════════════════════════════════
# Lógica de Negócio — Dashboard
# ═══════════════════════════════════════════════════════════════════════════════

def get_dashboard_data(db: Session, user_id: int) -> DashboardData:
    """
    Calcula e retorna os dados agregados do dashboard para um usuário.

    Métricas calculadas:
    - Total de veículos
    - Veículos em manutenção
    - Gasto mensal (mês corrente)
    - Alertas de garantia (garantias vencendo em 30 dias)
    - Custos por categoria (soma total)
    - Custo por km (custo total / soma de todos os km atuais)
    """
    vehicles = get_vehicles_by_user(db, user_id)
    if not vehicles:
        return DashboardData()

    vehicle_ids = [v.id for v in vehicles]

    # Total de veículos e em manutenção
    total_veiculos = len(vehicles)
    em_manutencao = sum(
        1 for v in vehicles if v.status == StatusVeiculoEnum.EM_MANUTENCAO
    )

    # Gasto mensal — manutenções do mês corrente
    hoje = date.today()
    primeiro_dia_mes = hoje.replace(day=1)
    gasto_mensal = (
        db.query(func.coalesce(func.sum(Maintenance.valor), 0))
        .filter(
            Maintenance.vehicle_id.in_(vehicle_ids),
            Maintenance.data >= primeiro_dia_mes,
            Maintenance.data <= hoje,
        )
        .scalar()
    ) or 0.0

    # Alertas de garantia — garantias vencendo em 30 dias
    limite_garantia = hoje + timedelta(days=30)
    alertas_garantia = (
        db.query(Maintenance)
        .filter(
            Maintenance.vehicle_id.in_(vehicle_ids),
            Maintenance.garantia_vencimento != None,
            Maintenance.garantia_vencimento >= hoje,
            Maintenance.garantia_vencimento <= limite_garantia,
        )
        .count()
    )

    # Custos por categoria — soma total de todas as manutenções
    custos_por_categoria: dict[str, float] = {}
    resultados = (
        db.query(
            Maintenance.categoria,
            func.coalesce(func.sum(Maintenance.valor), 0),
        )
        .filter(Maintenance.vehicle_id.in_(vehicle_ids))
        .group_by(Maintenance.categoria)
        .all()
    )
    for categoria, total in resultados:
        custos_por_categoria[categoria] = round(float(total), 2)

    # Custo por km
    custo_total = sum(custos_por_categoria.values())
    km_total = sum(v.km_atual for v in vehicles)
    custo_por_km = round(custo_total / km_total, 4) if km_total > 0 else 0.0

    return DashboardData(
        total_veiculos=total_veiculos,
        em_manutencao=em_manutencao,
        gasto_mensal=round(float(gasto_mensal), 2),
        alertas_garantia=alertas_garantia,
        custos_por_categoria=custos_por_categoria,
        custo_por_km=custo_por_km,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Lógica de Negócio — Smart Schedule (Agendamento Inteligente)
# ═══════════════════════════════════════════════════════════════════════════════

def get_smart_schedule(db: Session, vehicle_id: int) -> SmartScheduleResponse:
    """
    Calcula o agendamento inteligente de manutenção preventiva.

    Regras de intervalo:
    - Troca de óleo: a cada 10.000 km
    - Rodízio de pneus: a cada 20.000 km
    - Pastilhas de freio: a cada 30.000 km
    - Revisão geral: a cada 40.000 km

    Para cada categoria, encontra a última manutenção realizada e calcula
    quantos km faltam para a próxima, classificando a urgência.
    """
    vehicle = get_vehicle(db, vehicle_id)
    if not vehicle:
        raise ValueError("Veículo não encontrado.")

    servicos: list[SmartScheduleItem] = []

    for categoria, info in INTERVALOS_MANUTENCAO.items():
        # Buscar última manutenção desta categoria para o veículo
        ultima = (
            db.query(Maintenance)
            .filter(
                Maintenance.vehicle_id == vehicle_id,
                Maintenance.categoria == categoria,
            )
            .order_by(Maintenance.km_registro.desc())
            .first()
        )

        km_ultima = ultima.km_registro if ultima else 0
        km_proxima = km_ultima + info["intervalo_km"]
        km_restantes = km_proxima - vehicle.km_atual

        # Determinar urgência com base nos km restantes
        if km_restantes <= 0:
            urgencia = UrgenciaEnum.CRITICA.value
            mensagem = f"{info['nome']} ATRASADA! Deveria ter sido feita há {abs(int(km_restantes))} km."
        elif km_restantes <= 500:
            urgencia = UrgenciaEnum.CRITICA.value
            mensagem = f"{info['nome']} urgente! Faltam apenas {int(km_restantes)} km."
        elif km_restantes <= 2000:
            urgencia = UrgenciaEnum.ALTA.value
            mensagem = f"{info['nome']} em breve. Faltam {int(km_restantes)} km."
        elif km_restantes <= 5000:
            urgencia = UrgenciaEnum.MEDIA.value
            mensagem = f"{info['nome']} programada. Faltam {int(km_restantes)} km."
        else:
            urgencia = UrgenciaEnum.BAIXA.value
            mensagem = f"{info['nome']} em dia. Próxima em {int(km_restantes)} km."

        servicos.append(
            SmartScheduleItem(
                servico=info["nome"],
                categoria=categoria.value,
                km_intervalo=info["intervalo_km"],
                km_ultima_manutencao=km_ultima,
                km_proxima=km_proxima,
                km_restantes=km_restantes,
                urgencia=urgencia,
                mensagem=mensagem,
            )
        )

    # Ordenar por urgência (mais urgente primeiro, depois por km_restantes)
    ordem_urgencia = {
        UrgenciaEnum.CRITICA.value: 0,
        UrgenciaEnum.ALTA.value: 1,
        UrgenciaEnum.MEDIA.value: 2,
        UrgenciaEnum.BAIXA.value: 3,
    }
    servicos.sort(key=lambda s: (ordem_urgencia.get(s.urgencia, 99), s.km_restantes))

    return SmartScheduleResponse(
        vehicle_id=vehicle.id,
        veiculo=f"{vehicle.marca} {vehicle.modelo} {vehicle.ano}",
        km_atual=vehicle.km_atual,
        servicos=servicos,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Lógica de Negócio — Verificação de Garantias
# ═══════════════════════════════════════════════════════════════════════════════

def check_warranty_alerts(db: Session, user_id: int) -> list[dict]:
    """
    Verifica garantias que vencem nos próximos 30 dias.

    Retorna lista de dicts com informações da garantia próxima do vencimento.
    """
    vehicles = get_vehicles_by_user(db, user_id)
    if not vehicles:
        return []

    vehicle_ids = [v.id for v in vehicles]
    vehicle_map = {v.id: v for v in vehicles}

    hoje = date.today()
    limite = hoje + timedelta(days=30)

    manutencoes = (
        db.query(Maintenance)
        .filter(
            Maintenance.vehicle_id.in_(vehicle_ids),
            Maintenance.garantia_vencimento != None,
            Maintenance.garantia_vencimento >= hoje,
            Maintenance.garantia_vencimento <= limite,
        )
        .order_by(Maintenance.garantia_vencimento.asc())
        .all()
    )

    alertas = []
    for m in manutencoes:
        v = vehicle_map[m.vehicle_id]
        dias_restantes = (m.garantia_vencimento - hoje).days
        alertas.append({
            "veiculo": f"{v.marca} {v.modelo} ({v.placa})",
            "servico": m.categoria,
            "oficina": m.oficina,
            "garantia_vencimento": m.garantia_vencimento.strftime("%d/%m/%Y"),
            "dias_restantes": dias_restantes,
            "urgencia": (
                UrgenciaEnum.CRITICA.value if dias_restantes <= 7
                else UrgenciaEnum.ALTA.value if dias_restantes <= 15
                else UrgenciaEnum.MEDIA.value
            ),
        })

    return alertas


# ═══════════════════════════════════════════════════════════════════════════════
# Funções auxiliares internas
# ═══════════════════════════════════════════════════════════════════════════════

def _recalculate_vehicle_alerts(db: Session, vehicle: Vehicle) -> None:
    """
    Recalcula os alertas automáticos de um veículo com base nas manutenções.

    Desativa alertas antigos e cria novos conforme necessidade.
    """
    # Desativar alertas automáticos antigos
    db.query(Alert).filter(
        Alert.vehicle_id == vehicle.id,
        Alert.tipo.like("AUTO_%"),
    ).update({"ativo": False}, synchronize_session="fetch")

    # Verificar cada categoria de manutenção
    for categoria, info in INTERVALOS_MANUTENCAO.items():
        ultima = (
            db.query(Maintenance)
            .filter(
                Maintenance.vehicle_id == vehicle.id,
                Maintenance.categoria == categoria,
            )
            .order_by(Maintenance.km_registro.desc())
            .first()
        )

        km_ultima = ultima.km_registro if ultima else 0
        km_proxima = km_ultima + info["intervalo_km"]
        km_restantes = km_proxima - vehicle.km_atual

        # Criar alerta se estiver dentro da faixa de atenção (2000 km ou menos)
        if km_restantes <= 2000:
            if km_restantes <= 0:
                urgencia = UrgenciaEnum.CRITICA
                msg = (
                    f"{info['nome']} ATRASADA - {vehicle.marca} {vehicle.modelo}: "
                    f"Deveria ter sido feita há {abs(int(km_restantes))} km!"
                )
            elif km_restantes <= 500:
                urgencia = UrgenciaEnum.CRITICA
                msg = (
                    f"{info['nome']} - {vehicle.marca} {vehicle.modelo}: "
                    f"Vence em {int(km_restantes)} km"
                )
            else:
                urgencia = UrgenciaEnum.ALTA
                msg = (
                    f"{info['nome']} - {vehicle.marca} {vehicle.modelo}: "
                    f"Faltam {int(km_restantes)} km"
                )

            alerta = Alert(
                vehicle_id=vehicle.id,
                tipo=f"AUTO_{categoria.value}",
                mensagem=msg,
                urgencia=urgencia,
                ativo=True,
            )
            db.add(alerta)

    db.commit()
