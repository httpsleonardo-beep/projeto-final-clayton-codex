'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
  BarChart3,
  Building2,
  Car,
  Crown,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react';

const baseNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/veiculos', label: 'Veículos', icon: Car },
  { href: '/manutencoes', label: 'Manutenções', icon: Wrench },
];

const fleetLink = { href: '/frotas', label: 'Gestão de Frotas', icon: BarChart3 };

const planConfig = {
  PREMIUM: {
    color: 'border-teal-200 bg-teal-50 text-teal-800',
    icon: Crown,
    label: 'Premium',
  },
  EMPRESARIAL: {
    color: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: Building2,
    label: 'Empresarial',
  },
  GRATUITO: {
    color: 'border-zinc-200 bg-zinc-100 text-zinc-700',
    icon: User,
    label: 'Gratuito',
  },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedUser, setSelectedUser } = useUser();

  const navLinks =
    selectedUser?.plano === 'EMPRESARIAL' ? [...baseNavLinks, fleetLink] : baseNavLinks;
  const plan = planConfig[selectedUser?.plano] || planConfig.GRATUITO;
  const PlanIcon = plan.icon;

  const handleLogout = () => {
    setSelectedUser(null);
    router.push('/');
  };

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-[280px] flex-col border-r border-zinc-800 bg-[#111418] text-white shadow-2xl shadow-zinc-950/20 lg:flex">
        <div className="border-b border-white/10 p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-500 text-white shadow-lg shadow-teal-950/30">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-black">FleetGuard</p>
              <p className="text-xs text-zinc-400">Manutenção inteligente</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase text-zinc-500">
            Operação
          </p>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-teal-600' : 'text-zinc-500'
                  }`}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-400/15 text-teal-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {selectedUser?.nome || 'Usuário'}
                </p>
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold ${plan.color}`}
                >
                  <PlanIcon className="h-3 w-3" />
                  {plan.label}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Trocar perfil
            </button>
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-2 py-2 shadow-2xl shadow-zinc-950/10 backdrop-blur lg:hidden">
        <div
          className={`mx-auto grid max-w-lg gap-1 ${
            navLinks.length === 4 ? 'grid-cols-4' : 'grid-cols-3'
          }`}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="w-full truncate text-center">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
