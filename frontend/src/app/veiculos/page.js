'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { createVehicle, deleteVehicle, fetchSmartSchedule, fetchVehicles } from '@/lib/api';
import {
  AlertTriangle,
  Bike,
  Calendar,
  Car,
  CheckCircle2,
  Gauge,
  Hash,
  Plus,
  Route,
  Trash2,
  Truck,
  Wrench,
  X,
} from 'lucide-react';

const vehicleIcons = {
  CARRO: Car,
  MOTO: Bike,
  CAMINHAO: Truck,
};

const statusConfig = {
  ATIVO: {
    label: 'Ativo',
    color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
  },
  EM_MANUTENCAO: {
    label: 'Em manutenção',
    color: 'border-red-200 bg-red-50 text-red-800',
    icon: Wrench,
    pulse: true,
  },
};

const urgencyConfig = {
  CRITICA: 'border-red-200 bg-red-50 text-red-800',
  ALTA: 'border-amber-200 bg-amber-50 text-amber-900',
  MEDIA: 'border-yellow-200 bg-yellow-50 text-yellow-900',
  BAIXA: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

function formatKm(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')} km`;
}

function HealthBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
  let color = 'bg-emerald-600';
  let textColor = 'text-emerald-700';

  if (safeValue < 35) {
    color = 'bg-red-600';
    textColor = 'text-red-700';
  } else if (safeValue < 65) {
    color = 'bg-amber-500';
    textColor = 'text-amber-700';
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase text-zinc-500">Saúde</span>
        <span className={`text-sm font-black ${textColor}`}>{safeValue}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function VehicleCard({ vehicle, schedule, index, onDelete, deleting }) {
  const VehicleIcon = vehicleIcons[vehicle.tipo] || Car;
  const status = statusConfig[vehicle.status] || statusConfig.ATIVO;
  const StatusIcon = status.icon;
  const nextService = schedule?.servicos?.[0];
  const urgencyClass = urgencyConfig[nextService?.urgencia] || urgencyConfig.BAIXA;

  return (
    <article
      className="surface-card card-hover animate-slideUp overflow-hidden"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="border-b border-zinc-200 bg-white p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <VehicleIcon className="h-7 w-7" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black ${status.color} ${
                status.pulse ? 'animate-pulseAlert' : ''
              }`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
            <button
              type="button"
              onClick={() => onDelete(vehicle)}
              disabled={deleting}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`Remover ${vehicle.marca} ${vehicle.modelo}`}
              title="Remover veiculo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <h2 className="text-xl font-black text-zinc-950">
          {vehicle.marca} {vehicle.modelo}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {vehicle.ano}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono font-black text-zinc-700">
            <Hash className="h-4 w-4 text-zinc-400" />
            {vehicle.placa}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-bold uppercase text-zinc-500">Quilometragem</p>
            <p className="mt-1 text-lg font-black text-zinc-950">
              {formatKm(vehicle.km_atual)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-bold uppercase text-zinc-500">Tipo</p>
            <p className="mt-1 text-lg font-black text-zinc-950">
              {vehicle.tipo === 'CAMINHAO' ? 'Caminhão' : vehicle.tipo === 'MOTO' ? 'Moto' : 'Carro'}
            </p>
          </div>
        </div>

        <HealthBar value={vehicle.saude_percentual} />

        <div className={`rounded-lg border p-4 ${urgencyClass}`}>
          <div className="mb-2 flex items-center gap-2">
            <Route className="h-4 w-4" />
            <p className="text-sm font-black">Agenda inteligente</p>
          </div>
          {nextService ? (
            <div>
              <p className="text-sm font-bold leading-6">{nextService.mensagem}</p>
              <p className="mt-2 text-xs font-semibold">
                Próxima referência: {formatKm(nextService.km_proxima)}
              </p>
            </div>
          ) : (
            <p className="text-sm font-bold">Calculando próxima manutenção preventiva.</p>
          )}
        </div>
      </div>
    </article>
  );
}

function VehicleModal({ onClose, onSubmit, loading }) {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    tipo: 'CARRO',
    marca: '',
    modelo: '',
    ano: currentYear,
    placa: '',
    renavam: '',
    quilometragem_atual: 0,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.marca.trim()) newErrors.marca = 'Marca é obrigatória';
    if (!formData.modelo.trim()) newErrors.modelo = 'Modelo é obrigatório';
    if (!formData.placa.trim()) newErrors.placa = 'Placa é obrigatória';
    if (!formData.renavam.trim()) newErrors.renavam = 'Renavam é obrigatório';
    if (formData.ano < 1990 || formData.ano > currentYear + 1) {
      newErrors.ano = `Ano deve ser entre 1990 e ${currentYear + 1}`;
    }
    if (formData.quilometragem_atual < 0) newErrors.quilometragem_atual = 'KM inválida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
      <div className="surface-card animate-scaleIn max-h-[92vh] w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-950">Adicionar veículo</h2>
              <p className="text-sm text-zinc-500">Cadastro rápido para o protótipo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary flex h-9 w-9 items-center justify-center"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-82px)] space-y-4 overflow-y-auto p-5">
          <div>
            <label className="form-label">Tipo de veículo</label>
            <select
              value={formData.tipo}
              onChange={(event) => handleChange('tipo', event.target.value)}
              className="form-field"
            >
              <option value="CARRO">Carro</option>
              <option value="MOTO">Moto</option>
              <option value="CAMINHAO">Caminhão</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Marca</label>
              <input
                value={formData.marca}
                onChange={(event) => handleChange('marca', event.target.value)}
                placeholder="Ex: Toyota"
                className="form-field"
              />
              {errors.marca && <p className="mt-1 text-xs font-bold text-red-600">{errors.marca}</p>}
            </div>
            <div>
              <label className="form-label">Modelo</label>
              <input
                value={formData.modelo}
                onChange={(event) => handleChange('modelo', event.target.value)}
                placeholder="Ex: Corolla"
                className="form-field"
              />
              {errors.modelo && <p className="mt-1 text-xs font-bold text-red-600">{errors.modelo}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Ano</label>
              <input
                type="number"
                value={formData.ano}
                onChange={(event) => handleChange('ano', parseInt(event.target.value, 10) || 0)}
                min={1990}
                max={currentYear + 1}
                className="form-field"
              />
              {errors.ano && <p className="mt-1 text-xs font-bold text-red-600">{errors.ano}</p>}
            </div>
            <div>
              <label className="form-label">Placa</label>
              <input
                value={formData.placa}
                onChange={(event) => handleChange('placa', event.target.value.toUpperCase())}
                placeholder="ABC-1D23"
                maxLength={8}
                className="form-field font-mono font-black"
              />
              {errors.placa && <p className="mt-1 text-xs font-bold text-red-600">{errors.placa}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Renavam</label>
              <input
                value={formData.renavam}
                onChange={(event) => handleChange('renavam', event.target.value)}
                placeholder="00000000000"
                maxLength={11}
                className="form-field"
              />
              {errors.renavam && <p className="mt-1 text-xs font-bold text-red-600">{errors.renavam}</p>}
            </div>
            <div>
              <label className="form-label">Quilometragem atual</label>
              <input
                type="number"
                value={formData.quilometragem_atual}
                onChange={(event) =>
                  handleChange('quilometragem_atual', parseInt(event.target.value, 10) || 0)
                }
                min={0}
                className="form-field"
              />
              {errors.quilometragem_atual && (
                <p className="mt-1 text-xs font-bold text-red-600">
                  {errors.quilometragem_atual}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={onClose} className="btn-secondary min-h-12 flex-1 px-4">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary min-h-12 flex-1 px-4 disabled:opacity-60">
              {loading ? 'Cadastrando...' : 'Cadastrar veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VeiculosPage() {
  const { selectedUser } = useUser();
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [scheduleMap, setScheduleMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadVehicles = useCallback(async () => {
    if (!selectedUser) return;
    setLoading(true);
    const data = await fetchVehicles(selectedUser.id);
    const nextVehicles = Array.isArray(data) ? data : [];
    setVehicles(nextVehicles);

    const schedules = await Promise.all(
      nextVehicles.map(async (vehicle) => {
        const result = await fetchSmartSchedule(vehicle.id);
        return [vehicle.id, result && !result.__error ? result : null];
      })
    );

    setScheduleMap(Object.fromEntries(schedules));
    setLoading(false);
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVehicles();
  }, [selectedUser, router, loadVehicles]);

  const handleAddVehicle = () => {
    if (selectedUser?.plano === 'GRATUITO' && vehicles.length >= 1) {
      alert('Limite atingido. Faça upgrade para Premium para adicionar mais veículos.');
      return;
    }
    setShowModal(true);
  };

  const handleSubmitVehicle = async (formData) => {
    setSubmitting(true);
    const result = await createVehicle({
      tipo: formData.tipo,
      marca: formData.marca,
      modelo: formData.modelo,
      ano: formData.ano,
      placa: formData.placa,
      renavam: formData.renavam,
      km_atual: formData.quilometragem_atual,
      user_id: selectedUser.id,
    });

    if (result && !result.__error) {
      await loadVehicles();
      setShowModal(false);
    } else {
      alert(result?.detail || 'Erro ao cadastrar veículo. Tente novamente.');
    }
    setSubmitting(false);
  };

  const handleDeleteVehicle = async (vehicle) => {
    const confirmed = window.confirm(
      `Remover ${vehicle.marca} ${vehicle.modelo} (${vehicle.placa})? As ordens de servico deste veiculo tambem serao removidas.`
    );
    if (!confirmed) return;

    setDeletingId(vehicle.id);
    const result = await deleteVehicle(vehicle.id);

    if (result && !result.__error) {
      await loadVehicles();
    } else {
      alert(result?.detail || 'Erro ao remover veiculo. Tente novamente.');
    }
    setDeletingId(null);
  };

  if (!selectedUser) return null;

  const isEmpresarial = selectedUser.plano === 'EMPRESARIAL';
  const averageHealth =
    vehicles.length > 0
      ? Math.round(
          vehicles.reduce((sum, vehicle) => sum + Number(vehicle.saude_percentual || 0), 0) /
            vehicles.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <section className="animate-fadeIn rounded-lg bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm font-black text-teal-800">
              <Gauge className="h-4 w-4" />
              Cadastro e saúde dos ativos
            </div>
            <h1 className="text-3xl font-black text-zinc-950">
              {isEmpresarial ? 'Frota cadastrada' : 'Meus veículos'}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {vehicles.length} {vehicles.length === 1 ? 'veículo cadastrado' : 'veículos cadastrados'} · saúde média {averageHealth}%
            </p>
          </div>
          <button onClick={handleAddVehicle} className="btn-primary inline-flex min-h-12 items-center justify-center gap-2 px-5">
            <Plus className="h-5 w-5" />
            Adicionar veículo
          </button>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-96 rounded-lg animate-shimmer" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="surface-card py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
            <Car className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-zinc-950">Nenhum veículo cadastrado</h2>
          <p className="mt-2 text-sm text-zinc-500">Cadastre o primeiro ativo para iniciar a demonstração.</p>
          <button onClick={handleAddVehicle} className="btn-primary mt-6 inline-flex min-h-11 items-center gap-2 px-5">
            <Plus className="h-4 w-4" />
            Adicionar veículo
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              schedule={scheduleMap[vehicle.id]}
              index={index}
              onDelete={handleDeleteVehicle}
              deleting={deletingId === vehicle.id}
            />
          ))}
        </div>
      )}

      <button
        onClick={handleAddVehicle}
        className="btn-primary fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center shadow-xl shadow-teal-900/20 lg:hidden"
        aria-label="Adicionar veículo"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showModal && (
        <VehicleModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitVehicle}
          loading={submitting}
        />
      )}
    </div>
  );
}
