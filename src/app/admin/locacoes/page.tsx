'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  BarChart3,
  Download,
  DollarSign,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  Phone,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit3,
  MapPin,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { store } from '@/lib/store';
import { RentalWithDetails, RentalStatus, Payment } from '@/types/database';
import { formatDateBR } from '@/lib/dateUtils';
import { RentalBatchActionBar } from '@/components/locacoes/RentalBatchActionBar';
import { CreateRentalModal } from '@/components/locacoes/CreateRentalModal';
import { RentalEditDrawer } from '@/components/locacoes/RentalEditDrawer';
import { RentalChartsModal } from '@/components/locacoes/RentalChartsModal';
import { ExportRentalsModal } from '@/components/locacoes/ExportRentalsModal';
import { DeleteConfirmationModal } from '@/components/temas/DeleteConfirmationModal';

type SortField = 'status' | 'customer' | 'theme' | 'date' | 'total' | 'balance';
type SortOrder = 'asc' | 'desc' | null;

interface SortState {
  field: SortField | null;
  order: SortOrder;
}

// Ordem prioritária de status: Alugados -> Reservados -> Devolvidos -> Cancelados
const STATUS_ORDER: Record<string, number> = {
  alugado: 1,
  reservado: 2,
  devolvido: 3,
  cancelado: 4,
};

export default function AdminLocacoesPage() {
  const [rentals, setRentals] = useState<RentalWithDetails[]>(store.getRentals());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Tri-State Sorting: Por padrão, já abre ordenado por Status (Alugados -> Reservados -> Devolvidos)
  const [sortState, setSortState] = useState<SortState>({ field: 'status', order: 'asc' });

  // Bulk Selection
  const [selectedRentalIds, setSelectedRentalIds] = useState<string[]>([]);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Modais e Gavetas
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<RentalWithDetails | null>(null);
  const [isChartsModalOpen, setIsChartsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);

  // Modal de Pagamento Rápido
  const [selectedRentalForPayment, setSelectedRentalForPayment] = useState<RentalWithDetails | null>(null);
  const [payAmount, setPayAmount] = useState<number>(50);
  const [payMethod, setPayMethod] = useState<Payment['method']>('pix');
  const [payNote, setPayNote] = useState('');

  // Sincronização reativa com store
  useEffect(() => {
    setRentals(store.getRentals());
    const unsubscribe = store.subscribe(() => {
      setRentals(store.getRentals());
    });
    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Somatórias Financeiras do Topo
  const totalPaidSum = useMemo(() => {
    return rentals.reduce((acc, r) => acc + (r.paid || 0), 0);
  }, [rentals]);

  const totalBalanceSum = useMemo(() => {
    return rentals.reduce((acc, r) => acc + (r.balance || 0), 0);
  }, [rentals]);

  const totalContractedSum = useMemo(() => {
    return rentals.reduce((acc, r) => acc + (r.total || 0), 0);
  }, [rentals]);

  const currentlyRentedCount = useMemo(() => {
    return rentals.filter((r) => r.status === 'alugado').length;
  }, [rentals]);

  const currentlyReservedCount = useMemo(() => {
    return rentals.filter((r) => r.status === 'reservado').length;
  }, [rentals]);

  // Filtragem e Ordenação
  const filteredRentals = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = rentals.filter((r) => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesSearch =
        !q ||
        r.customer?.name.toLowerCase().includes(q) ||
        r.customer?.phone.includes(q) ||
        r.theme?.name.toLowerCase().includes(q) ||
        r.theme?.code.toLowerCase().includes(q) ||
        (r.delivery_location && r.delivery_location.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });

    // Tri-State Sorting
    if (sortState.field === 'status' && sortState.order) {
      list = [...list].sort((a, b) => {
        const aRank = STATUS_ORDER[a.status] ?? 99;
        const bRank = STATUS_ORDER[b.status] ?? 99;
        const diff = sortState.order === 'asc' ? aRank - bRank : bRank - aRank;
        if (diff !== 0) return diff;
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      });
    } else if (sortState.field === 'customer' && sortState.order) {
      list = [...list].sort((a, b) => {
        const aName = a.customer?.name || '';
        const bName = b.customer?.name || '';
        const cmp = aName.localeCompare(bName, 'pt-BR');
        return sortState.order === 'asc' ? cmp : -cmp;
      });
    } else if (sortState.field === 'theme' && sortState.order) {
      list = [...list].sort((a, b) => {
        const aTheme = a.theme?.name || '';
        const bTheme = b.theme?.name || '';
        const cmp = aTheme.localeCompare(bTheme, 'pt-BR');
        return sortState.order === 'asc' ? cmp : -cmp;
      });
    } else if (sortState.field === 'date' && sortState.order) {
      list = [...list].sort((a, b) => {
        const aTime = new Date(a.event_date).getTime();
        const bTime = new Date(b.event_date).getTime();
        return sortState.order === 'asc' ? aTime - bTime : bTime - aTime;
      });
    } else if (sortState.field === 'total' && sortState.order) {
      list = [...list].sort((a, b) => {
        return sortState.order === 'asc' ? a.total - b.total : b.total - a.total;
      });
    } else if (sortState.field === 'balance' && sortState.order) {
      list = [...list].sort((a, b) => {
        return sortState.order === 'asc' ? a.balance - b.balance : b.balance - a.balance;
      });
    } else {
      // Fallback padrão da página: Alugados -> Reservados -> Devolvidos -> Cancelados
      list = [...list].sort((a, b) => {
        const aRank = STATUS_ORDER[a.status] ?? 99;
        const bRank = STATUS_ORDER[b.status] ?? 99;
        const diff = aRank - bRank;
        if (diff !== 0) return diff;
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      });
    }

    return list;
  }, [rentals, search, statusFilter, sortState]);

  // Handle Header Sort Toggle (asc -> desc -> null)
  const handleSort = (field: SortField) => {
    setSortState((prev) => {
      if (prev.field !== field) return { field, order: 'asc' };
      if (prev.order === 'asc') return { field, order: 'desc' };
      return { field: null, order: null };
    });
  };

  // Selection helpers
  const allVisibleSelected =
    filteredRentals.length > 0 &&
    filteredRentals.every((r) => selectedRentalIds.includes(r.id));
  const someVisibleSelected =
    filteredRentals.some((r) => selectedRentalIds.includes(r.id)) && !allVisibleSelected;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredRentals.map((r) => r.id));
      setSelectedRentalIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      const visibleIds = filteredRentals.map((r) => r.id);
      setSelectedRentalIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleSelect = (rentalId: string) => {
    setSelectedRentalIds((prev) =>
      prev.includes(rentalId) ? prev.filter((id) => id !== rentalId) : [...prev, rentalId]
    );
  };

  // Atualizar Status Individual
  const handleStatusChange = (rentalId: string, newStatus: RentalStatus) => {
    store.updateRental(rentalId, { status: newStatus });
    setRentals(store.getRentals());
    showNotification(`Status da locação atualizado para "${newStatus}".`);
  };

  // Atualizar Status em Lote
  const handleBatchStatusUpdate = (newStatus: RentalStatus) => {
    if (selectedRentalIds.length === 0) return;
    selectedRentalIds.forEach((id) => {
      store.updateRental(id, { status: newStatus });
    });
    setRentals(store.getRentals());
    showNotification(`${selectedRentalIds.length} locações atualizadas para "${newStatus}".`);
    setSelectedRentalIds([]);
  };

  // Exclusão Individual & Lote
  const handleTriggerSingleDelete = (rentalId: string) => {
    setDeleteTargetIds([rentalId]);
    setIsDeleteModalOpen(true);
  };

  const handleTriggerBatchDelete = () => {
    if (selectedRentalIds.length === 0) return;
    setDeleteTargetIds(selectedRentalIds);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    const count = deleteTargetIds.length;
    if (count === 0) return;

    store.deleteRentals(deleteTargetIds);
    setRentals(store.getRentals());
    setSelectedRentalIds((prev) => prev.filter((id) => !deleteTargetIds.includes(id)));
    if (editingRental && deleteTargetIds.includes(editingRental.id)) {
      setEditingRental(null);
    }
    setIsDeleteModalOpen(false);
    setDeleteTargetIds([]);
    showNotification(`${count} ${count > 1 ? 'locações excluídas' : 'locação excluída'} com sucesso.`);
  };

  // Registrar Pagamento
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRentalForPayment || payAmount <= 0) return;

    store.recordPayment(selectedRentalForPayment.id, Number(payAmount), payMethod, payNote);
    setRentals(store.getRentals());
    setSelectedRentalForPayment(null);
    setPayNote('');
    showNotification(
      `Pagamento de R$ ${Number(payAmount).toFixed(2).replace('.', ',')} registrado com sucesso!`
    );
  };

  // Nomes das locações para confirmação de exclusão
  const deleteTargetNames = useMemo(() => {
    return rentals
      .filter((r) => deleteTargetIds.includes(r.id))
      .map((r) => `${r.customer?.name} - ${r.theme?.name} (${formatDateBR(r.event_date)})`);
  }, [rentals, deleteTargetIds]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header com Ações Superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Locações
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
              {rentals.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão operacional de reservas, pagamentos parciais, saldo devedor e relatórios visuais.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botão: Extrair Gráficos */}
          <button
            type="button"
            onClick={() => setIsChartsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs sm:text-sm font-bold border border-slate-700/80 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Extrair gráficos, ranking de temas, kits mais alugados e ticket médio"
          >
            <BarChart3 className="w-4 h-4 text-rose-400" />
            <span>Gráficos & Métricas</span>
          </button>

          {/* Botão: Exportar */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs sm:text-sm font-bold border border-slate-700/80 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Exportar locações para Excel, PDF ou texto simples"
          >
            <Download className="w-4 h-4 text-rose-400" />
            <span>Exportar</span>
          </button>

          {/* Botão Principal: Adicionar Reserva/Locação */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Reserva/Locação</span>
          </button>
        </div>
      </div>

      {/* Somatória dos Valores no Topo da Página (KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Somatória dos Valores Pagos */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Pago Recebido
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight block">
              R$ {totalPaidSum.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Valores já liquidados via PIX/Cartão
            </span>
          </div>
        </div>

        {/* 2. Somatória do Saldo Devedor (Quanto ainda falta receber) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saldo Devedor a Receber
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight block">
              R$ {totalBalanceSum.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Quanto ainda falta receber dos clientes
            </span>
          </div>
        </div>

        {/* 3. Valor Total Contratado */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Contratado
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
              R$ {totalContractedSum.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Faturamento bruto de todas as locações
            </span>
          </div>
        </div>

        {/* 4. Temas Alugados vs. Reservados */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ocupação de Temas
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {currentlyRentedCount}
            </span>
            <span className="text-xs text-slate-400 font-semibold">alugados</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {currentlyReservedCount}
            </span>
            <span className="text-xs text-slate-400 font-semibold">reservados</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
            Status operacional do acervo no momento
          </span>
        </div>
      </div>

      {/* Notificação Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Barra de Busca & Filtros por Status */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, telefone, tema, código, local de entrega ou observações..."
            className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { key: 'all', label: 'Todos os Status' },
            { key: 'reservado', label: 'Reservado' },
            { key: 'alugado', label: 'Alugado' },
            { key: 'devolvido', label: 'Devolvido' },
            { key: 'cancelado', label: 'Cancelado' },
          ].map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st.key
                  ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Mobile Quick-Sort Chips */}
        <div className="flex md:hidden items-center gap-2 w-full justify-between pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Ordenar:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSort('status')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                sortState.field === 'status'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>Status</span>
              {sortState.field === 'status' ? (
                sortState.order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSort('customer')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                sortState.field === 'customer'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>Cliente</span>
              {sortState.field === 'customer' ? (
                sortState.order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSort('date')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                sortState.field === 'date'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>Data</span>
              {sortState.field === 'date' ? (
                sortState.order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSort('balance')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                sortState.field === 'balance'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>Saldo</span>
              {sortState.field === 'balance' ? (
                sortState.order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dica de edição rápida */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-1">
        <Edit3 className="w-3.5 h-3.5 text-rose-500" />
        <span>
          <strong>Dica:</strong> Clique em qualquer linha ou card para abrir a gaveta lateral com histórico completo de pagamentos, dados de entrega e detalhes da locação.
        </span>
      </div>

      {/* Mobile Rentals Cards (touch-friendly) */}
      <div className="md:hidden space-y-3">
        {filteredRentals.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
            <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <span>Nenhuma locação encontrada com os filtros selecionados.</span>
          </div>
        ) : (
          filteredRentals.map((rental) => {
            const isSelected = selectedRentalIds.includes(rental.id);
            const rawPhone = rental.customer?.phone?.replace(/\D/g, '') || '';
            const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

            return (
              <div
                key={rental.id}
                onClick={() => setEditingRental(rental)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Header Card Mobile */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggleSelect(rental.id)}
                      className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {rental.customer?.name}
                      </h3>
                      {rental.customer?.phone && (
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${rental.customer.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-rose-600"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{rental.customer.phone}</span>
                          </a>
                          <a
                            href={`https://wa.me/${waPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={rental.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(rental.id, e.target.value as RentalStatus)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize border focus:outline-none ${
                      rental.status === 'reservado'
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300'
                        : rental.status === 'alugado'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300'
                        : rental.status === 'devolvido'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <option value="reservado">Reservado</option>
                    <option value="alugado">Alugado</option>
                    <option value="devolvido">Devolvido</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                {/* Tema e Detalhes */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{rental.theme?.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-mono font-bold">
                      {rental.theme?.code}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {rental.theme_variant?.name || 'Padrão'} {rental.kit ? `• ${rental.kit.name}` : ''}
                  </span>
                  <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">📅 Festa:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {formatDateBR(rental.event_date)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>📦 Retirada: {formatDateBR(rental.pickup_date)}</span>
                      <span>🔄 Devolução: {formatDateBR(rental.return_date)}</span>
                    </div>
                    {rental.delivery_location && (
                      <div className="text-[10px] text-slate-400 truncate pt-0.5">
                        📍 {rental.delivery_location}
                      </div>
                    )}
                  </div>
                </div>

                {/* Financeiro e Botão Pagar */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                      Total: R$ {rental.total.toFixed(2).replace('.', ',')}
                    </span>
                    <span
                      className={`text-xs font-extrabold ${
                        rental.balance === 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {rental.balance === 0
                        ? 'Quitado'
                        : `Saldo devedor: R$ ${rental.balance.toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRentalForPayment(rental);
                      setPayAmount(rental.balance > 0 ? rental.balance : 50);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Pagar</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Rentals Table (visible on md+) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    ref={masterCheckboxRef}
                    checked={allVisibleSelected}
                    onChange={handleToggleSelectAll}
                    aria-label="Selecionar todas as locações visíveis"
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                </th>

                {/* Header Cliente */}
                <th
                  onClick={() => handleSort('customer')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Cliente / Contato</span>
                    {sortState.field === 'customer' ? (
                      sortState.order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-rose-600" /> : <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </th>

                {/* Header Tema */}
                <th
                  onClick={() => handleSort('theme')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tema / Variação</span>
                    {sortState.field === 'theme' ? (
                      sortState.order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-rose-600" /> : <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </th>

                {/* Header Datas */}
                <th
                  onClick={() => handleSort('date')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Intervalo de Datas</span>
                    {sortState.field === 'date' ? (
                      sortState.order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-rose-600" /> : <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </th>

                {/* Header Financeiro */}
                <th
                  onClick={() => handleSort('balance')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Total / Saldo Devedor</span>
                    {sortState.field === 'balance' ? (
                      sortState.order === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-rose-600" /> : <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </th>

                {/* Header Status com ordenação */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {sortState.field === 'status' ? (
                      sortState.order === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredRentals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhuma locação encontrada.
                  </td>
                </tr>
              ) : (
                filteredRentals.map((rental) => {
                  const isSelected = selectedRentalIds.includes(rental.id);
                  const rawPhone = rental.customer?.phone?.replace(/\D/g, '') || '';
                  const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

                  return (
                    <tr
                      key={rental.id}
                      onClick={() => setEditingRental(rental)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(rental.id)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {rental.customer?.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {rental.customer?.phone}
                          </span>
                          {rental.customer?.phone && (
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                        {rental.delivery_location && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate max-w-xs">
                            📍 {rental.delivery_location}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {rental.theme?.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                            {rental.theme?.code}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {rental.theme_variant?.name || 'Padrão'} {rental.kit ? `• ${rental.kit.name}` : ''}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs">
                        <span className="font-semibold text-rose-600 dark:text-rose-400 block">
                          📅 Festa: {formatDateBR(rental.event_date)}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          📦 {formatDateBR(rental.pickup_date)} ➔ 🔄 {formatDateBR(rental.return_date)}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          R$ {rental.total.toFixed(2).replace('.', ',')}
                        </span>
                        <span
                          className={`text-[11px] font-semibold block mt-0.5 ${
                            rental.balance === 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {rental.balance === 0
                            ? 'Quitado'
                            : `Saldo: R$ ${rental.balance.toFixed(2).replace('.', ',')}`}
                        </span>
                      </td>

                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={rental.status}
                          onChange={(e) => handleStatusChange(rental.id, e.target.value as RentalStatus)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize border focus:outline-none ${
                            rental.status === 'reservado'
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300'
                              : rental.status === 'alugado'
                              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300'
                              : rental.status === 'devolvido'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <option value="reservado">Reservado</option>
                          <option value="alugado">Alugado</option>
                          <option value="devolvido">Devolvido</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>

                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRentalForPayment(rental);
                            setPayAmount(rental.balance > 0 ? rental.balance : 50);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors border border-emerald-200 dark:border-emerald-800/50 cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Pagar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de Ações em Lote */}
      <RentalBatchActionBar
        selectedCount={selectedRentalIds.length}
        onClearSelection={() => setSelectedRentalIds([])}
        onUpdateStatus={handleBatchStatusUpdate}
        onDelete={handleTriggerBatchDelete}
      />

      {/* Modal: Adicionar Reserva/Locação */}
      <CreateRentalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(msg) => {
          setRentals(store.getRentals());
          showNotification(msg);
        }}
      />

      {/* Modal: Gráficos & Métricas */}
      <RentalChartsModal
        isOpen={isChartsModalOpen}
        onClose={() => setIsChartsModalOpen(false)}
        rentals={rentals}
      />

      {/* Modal: Exportar Locações */}
      <ExportRentalsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        rentals={filteredRentals}
        onNotify={showNotification}
      />

      {/* Gaveta de Edição e Detalhes da Locação */}
      <RentalEditDrawer
        rental={editingRental}
        isOpen={!!editingRental}
        onClose={() => setEditingRental(null)}
        onSave={(updated) => {
          setRentals(store.getRentals());
          setEditingRental(updated);
        }}
        onDelete={handleTriggerSingleDelete}
      />

      {/* Modal: Confirmar Exclusão */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTargetIds([]);
        }}
        onConfirm={handleConfirmDelete}
        entityLabel="Locação"
        itemNames={deleteTargetNames}
      />

      {/* Modal: Registrar Pagamento Rápido */}
      {selectedRentalForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Registrar Pagamento para {selectedRentalForPayment.customer?.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tema: <strong>{selectedRentalForPayment.theme?.name}</strong> • Saldo Atual: R${' '}
              {selectedRentalForPayment.balance.toFixed(2).replace('.', ',')}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Pago (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Forma de Pagamento *
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as Payment['method'])}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comprovante / Observação
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Ex: Quitação final na retirada, Sinal PIX..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRentalForPayment(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                >
                  Confirmar Recebimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
