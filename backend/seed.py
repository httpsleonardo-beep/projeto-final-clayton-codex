"""
FleetGuard -- carga inicial do banco de dados.

Cria cenarios prontos para demonstracao:
1. Cleytin -- usuario Premium Individual.
2. Construmil Logistica -- usuario Empresarial com frota e alertas.

Uso:
    python seed.py
"""

import sys
from datetime import date, timedelta

from database import Base, SessionLocal, engine
from models import (
    Alert,
    CategoriaManutencaoEnum,
    Maintenance,
    PlanoEnum,
    StatusVeiculoEnum,
    TipoVeiculoEnum,
    UrgenciaEnum,
    User,
    Vehicle,
)


def seed():
    """Executa a carga inicial do banco de dados."""

    today = date.today()

    def recent(days_back: int) -> date:
        """Mantem despesas no mes corrente sempre que possivel."""
        safe_days = min(days_back, max(today.day - 1, 0))
        return today - timedelta(days=safe_days)

    def warranty_service(expire_in_days: int, warranty_days: int = 180) -> date:
        return today + timedelta(days=expire_in_days) - timedelta(days=warranty_days)

    print("=" * 64)
    print("  FleetGuard -- Seed do Banco de Dados")
    print("=" * 64)

    print("\n[DEL] Removendo tabelas existentes...")
    Base.metadata.drop_all(bind=engine)
    print("[OK] Tabelas removidas.")

    print("[BUILD] Criando tabelas...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Tabelas criadas com sucesso.")

    db = SessionLocal()

    try:
        print("\n" + "-" * 64)
        print("[CENARIO 1] Cleytin -- Premium Individual")
        print("-" * 64)

        leonardo = User(
            nome="Cleytin",
            email="leonardo@email.com",
            plano=PlanoEnum.PREMIUM,
            empresa_nome=None,
        )
        db.add(leonardo)
        db.flush()

        civic = Vehicle(
            user_id=leonardo.id,
            tipo=TipoVeiculoEnum.CARRO,
            marca="Honda",
            modelo="Civic",
            ano=2022,
            placa="RIO-2A45",
            renavam="12345678901",
            km_atual=49750,
            status=StatusVeiculoEnum.ATIVO,
            saude_percentual=72,
        )
        xj6 = Vehicle(
            user_id=leonardo.id,
            tipo=TipoVeiculoEnum.MOTO,
            marca="Yamaha",
            modelo="XJ6",
            ano=2023,
            placa="RJX-8B12",
            renavam="98765432109",
            km_atual=12500,
            status=StatusVeiculoEnum.ATIVO,
            saude_percentual=95,
        )
        db.add_all([civic, xj6])
        db.flush()

        db.add_all(
            [
                Maintenance(
                    vehicle_id=civic.id,
                    categoria=CategoriaManutencaoEnum.OLEO,
                    data=recent(5),
                    km_registro=40050,
                    valor=320.00,
                    oficina="Auto Center Madureira",
                    mecanico="Carlos Mecânico",
                    garantia_dias=120,
                    garantia_vencimento=recent(5) + timedelta(days=120),
                ),
                Maintenance(
                    vehicle_id=civic.id,
                    categoria=CategoriaManutencaoEnum.FREIOS,
                    data=recent(9),
                    km_registro=38000,
                    valor=520.00,
                    oficina="Freios Express",
                    mecanico="Roberto Lima",
                    garantia_dias=365,
                    garantia_vencimento=recent(9) + timedelta(days=365),
                ),
                Maintenance(
                    vehicle_id=xj6.id,
                    categoria=CategoriaManutencaoEnum.REVISAO,
                    data=recent(3),
                    km_registro=10000,
                    valor=430.00,
                    oficina="Moto Tech",
                    mecanico="Anderson Souza",
                    garantia_dias=90,
                    garantia_vencimento=recent(3) + timedelta(days=90),
                ),
                Alert(
                    vehicle_id=civic.id,
                    tipo="AUTO_OLEO",
                    mensagem="Troca de Óleo - Honda Civic: vence em 300 km",
                    urgencia=UrgenciaEnum.CRITICA,
                    ativo=True,
                ),
            ]
        )

        print(f"  [USER] {leonardo.nome} | {leonardo.plano.value} | 2 veiculos")

        print("\n" + "-" * 64)
        print("[CENARIO 2] Construmil Logistica -- Empresarial")
        print("-" * 64)

        construmil = User(
            nome="Construmil Logística",
            email="frota@construmil.com.br",
            plano=PlanoEnum.EMPRESARIAL,
            empresa_nome="Construmil Logística",
        )
        db.add(construmil)
        db.flush()

        scania = Vehicle(
            user_id=construmil.id,
            tipo=TipoVeiculoEnum.CAMINHAO,
            marca="Scania",
            modelo="R450",
            ano=2021,
            placa="KMT-3C78",
            renavam="11223344556",
            km_atual=185000,
            status=StatusVeiculoEnum.EM_MANUTENCAO,
            saude_percentual=35,
        )
        volvo = Vehicle(
            user_id=construmil.id,
            tipo=TipoVeiculoEnum.CAMINHAO,
            marca="Volvo",
            modelo="FH540",
            ano=2020,
            placa="LQR-5D91",
            renavam="55667788990",
            km_atual=220000,
            status=StatusVeiculoEnum.ATIVO,
            saude_percentual=60,
        )
        mercedes = Vehicle(
            user_id=construmil.id,
            tipo=TipoVeiculoEnum.CAMINHAO,
            marca="Mercedes",
            modelo="Actros",
            ano=2022,
            placa="NVB-7E34",
            renavam="99887766554",
            km_atual=95000,
            status=StatusVeiculoEnum.ATIVO,
            saude_percentual=80,
        )
        db.add_all([scania, volvo, mercedes])
        db.flush()

        battery_date = warranty_service(expire_in_days=5, warranty_days=180)

        db.add_all(
            [
                Maintenance(
                    vehicle_id=scania.id,
                    categoria=CategoriaManutencaoEnum.REVISAO,
                    data=recent(6),
                    km_registro=180000,
                    valor=4500.00,
                    oficina="Scania Service",
                    mecanico="Equipe Scania",
                    garantia_dias=90,
                    garantia_vencimento=recent(6) + timedelta(days=90),
                ),
                Maintenance(
                    vehicle_id=scania.id,
                    categoria=CategoriaManutencaoEnum.PNEUS,
                    data=recent(10),
                    km_registro=170000,
                    valor=12800.00,
                    oficina="Pneu Forte",
                    mecanico="João Batista",
                    garantia_dias=365,
                    garantia_vencimento=recent(10) + timedelta(days=365),
                ),
                Maintenance(
                    vehicle_id=volvo.id,
                    categoria=CategoriaManutencaoEnum.OLEO,
                    data=recent(4),
                    km_registro=215000,
                    valor=890.00,
                    oficina="Volvo Trucks RJ",
                    mecanico="Marcelo Duarte",
                    garantia_dias=180,
                    garantia_vencimento=recent(4) + timedelta(days=180),
                ),
                Maintenance(
                    vehicle_id=volvo.id,
                    categoria=CategoriaManutencaoEnum.FREIOS,
                    data=recent(8),
                    km_registro=200000,
                    valor=8500.00,
                    oficina="Freios Pesados",
                    mecanico="Paulo Mendes",
                    garantia_dias=365,
                    garantia_vencimento=recent(8) + timedelta(days=365),
                ),
                Maintenance(
                    vehicle_id=volvo.id,
                    categoria=CategoriaManutencaoEnum.REVISAO,
                    data=recent(2),
                    km_registro=190000,
                    valor=6200.00,
                    oficina="Volvo Trucks RJ",
                    mecanico="Equipe Volvo",
                    garantia_dias=90,
                    garantia_vencimento=recent(2) + timedelta(days=90),
                ),
                Maintenance(
                    vehicle_id=volvo.id,
                    categoria=CategoriaManutencaoEnum.PNEUS,
                    data=recent(1),
                    km_registro=180000,
                    valor=13360.00,
                    oficina="Pneu Forte",
                    mecanico="João Batista",
                    garantia_dias=365,
                    garantia_vencimento=recent(1) + timedelta(days=365),
                ),
                Maintenance(
                    vehicle_id=mercedes.id,
                    categoria=CategoriaManutencaoEnum.REVISAO,
                    data=battery_date,
                    km_registro=93000,
                    valor=950.00,
                    oficina="EletroTruck",
                    mecanico="Sérgio Ramos",
                    garantia_dias=180,
                    garantia_vencimento=battery_date + timedelta(days=180),
                ),
                Alert(
                    vehicle_id=mercedes.id,
                    tipo="GARANTIA_BATERIA",
                    mensagem="Garantia de Bateria - Mercedes Actros: vence em 5 dias",
                    urgencia=UrgenciaEnum.CRITICA,
                    ativo=True,
                ),
            ]
        )

        print(f"  [COMPANY] {construmil.nome} | {construmil.plano.value} | 3 caminhoes")

        db.commit()

        total_users = db.query(User).count()
        total_vehicles = db.query(Vehicle).count()
        total_maintenances = db.query(Maintenance).count()
        total_alerts = db.query(Alert).count()

        print("\n" + "=" * 64)
        print("  [OK] SEED CONCLUIDO COM SUCESSO")
        print("=" * 64)
        print(f"  Usuarios:    {total_users}")
        print(f"  Veiculos:    {total_vehicles}")
        print(f"  Manutencoes: {total_maintenances}")
        print(f"  Alertas:     {total_alerts}")
        print("  Banco:       fleetguard.db")
        print("  API:         uvicorn main:app --host 0.0.0.0 --port 8000")
        print("=" * 64)

    except Exception as exc:
        db.rollback()
        print(f"\n[ERRO] durante o seed: {exc}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
