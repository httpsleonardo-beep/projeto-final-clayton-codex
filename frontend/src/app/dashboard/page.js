'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { fetchAlerts, fetchDashboard } from '@/lib/api';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  Building2,
  Car,
  Crown,
  DollarSign,
  Fuel,
  Gauge,
  ShieldCheck,
  TrendingUp,
  User,
  Wrench,
} from 'lucide-react';

const planConfig = {
  PREMIUM: { color: 'border-teal-200 bg-teal-50 text-teal-800', icon: Crown, label: 'Premium' },
  EMPRESARIAL: { color: 'border-amber-200 bg-amber-50 text-amber-800', icon: Building2, label: 'Empresarial' },
  GRATUITO: { color: 'border-zinc-200 bg-zinc-100 text-zinc-700', icon: User, label: 'Gratuito' },
};

const urgencyConfig = {
  CRITICA: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    badge: 'bg-red-600 text-white',
    icon: AlertTriangle,
    text: 'text-red-800',
  },
  ALTA: {
    border: 'border-amber-500',
    bg: 'bg-amber-50',
    badge: 'bg-amber-500 text-zinc-950',
    icon: AlertCircle,
    text: 'text-amber-900',
  },
  MEDIA: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-500 text-zinc-950',
    icon: AlertCircle,
    text: 'text-yellow-900',
  },
  BAIXA: {
    border: 'border-sky-500',
    bg: 'bg-sky-50',
    badge: 'bg-sky-600 text-white',
    icon: AlertCircle,
    text: 'text-sky-900',
  },
};

const categoryMeta = {
  OLEO: { label: 'Óleo', color: 'bg-teal-600' },
  PNEUS: { label: 'Pneus', color: 'bg-amber-500' },
  FREIOS: { label: 'Freios', color: 'bg-red-500' },
  REVISAO: { label: 'Revisão', color: 'bg-indigo-600' },
};

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function normalizeCategory(key) {
  return String(key || '').toUpperCase();
}

function MetricCard({ title, value, helper, icon: Icon, tone = 'teal', critical = false }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <div className="surface-card card-hover p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-500">{title}</p>
          <p className="mt-2 break-words text-3xl font-black text-zinc-950">{value}</p>
          {helper && <p className="mt-2 text-sm text-zinc-500">{helper}</p>}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${tones[tone]} ${
            critical ? 'animate-pulseAlert' : ''
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function CostBar({ label, value, maxValue, color }) {
  const width = maxValue > 0 ? Math.max((Number(value) / maxValue) * 100, 6) : 6;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-zinc-700">{label}</span>
        <span className="shrink-0 text-sm font-black text-zinc-950">{formatCurrency(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { selectedUser } = useUser();
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedUser) {
      router.push('/');
      return;
    }

    async function loadData() {
      setLoading(true);
      const [dashData, alertsData] = await Promise.all([
        fetchDashboard(selectedUser.id),
        fetchAlerts(selectedUser.id),
      ]);

      setDashboard(dashData && !dashData.__error ? dashData : null);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setLoading(false);
    }

    loadData();
  }, [selectedUser, router]);

  const categoryRows = useMemo(() => {
    const categories = dashboard?.custos_por_categoria || {};
    return Object.entries(categories).map(([key, value]) => {
      const normalized = normalizeCategory(key);
      const meta = categoryMeta[normalized] || { label: key, color: 'bg-zinc-600' };
      return { key, value: Number(value || 0), ...meta };
    });
  }, [dashboard]);

  if (!selectedUser) return null;

  const plan = planConfig[selectedUser.plano] || planConfig.GRATUITO;
  const PlanIcon = plan.icon;
  const maxCost = Math.max(...categoryRows.map((row) => row.value), 1);
  const costPerKm = Number(dashboard?.custo_por_km || 0);
  const efficiencyWidth = Math.min(Math.max((costPerKm / 0.25) * 100, 8), 100);
  const activeAlerts = alerts.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-lg animate-shimmer" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 rounded-lg animate-shimmer" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-80 rounded-lg animate-shimmer" />
          <div className="h-80 rounded-lg animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="animate-fadeIn rounded-lg bg-[#111418] p-5 text-white shadow-xl shadow-zinc-950/10 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-teal-100">
              <Activity className="h-4 w-4" />
              Central de indicadores
            </div>
            <h1 className="text-3xl font-black sm:text-4xl">
              Olá, {selectedUser.nome}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">
              Resumo operacional da frota, custos do mês, garantias e alertas de manutenção.
            </p>
          </div>
          <div className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-black ${plan.color}`}>
            <PlanIcon className="h-4 w-4" />
            Plano {plan.label}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Veículos na frota"
          value={dashboard?.total_veiculos ?? 0}
          helper="Total ativo no perfil selecionado"
          icon={Car}
        />
        <MetricCard
          title="Em manutenção"
          value={dashboard?.em_manutencao ?? 0}
          helper="Exige atenção operacional"
          icon={Wrench}
          tone="red"
          critical={(dashboard?.em_manutencao ?? 0) > 0}
        />
        <MetricCard
          title="Gasto mensal"
          value={formatCurrency(dashboard?.gasto_mensal)}
          helper="Consolidado do mês atual"
          icon={DollarSign}
          tone="emerald"
        />
        <MetricCard
          title="Garantias vencendo"
          value={dashboard?.alertas_garantia ?? 0}
          helper="Próximos 30 dias"
          icon={AlertTriangle}
          tone="amber"
          critical={(dashboard?.alertas_garantia ?? 0) > 0}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-card animate-slideUp p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-950">Custos por categoria</h2>
                <p className="text-sm text-zinc-500">Soma dos serviços registrados no histórico</p>
              </div>
            </div>
            <span className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-black text-zinc-700">
              {categoryRows.length || 0} categorias
            </span>
          </div>

          <div className="space-y-5">
            {categoryRows.length > 0 ? (
              categoryRows.map((row) => (
                <CostBar
                  key={row.key}
                  label={row.label}
                  value={row.value}
                  maxValue={maxCost}
                  color={row.color}
                />
              ))
            ) : (
              ['Óleo', 'Pneus', 'Freios', 'Revisão'].map((label) => (
                <CostBar key={label} label={label} value={0} maxValue={1} color="bg-zinc-400" />
              ))
            )}
          </div>
        </div>

        <div className="surface-card animate-slideUp p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Fuel className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-950">Custo médio por km</h2>
              <p className="text-sm text-zinc-500">Eficiência financeira da operação</p>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-bold text-zinc-500">Indicador atual</p>
            <p className="mt-2 text-5xl font-black text-zinc-950">
              R$ {costPerKm.toFixed(2).replace('.', ',')}
            </p>
            <p className="mt-1 text-sm text-zinc-500">por km rodado</p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${efficiencyWidth}%` }} />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-zinc-700">
                <Gauge className="h-4 w-4 text-teal-700" />
                Alertas ativos
              </div>
              <p className="text-3xl font-black text-zinc-950">{activeAlerts}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-zinc-700">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Garantias
              </div>
              <p className="text-3xl font-black text-zinc-950">
                {dashboard?.alertas_garantia ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card animate-slideUp overflow-hidden">
        <div className="border-b border-zinc-200 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-950">Alertas urgentes</h2>
                <p className="text-sm text-zinc-500">Itens que merecem ação antes da próxima revisão</p>
              </div>
            </div>
            <span className="w-fit rounded-lg bg-red-50 px-3 py-2 text-sm font-black text-red-700">
              {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
            </span>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="text-lg font-black text-zinc-950">Nenhum alerta ativo</p>
            <p className="mt-1 text-sm text-zinc-500">A frota está sem pendências críticas agora.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {alerts.map((alert, index) => {
              const urgency = urgencyConfig[alert.urgencia] || urgencyConfig.BAIXA;
              const UrgencyIcon = urgency.icon;

              return (
                <div
                  key={alert.id || index}
                  className={`border-l-4 ${urgency.border} ${urgency.bg} p-4 sm:p-5`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <UrgencyIcon className={`h-5 w-5 shrink-0 ${urgency.text}`} />
                    <p className={`flex-1 text-sm font-bold leading-6 ${urgency.text}`}>
                      {alert.mensagem}
                    </p>
                    <span className={`w-fit rounded-lg px-2.5 py-1 text-xs font-black ${urgency.badge}`}>
                      {alert.urgencia}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
