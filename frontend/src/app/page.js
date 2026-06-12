'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { fetchUsers } from '@/lib/api';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Crown,
  Gauge,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Wrench,
} from 'lucide-react';

const valueCards = [
  {
    icon: TrendingDown,
    title: 'Custos sob controle',
    text: 'Leitura consolidada de gastos, alertas e categorias críticas.',
  },
  {
    icon: Wrench,
    title: 'Manutenção preventiva',
    text: 'Agenda por quilometragem para antecipar falhas antes da parada.',
  },
  {
    icon: ShieldCheck,
    title: 'Garantias monitoradas',
    text: 'Prazos de garantia ficam visíveis antes de virarem prejuízo.',
  },
];

const demoStats = [
  { label: 'frota ativa', value: '5 veículos' },
  { label: 'economia estimada', value: 'até 30%' },
  { label: 'alertas críticos', value: 'tempo real' },
];

export default function LandingPage() {
  const [loading, setLoading] = useState(null);
  const router = useRouter();
  const { setSelectedUser, setUsers } = useUser();

  const handleSelectPlan = async (planType) => {
    setLoading(planType);
    try {
      const usersData = await fetchUsers();
      if (Array.isArray(usersData) && usersData.length > 0) {
        setUsers(usersData);
        const user = usersData.find((u) => u.plano === planType) || usersData[0];
        setSelectedUser(user);
        router.push('/dashboard');
      } else {
        alert('Não foi possível carregar os perfis. Verifique se o backend está rodando.');
      }
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#101419] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal-500/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-teal-950/40 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-500 shadow-lg shadow-teal-950/40">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-black">FleetGuard</p>
              <p className="text-xs text-zinc-400">SaaS de manutenção veicular</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 sm:flex">
            <Sparkles className="h-4 w-4 text-amber-300" />
            Protótipo funcional para demonstração
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="max-w-3xl animate-fadeIn">
              <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-teal-400/25 bg-teal-400/10 px-3 py-2 text-sm font-bold text-teal-200">
                <Gauge className="h-4 w-4" />
                Gestão inteligente de manutenção veicular
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-[1.02] text-white sm:text-6xl">
                FleetGuard
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-200">
                Reduza custos operacionais, aumente a vida útil da frota e apresente
                decisões de manutenção com dados claros, alertas preventivos e histórico
                organizado.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => handleSelectPlan('PREMIUM')}
                  disabled={loading !== null}
                  className="btn-primary flex min-h-14 items-center justify-center gap-3 px-6 text-base disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Crown className="h-5 w-5" />
                  {loading === 'PREMIUM' ? 'Carregando...' : 'Plano Premium Individual'}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleSelectPlan('EMPRESARIAL')}
                  disabled={loading !== null}
                  className="flex min-h-14 items-center justify-center gap-3 rounded-lg border border-amber-300 bg-amber-300 px-6 text-base font-black text-zinc-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Building2 className="h-5 w-5" />
                  {loading === 'EMPRESARIAL' ? 'Carregando...' : 'Plano Empresarial / Frotas'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="animate-slideUp rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/25 backdrop-blur">
              <div className="rounded-lg border border-white/10 bg-[#f8fafc] p-4 text-zinc-950">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-zinc-950">Painel da demonstração</p>
                    <p className="text-xs text-zinc-500">Dados pré-carregados no SQLite local</p>
                  </div>
                  <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">
                    Online
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {demoStats.map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-3">
                      <p className="text-xl font-black text-zinc-950">{stat.value}</p>
                      <p className="mt-1 text-xs font-semibold uppercase text-zinc-500">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { label: 'Óleo e filtros', width: '82%', color: 'bg-teal-600' },
                    { label: 'Pneus', width: '66%', color: 'bg-amber-500' },
                    { label: 'Freios', width: '48%', color: 'bg-red-500' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-bold text-zinc-700">{item.label}</span>
                        <span className="text-zinc-500">{item.width}</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-200">
                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: item.width }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="mt-0.5 h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-black text-red-800">
                        Troca de óleo vence em 300 km
                      </p>
                      <p className="mt-1 text-xs text-red-700">
                        Alerta preventivo pronto para a banca visualizar em tempo real.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 pb-6 md:grid-cols-3">
          {valueCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-400/15 text-teal-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-black text-white">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{card.text}</p>
              </div>
            );
          })}
        </section>

        <footer className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500">
          <CheckCircle2 className="h-4 w-4 text-teal-400" />
          FleetGuard 2026 | preparado para apresentação ao vivo
        </footer>
      </div>
    </main>
  );
}
