'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { createMaintenance, deleteMaintenance, fetchUserMaintenances, fetchVehicles } from '@/lib/api';
import {
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Filter,
  Plus,
  ReceiptText,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';

const categories = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'OLEO', label: 'Óleo' },
  { key: 'PNEUS', label: 'Pneus' },
  { key: 'FREIOS', label: 'Freios' },
  { key: 'REVISAO', label: 'Revisão' },
];

const categoryConfig = {
  OLEO: { color: 'border-teal-200 bg-teal-50 text-teal-800', label: 'Óleo' },
  PNEUS: { color: 'border-amber-200 bg-amber-50 text-amber-900', label: 'Pneus' },
  FREIOS: { color: 'border-red-200 bg-red-50 text-red-800', label: 'Freios' },
  REVISAO: { color: 'border-indigo-200 bg-indigo-50 text-indigo-800', label: 'Revisão' },
};

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [year, month, day] = dateStr.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }

  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function isWarrantyExpired(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warranty = new Date(dateStr);
  warranty.setHours(0, 0, 0, 0);
  return warranty < today;
}

function ServiceOrderModal({ onClose, onSubmit, vehicles, loading }) {
  const [formData, setFormData] = useState({
    veiculo_id: vehicles[0]?.id || '',
    categoria: 'OLEO',
    data: new Date().toISOString().split('T')[0],
    quilometragem: vehicles[0]?.km_atual || 0,
    valor: 0,
    oficina: '',
    mecanico: '',
    garantia_dias: 90,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.veiculo_id) newErrors.veiculo_id = 'Selecione um veículo';
    if (!formData.data) newErrors.data = 'Data é obrigatória';
    if (formData.quilometragem < 0) newErrors.quilometragem = 'KM inválida';
    if (formData.valor < 0) newErrors.valor = 'Valor inválido';
    if (!formData.oficina.trim()) newErrors.oficina = 'Oficina é obrigatória';
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

  const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === String(formData.veiculo_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
      <div className="surface-card animate-scaleIn max-h-[92vh] w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-950">Nova ordem de serviço</h2>
              <p className="text-sm text-zinc-500">
                {selectedVehicle
                  ? `${selectedVehicle.marca} ${selectedVehicle.modelo} · ${selectedVehicle.placa}`
                  : 'Registro de manutenção'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary flex h-9 w-9 items-center justify-center" aria-label="Fechar modal">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-82px)] space-y-4 overflow-y-auto p-5">
          <div>
            <label className="form-label">Veículo</label>
            <select
              value={formData.veiculo_id}
              onChange={(event) => {
                const vehicle = vehicles.find((item) => String(item.id) === event.target.value);
                handleChange('veiculo_id', event.target.value);
                if (vehicle) handleChange('quilometragem', Number(vehicle.km_atual || 0));
              }}
              className="form-field"
            >
              <option value="">Selecione um veículo</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.marca} {vehicle.modelo} - {vehicle.placa}
                </option>
              ))}
            </select>
            {errors.veiculo_id && <p className="mt-1 text-xs font-bold text-red-600">{errors.veiculo_id}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Categoria</label>
              <select
                value={formData.categoria}
                onChange={(event) => handleChange('categoria', event.target.value)}
                className="form-field"
              >
                <option value="OLEO">Óleo</option>
                <option value="PNEUS">Pneus</option>
                <option value="FREIOS">Freios</option>
                <option value="REVISAO">Revisão</option>
              </select>
            </div>
            <div>
              <label className="form-label">Data</label>
              <input
                type="date"
                value={formData.data}
                onChange={(event) => handleChange('data', event.target.value)}
                className="form-field"
              />
              {errors.data && <p className="mt-1 text-xs font-bold text-red-600">{errors.data}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Quilometragem</label>
              <input
                type="number"
                value={formData.quilometragem}
                onChange={(event) => handleChange('quilometragem', parseInt(event.target.value, 10) || 0)}
                min={0}
                className="form-field"
              />
              {errors.quilometragem && <p className="mt-1 text-xs font-bold text-red-600">{errors.quilometragem}</p>}
            </div>
            <div>
              <label className="form-label">Valor pago</label>
              <input
                type="number"
                value={formData.valor}
                onChange={(event) => handleChange('valor', parseFloat(event.target.value) || 0)}
                min={0}
                step="0.01"
                className="form-field"
              />
              {errors.valor && <p className="mt-1 text-xs font-bold text-red-600">{errors.valor}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Oficina</label>
              <input
                value={formData.oficina}
                onChange={(event) => handleChange('oficina', event.target.value)}
                placeholder="Nome da oficina"
                className="form-field"
              />
              {errors.oficina && <p className="mt-1 text-xs font-bold text-red-600">{errors.oficina}</p>}
            </div>
            <div>
              <label className="form-label">Mecânico responsável</label>
              <input
                value={formData.mecanico}
                onChange={(event) => handleChange('mecanico', event.target.value)}
                placeholder="Nome do mecânico"
                className="form-field"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Tempo de garantia (dias)</label>
            <input
              type="number"
              value={formData.garantia_dias}
              onChange={(event) => handleChange('garantia_dias', parseInt(event.target.value, 10) || 0)}
              min={0}
              className="form-field"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={onClose} className="btn-secondary min-h-12 flex-1 px-4">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary min-h-12 flex-1 px-4 disabled:opacity-60">
              {loading ? 'Registrando...' : 'Registrar serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManutencoesPage() {
  const { selectedUser } = useUser();
  const router = useRouter();
  const [maintenances, setMaintenances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('TODOS');

  const loadData = useCallback(async () => {
    if (!selectedUser) return;
    setLoading(true);
    const [maintenanceData, vehicleData] = await Promise.all([
      fetchUserMaintenances(selectedUser.id),
      fetchVehicles(selectedUser.id),
    ]);
    setMaintenances(Array.isArray(maintenanceData) ? maintenanceData : []);
    setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
    setLoading(false);
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [selectedUser, router, loadData]);

  const handleOpenModal = () => {
    if (vehicles.length === 0) {
      alert('Cadastre um veículo antes de registrar uma manutenção.');
      return;
    }
    setShowModal(true);
  };

  const handleSubmitMaintenance = async (formData) => {
    setSubmitting(true);
    const result = await createMaintenance({
      vehicle_id: parseInt(formData.veiculo_id, 10),
      categoria: formData.categoria,
      data: formData.data,
      km_registro: formData.quilometragem,
      valor: formData.valor,
      oficina: formData.oficina,
      mecanico: formData.mecanico,
      garantia_dias: formData.garantia_dias,
    });

    if (result && !result.__error) {
      await loadData();
      setShowModal(false);
    } else {
      alert(result?.detail || 'Erro ao registrar manutenção. Tente novamente.');
    }
    setSubmitting(false);
  };

  const vehicleMap = useMemo(() => {
    return Object.fromEntries(
      vehicles.map((vehicle) => [
        vehicle.id,
        `${vehicle.marca} ${vehicle.modelo} (${vehicle.placa})`,
      ])
    );
  }, [vehicles]);

  const handleDeleteMaintenance = async (maintenance) => {
    const vehicleLabel = vehicleMap[maintenance.vehicle_id] || 'este veiculo';
    const confirmed = window.confirm(
      `Remover a ordem de servico de ${vehicleLabel} em ${formatDate(maintenance.data)}?`
    );
    if (!confirmed) return;

    setDeletingId(maintenance.id);
    const result = await deleteMaintenance(maintenance.id);

    if (result && !result.__error) {
      await loadData();
    } else {
      alert(result?.detail || 'Erro ao remover ordem de servico. Tente novamente.');
    }
    setDeletingId(null);
  };

  const filteredMaintenances =
    activeFilter === 'TODOS'
      ? maintenances
      : maintenances.filter((item) => String(item.categoria || '').toUpperCase() === activeFilter);

  const totalValue = filteredMaintenances.reduce((sum, item) => sum + Number(item.valor || 0), 0);

  if (!selectedUser) return null;

  return (
    <div className="space-y-6">
      <section className="animate-fadeIn rounded-lg bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm font-black text-teal-800">
              <ReceiptText className="h-4 w-4" />
              Histórico e ordens de serviço
            </div>
            <h1 className="text-3xl font-black text-zinc-950">Manutenções</h1>
            <p className="mt-2 text-sm text-zinc-500">
              {filteredMaintenances.length} registros exibidos · {formatCurrency(totalValue)} no filtro atual
            </p>
          </div>
          <button onClick={handleOpenModal} className="btn-primary inline-flex min-h-12 items-center justify-center gap-2 px-5">
            <Plus className="h-5 w-5" />
            Nova ordem de serviço
          </button>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-sm font-black text-zinc-600">
            <Filter className="h-4 w-4" />
            Filtrar categoria
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveFilter(category.key)}
                className={`rounded-lg px-4 py-2 text-sm font-black transition ${
                  activeFilter === category.key
                    ? 'bg-zinc-950 text-white'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-20 rounded-lg animate-shimmer" />
          ))}
        </div>
      ) : filteredMaintenances.length === 0 ? (
        <div className="surface-card py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
            <Wrench className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-zinc-950">Nenhuma manutenção encontrada</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {activeFilter === 'TODOS'
              ? 'Registre a primeira ordem de serviço para movimentar o dashboard.'
              : 'Altere o filtro para visualizar outros serviços.'}
          </p>
        </div>
      ) : (
        <section className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-zinc-950 text-white">
                <tr>
                  <th className="px-5 py-4 text-left font-black">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data
                    </span>
                  </th>
                  <th className="px-5 py-4 text-left font-black">Veículo</th>
                  <th className="px-5 py-4 text-left font-black">Categoria</th>
                  <th className="px-5 py-4 text-right font-black">KM</th>
                  <th className="px-5 py-4 text-right font-black">Valor</th>
                  <th className="px-5 py-4 text-left font-black">Oficina</th>
                  <th className="px-5 py-4 text-left font-black">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Garantia
                    </span>
                  </th>
                  <th className="px-5 py-4 text-right font-black">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {filteredMaintenances.map((maintenance) => {
                  const categoryKey = String(maintenance.categoria || '').toUpperCase();
                  const category = categoryConfig[categoryKey] || {
                    color: 'border-zinc-200 bg-zinc-100 text-zinc-700',
                    label: maintenance.categoria || '-',
                  };
                  const warrantyDate = maintenance.garantia_vencimento;
                  const warrantyExpired = isWarrantyExpired(warrantyDate);

                  return (
                    <tr key={maintenance.id} className="transition hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-zinc-700">
                        {formatDate(maintenance.data)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-black text-zinc-950">
                        {vehicleMap[maintenance.vehicle_id] || '-'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${category.color}`}>
                          {category.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-mono font-black text-zinc-700">
                        {Number(maintenance.km_registro || 0).toLocaleString('pt-BR')}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-black text-zinc-950">
                        {formatCurrency(maintenance.valor)}
                      </td>
                      <td className="px-5 py-4 text-zinc-600">{maintenance.oficina || '-'}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {warrantyDate ? (
                          warrantyExpired ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Vencida
                            </span>
                          ) : (
                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                              Até {formatDate(warrantyDate)}
                            </span>
                          )
                        ) : (
                          <span className="text-xs font-bold text-zinc-400">Sem garantia</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteMaintenance(maintenance)}
                          disabled={deletingId === maintenance.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Remover ordem de servico"
                          title="Remover ordem de servico"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showModal && (
        <ServiceOrderModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitMaintenance}
          vehicles={vehicles}
          loading={submitting}
        />
      )}
    </div>
  );
}
