'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { fetchDashboard, fetchUserMaintenances, fetchVehicles } from '@/lib/api';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Gauge,
  MapPinned,
  ShieldAlert,
  Truck,
  UserRound,
  Wrench,
} from 'lucide-react';

const driverNames = [
  'Marcos Andrade',
  'Patrícia Lima',
  'João Ribeiro',
  'Renata Alves',
  'Carlos Nunes',
];

const routes = [
  'Rio de Janeiro - Volta Redonda',
  'Duque de Caxias - Itaguaí',
  'Niterói - Campos',
  'Seropédica - Angra dos Reis',
  'Nova Iguaçu - Resende',
];

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function formatKm(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')} km`;
}

function riskFromVehicle(vehicle) {
  if (vehicle.status === 'EM_MANUTENCAO' || Number(vehicle.saude_percentual || 0) < 45) {
    return {
      label: 'Alto',
      className: 'border-red-200 bg-red-50 text-red-800',
      icon: ShieldAlert,
    };
  }

  if (Number(vehicle.saude_percentual || 0) < 70) {
    return {
      label: 'Médio',
      className: 'border-amber-200 bg-amber-50 text-amber-900',
      icon: AlertTriangle,
    };
  }

  return {
    label: 'Baixo',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
  };
}

function Metric({ title, value, helper, icon: Icon, tone }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    zinc: 'bg-zinc-100 text-zinc-700',
  };

  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-zinc-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
          <p className="mt-2 text-sm text-zinc-500">{helper}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function FrotasPage() {
  const { selectedUser } = useUser();
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedUser) {
      router.push('/');
      return;
    }

    async function loadData() {
      setLoading(true);
      const [vehicleData, dashboardData, maintenanceData] = await Promise.all([
        fetchVehicles(selectedUser.id),
        fetchDashboard(selectedUser.id),
        fetchUserMaintenances(selectedUser.id),
      ]);

      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setDashboard(dashboardData && !dashboardData.__error ? dashboardData : null);
      setMaintenances(Array.isArray(maintenanceData) ? maintenanceData : []);
      setLoading(false);
    }

    loadData();
  }, [selectedUser, router]);

  const fleetRows = useMemo(() => {
    return vehicles.map((vehicle, index) => ({
      ...vehicle,
      driver: driverNames[index % driverNames.length],
      route: routes[index % routes.length],
      risk: riskFromVehicle(vehicle),
    }));
  }, [vehicles]);

  if (!selectedUser) return null;

  if (selectedUser.plano !== 'EMPRESARIAL') {
    return (
      <div className="surface-card mx-auto mt-10 max-w-3xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-zinc-950">Recurso exclusivo do plano empresarial</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          A gestão de frotas reúne motoristas, rotas e relatórios gerenciais para empresas.
          Selecione o perfil empresarial na tela inicial para visualizar este módulo.
        </p>
      </div>
    );
  }

  const maintenanceVehicles = vehicles.filter((vehicle) => vehicle.status === 'EM_MANUTENCAO').length;
  const avgHealth =
    vehicles.length > 0
      ? Math.round(
          vehicles.reduce((sum, vehicle) => sum + Number(vehicle.saude_percentual || 0), 0) /
            vehicles.length
        )
      : 0;
  const completedServices = maintenances.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-lg animate-shimmer" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 rounded-lg animate-shimmer" />
          ))}
        </div>
        <div className="h-96 rounded-lg animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="animate-fadeIn rounded-lg bg-[#111418] p-5 text-white shadow-xl shadow-zinc-950/10 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-amber-300 px-3 py-2 text-sm font-black text-zinc-950">
              <Building2 className="h-4 w-4" />
              Módulo empresarial
            </div>
            <h1 className="text-3xl font-black sm:text-4xl">Gestão de Frotas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">
              Visão gerencial da {selectedUser.empresa_nome || selectedUser.nome}: motoristas,
              rotas, risco de parada e custos operacionais.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-bold text-zinc-400">Empresa</p>
            <p className="mt-1 text-xl font-black text-white">
              {selectedUser.empresa_nome || selectedUser.nome}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Ativos rastreados"
          value={vehicles.length}
          helper="Veículos no perfil empresarial"
          icon={Truck}
          tone="teal"
        />
        <Metric
          title="Em manutenção"
          value={maintenanceVehicles}
          helper="Paradas que afetam disponibilidade"
          icon={Wrench}
          tone="red"
        />
        <Metric
          title="Saúde média"
          value={`${avgHealth}%`}
          helper="Média calculada por ativo"
          icon={Gauge}
          tone="zinc"
        />
        <Metric
          title="Gasto mensal"
          value={formatCurrency(dashboard?.gasto_mensal)}
          helper={`${completedServices} serviços no histórico`}
          icon={BarChart3}
          tone="amber"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="surface-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-950">Relatório executivo</h2>
              <p className="text-sm text-zinc-500">Resumo para tomada de decisão</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-black text-zinc-700">Disponibilidade operacional</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">
                {vehicles.length ? Math.round(((vehicles.length - maintenanceVehicles) / vehicles.length) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-black text-zinc-700">Custo por km</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">
                R$ {Number(dashboard?.custo_por_km || 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="text-sm font-black">Prioridade da semana</p>
              <p className="mt-2 text-sm font-bold leading-6">
                Revisar veículos com saúde abaixo de 70% e planejar janelas de manutenção fora do pico logístico.
              </p>
            </div>
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-zinc-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                <MapPinned className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-950">Operação por veículo</h2>
                <p className="text-sm text-zinc-500">Motoristas, rotas e risco operacional</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-sm">
              <thead className="bg-zinc-950 text-white">
                <tr>
                  <th className="px-5 py-4 text-left font-black">Veículo</th>
                  <th className="px-5 py-4 text-left font-black">Motorista</th>
                  <th className="px-5 py-4 text-left font-black">Rota</th>
                  <th className="px-5 py-4 text-right font-black">KM atual</th>
                  <th className="px-5 py-4 text-left font-black">Risco</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {fleetRows.map((vehicle) => {
                  const RiskIcon = vehicle.risk.icon;

                  return (
                    <tr key={vehicle.id} className="transition hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="font-black text-zinc-950">
                          {vehicle.marca} {vehicle.modelo}
                        </p>
                        <p className="mt-1 font-mono text-xs font-bold text-zinc-500">{vehicle.placa}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex items-center gap-2 font-bold text-zinc-700">
                          <UserRound className="h-4 w-4 text-zinc-400" />
                          {vehicle.driver}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-zinc-700">{vehicle.route}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-mono font-black text-zinc-700">
                        {formatKm(vehicle.km_atual)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black ${vehicle.risk.className}`}>
                          <RiskIcon className="h-3.5 w-3.5" />
                          {vehicle.risk.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
