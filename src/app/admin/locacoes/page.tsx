'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  TrendingUp,
  Filter,
  RotateCcw,
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

export type PeriodFilter = 'current_month' | 'next_60_days' | 'last_60_days' | 'prev_month' | 'next_month' | 'custom' | 'all';
export type FinancialFilter = 'all' | 'pending' | 'paid' | 'historico' | 'zero';
export type OperationalFilter = 'all' | 'active' | 'waiting' | 'in_progress' | 'returned' | 'historico' | 'cancelled';

// Ordem prioritária de status: Alugados -> Reservados -> Devolvidos -> Cancelados -> Histórico
const STATUS_ORDER: Record<string, number> = {
  alugado: 1,
  reservado: 2,
  devolvido: 3,
  cancelado: 4,
  historico: 5,
};

function LocacoesManagementContent() {
  const searchParams = useSearchParams();
  const [rentals, setRentals] = useState<RentalWithDetails[]>(store.getRentals());
  const [search, setSearch] = useState('');
  
  // Três Filtros Combinados Inteligentes
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(() => {
    const p = searchParams.get('period');
    return (p as PeriodFilter) || 'current_month';
  });
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [financialFilter, setFinancialFilter] = useState<FinancialFilter>(() => {
    const f = searchParams.get('financial');
    return (f as FinancialFilter) || 'all';
  });
  const [operationalFilter, setOperationalFilter] = useState<OperationalFilter>(() => {
    const op = searchParams.get('operational');
    return (op as OperationalFilter) || 'all';
  });

  // Sincroniza filtros caso a rota seja alterada com query params
  useEffect(() => {
    const p = searchParams.get('period') as PeriodFilter | null;
    const f = searchParams.get('financial') as FinancialFilter | null;
    const op = searchParams.get('operational') as OperationalFilter | null;
    if (p) setPeriodFilter(p);
    if (f) setFinancialFilter(f);
    if (op) setOperationalFilter(op);
  }, [searchParams]);

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

  // Helper de cálculo de datas
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayTime = new Date(currentYear, currentMonth, now.getDate()).getTime();
  const in60Days = todayTime + 60 * 24 * 60 * 60 * 1000;
  const past60Days = todayTime - 60 * 24 * 60 * 60 * 1000;

  // 1. Filtragem Combinada (Período + Financeiro + Operacional + Busca) e Ordenação
  const filteredRentals = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = rentals.filter((r) => {
      // 1. Filtro de Período
      if (periodFilter !== 'all') {
        const evtDate = new Date(r.event_date + 'T12:00:00Z');
        const evtYear = evtDate.getUTCFullYear();
        const evtMonth = evtDate.getUTCMonth();
        const evtTime = evtDate.getTime();

        if (periodFilter === 'current_month' && !(evtYear === currentYear && evtMonth === currentMonth)) {
          return false;
        }
        if (periodFilter === 'prev_month') {
          const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (!(evtYear === targetYear && evtMonth === targetMonth)) return false;
        }
        if (periodFilter === 'next_month') {
          const targetMonth = currentMonth === 11 ? 0 : currentMonth + 1;
          const targetYear = currentMonth === 11 ? currentYear + 1 : currentYear;
          if (!(evtYear === targetYear && evtMonth === targetMonth)) return false;
        }
        if (periodFilter === 'next_60_days' && !(evtTime >= todayTime && evtTime <= in60Days)) {
          return false;
        }
        if (periodFilter === 'last_60_days' && !(evtTime <= todayTime && evtTime >= past60Days)) {
          return false;
        }
        if (periodFilter === 'custom') {
          if (customStartDate && r.event_date < customStartDate) return false;
          if (customEndDate && r.event_date > customEndDate) return false;
        }
      }

      // 2. Filtro Financeiro
      if (financialFilter === 'pending' && (r.balance <= 0 || r.status === 'cancelado' || r.status === 'historico')) {
        return false;
      }
      if (financialFilter === 'paid' && (r.balance > 0 || r.total <= 0 || r.status === 'cancelado')) {
        return false;
      }
      if (financialFilter === 'historico' && r.status !== 'historico') {
        return false;
      }
      if (financialFilter === 'zero' && r.total > 0) {
        return false;
      }

      // 3. Filtro Operacional
      if (operationalFilter === 'active' && r.status !== 'reservado' && r.status !== 'alugado') {
        return false;
      }
      if (operationalFilter === 'waiting' && r.status !== 'reservado') {
        return false;
      }
      if (operationalFilter === 'in_progress' && r.status !== 'alugado') {
        return false;
      }
      if (operationalFilter === 'returned' && r.status !== 'devolvido') {
        return false;
      }
      if (operationalFilter === 'historico' && r.status !== 'historico') {
        return false;
      }
      if (operationalFilter === 'cancelled' && r.status !== 'cancelado') {
        return false;
      }

      // 4. Busca textual
      const matchesSearch =
        !q ||
        (r.customer?.name && r.customer.name.toLowerCase().includes(q)) ||
        (r.customer?.phone && r.customer.phone.includes(q)) ||
        (r.theme?.name && r.theme.name.toLowerCase().includes(q)) ||
        (r.theme?.code && r.theme.code.toLowerCase().includes(q)) ||
        (r.delivery_location && r.delivery_location.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q));

      return matchesSearch;
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
      // Fallback padrão da página: Alugados -> Reservados -> Devolvidos -> Cancelados -> Histórico
      list = [...list].sort((a, b) => {
        const aRank = STATUS_ORDER[a.status] ?? 99;
        const bRank = STATUS_ORDER[b.status] ?? 99;
        const diff = aRank - bRank;
        if (diff !== 0) return diff;
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      });
    }

    return list;
  }, [rentals, search, periodFilter, customStartDate, customEndDate, financialFilter, operationalFilter, sortState, currentYear, currentMonth, todayTime, in60Days, past60Days]);

  // 2. Somatórias Financeiras e Sub-totais do Filtro Selecionado
  const totalPaidSum = useMemo(() => {
    return filteredRentals
      .filter((r) => r.status !== 'cancelado')
      .reduce((acc, r) => acc + (r.status === 'historico' ? (r.paid || r.total || 0) : (r.paid || 0)), 0);
  }, [filteredRentals]);

  const totalBalanceSum = useMemo(() => {
    return filteredRentals
      .filter((r) => r.status !== 'cancelado' && r.status !== 'historico')
      .reduce((acc, r) => acc + (r.balance || 0), 0);
  }, [filteredRentals]);

  const totalContractedSum = useMemo(() => {
    return filteredRentals
      .filter((r) => r.status !== 'cancelado')
      .reduce((acc, r) => acc + (r.total || 0), 0);
  }, [filteredRentals]);

  const periodEventsCount = useMemo(() => {
    return filteredRentals.filter((r) => r.status !== 'cancelado').length;
  }, [filteredRentals]);

  // 3. Ticket Médio Comercial do Filtro Selecionado
  const averageTicket = useMemo(() => {
    const validEvents = filteredRentals.filter(
      (r) => r.status !== 'cancelado' && r.total > 0
    );
    if (validEvents.length === 0) return 0;
    return totalContractedSum / validEvents.length;
  }, [filteredRentals, totalContractedSum]);

  const currentlyRentedCount = useMemo(() => {
    return rentals.filter((r) => r.status === 'alugado').length;
  }, [rentals]);

  const currentlyReservedCount = useMemo(() => {
    return rentals.filter((r) => r.status === 'reservado').length;
  }, [rentals]);

  // Mapeamento sequencial de pedidos (#0001, #0002, ...)
  const rentalOrderNumbers = useMemo(() => {
    const sorted = [...rentals].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const map = new Map<string, string>();
    sorted.forEach((r, idx) => {
      const match = r.notes?.match(/Pedido:\s*#([0-9A-Za-z]+)/i);
      const num = match ? `#${match[1]}` : `#${String(idx + 1).padStart(4, '0')}`;
      map.set(r.id, num);
    });
    return map;
  }, [rentals]);

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
      .map((r) => `${r.customer?.name || 'Cliente'} - ${r.theme?.name || 'Tema Desvinculado'} (${formatDateBR(r.event_date)})`);
  }, [rentals, deleteTargetIds]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header com Ações Superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Locações
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
              {rentals.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão operacional de reservas, pagamentos parciais e saldo devedor
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Botão: Extrair Gráficos */}
          <button
            type="button"
            onClick={() => setIsChartsModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs font-bold border border-slate-700/80 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Extrair gráficos, ranking de temas, kits mais alugados e ticket médio"
          >
            <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
            <span>Gráficos</span>
          </button>

          {/* Botão: Exportar */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs font-bold border border-slate-700/80 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Exportar locações para Excel, PDF ou texto simples"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Exportar</span>
          </button>

          {/* Botão Principal: Adicionar Reserva/Locação */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Reserva / Locação</span>
          </button>
        </div>
      </div>

      {/* Somatória dos Valores no Topo da Página (KPI Cards com Ticket Médio) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* 1. Somatória dos Valores Pagos */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Recebido
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-base sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight block truncate">
              R$ {totalPaidSum.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              Já liquidado no filtro
            </span>
          </div>
        </div>

        {/* 2. Somatória do Saldo Devedor */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Saldo a Receber
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-base sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight block truncate">
              R$ {totalBalanceSum.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              Pendente dos clientes
            </span>
          </div>
        </div>

        {/* 3. Valor Total Contratado */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Contratado
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight block truncate">
              R$ {totalContractedSum.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              Faturamento no filtro
            </span>
          </div>
        </div>

        {/* 4. Ticket Médio Comercial por Locação */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Ticket Médio
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-base sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight block truncate">
              R$ {averageTicket.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              {periodEventsCount} {periodEventsCount === 1 ? 'locação no filtro' : 'locações no filtro'}
            </span>
          </div>
        </div>
      </div>

      {/* Notificação Toast */}
      {notification && (
        <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Barra de Filtros Inteligente e Combinada */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Linha 1: Busca Textual e Botão de Limpar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 w-full flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, telefone, tema, pedido # ou local..."
              className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {(periodFilter !== 'current_month' || financialFilter !== 'all' || operationalFilter !== 'all' || search || customStartDate || customEndDate) && (
            <button
              type="button"
              onClick={() => {
                setPeriodFilter('current_month');
                setCustomStartDate('');
                setCustomEndDate('');
                setFinancialFilter('all');
                setOperationalFilter('all');
                setSearch('');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* Linha 2: Os Três Filtros Combinados */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {/* 1. Filtro de Período Temporal */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              📅 Período
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="current_month">Mês Atual (Outubro/2026)</option>
              <option value="next_60_days">Próximos 60 Dias</option>
              <option value="last_60_days">Últimos 60 Dias</option>
              <option value="prev_month">Mês Anterior (Setembro)</option>
              <option value="next_month">Próximo Mês (Novembro)</option>
              <option value="custom">📅 Período Personalizado...</option>
              <option value="all">Geral (Todo o Histórico)</option>
            </select>

            {periodFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                    De:
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                    Até:
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Filtro de Situação Financeira */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              💰 Situação Financeira
            </label>
            <select
              value={financialFilter}
              onChange={(e) => setFinancialFilter(e.target.value as FinancialFilter)}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="all">Todas as Situações</option>
              <option value="pending">⚠️ Falta Receber (Com Saldo Devedor)</option>
              <option value="paid">✅ Quitados (100% Pagos)</option>
              <option value="historico">🏷️ Histórico / Passado (Isentos)</option>
              <option value="zero">🎁 Cortesias (R$ 0,00)</option>
            </select>
          </div>

          {/* 3. Filtro de Estágio Operacional */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              📦 Estágio Operacional
            </label>
            <select
              value={operationalFilter}
              onChange={(e) => setOperationalFilter(e.target.value as OperationalFilter)}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="all">Todos os Estágios</option>
              <option value="active">✨ Reservas Ativas (No Depósito + Na Rua)</option>
              <option value="waiting">📦 No Depósito (Aguardando Saída)</option>
              <option value="in_progress">🚚 Na Rua (Em Andamento)</option>
              <option value="returned">🔄 Devolvidos</option>
              <option value="historico">📁 Histórico / Concluído</option>
              <option value="cancelled">❌ Cancelados</option>
            </select>
          </div>
        </div>

        {/* Mobile Quick-Sort Chips */}
        <div className="flex md:hidden items-center gap-2 w-full justify-between pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none pb-0.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Ordenar:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
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
      <div className="hidden sm:flex text-[11px] text-slate-500 dark:text-slate-400 items-center gap-1.5 px-1">
        <Edit3 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>
          <strong>Dica:</strong> Toque em qualquer linha ou card para abrir a gaveta lateral com histórico de pagamentos e detalhes completos.
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700">
                          {rentalOrderNumbers.get(rental.id) || '#0001'}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {rental.customer?.name || 'Cliente Não Informado'}
                        </h3>
                      </div>
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
                        : rental.status === 'historico'
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900/60 text-purple-700 dark:text-purple-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <option value="reservado">Reservado</option>
                    <option value="alugado">Alugado</option>
                    <option value="devolvido">Devolvido</option>
                    <option value="historico">Histórico / Passado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                {/* Tema e Detalhes */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {rental.theme?.name || 'Tema Desvinculado'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-mono font-bold">
                      {rental.theme?.code || 'S/N'}
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
                    {rental.status === 'historico' ? (
                      <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                        Histórico / Passado
                      </span>
                    ) : rental.total === 0 ? (
                      <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                        Cortesia (R$ 0,00)
                      </span>
                    ) : (
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
                    )}
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
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 shrink-0">
                            {rentalOrderNumbers.get(rental.id) || '#0001'}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {rental.customer?.name || 'Cliente'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {rental.customer?.phone || ''}
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
                            {rental.theme?.name || 'Tema Desvinculado'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                            {rental.theme?.code || 'S/N'}
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
                        {rental.status === 'historico' ? (
                          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
                            Histórico / Passado
                          </span>
                        ) : rental.total === 0 ? (
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                            Cortesia (R$ 0,00)
                          </span>
                        ) : (
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
                        )}
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
                              : rental.status === 'historico'
                              ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900/60 text-purple-700 dark:text-purple-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <option value="reservado">Reservado</option>
                          <option value="alugado">Alugado</option>
                          <option value="devolvido">Devolvido</option>
                          <option value="historico">Histórico / Passado</option>
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

export default function AdminLocacoesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          Carregando gestão de locações e agenda...
        </div>
      }
    >
      <LocacoesManagementContent />
    </Suspense>
  );
}
