'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Palette,
  Package2,
  Calendar,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Sparkles,
  Clock,
  MessageCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { store } from '@/lib/store';
import { formatDateBR } from '@/lib/dateUtils';
import { ThemeWithDetails, Item, RentalWithDetails } from '@/types/database';
import { RentalEditDrawer } from '@/components/locacoes/RentalEditDrawer';

export default function AdminDashboardPage() {
  const [themes, setThemes] = useState<ThemeWithDetails[]>(store.getThemes());
  const [items, setItems] = useState<Item[]>(store.getItems());
  const [rentals, setRentals] = useState<RentalWithDetails[]>(store.getRentals());
  const [selectedRental, setSelectedRental] = useState<RentalWithDetails | null>(null);

  useEffect(() => {
    const updateState = () => {
      setThemes(store.getThemes());
      setItems(store.getItems());
      setRentals(store.getRentals());
    };

    updateState();
    const unsubscribe = store.subscribe(updateState);
    return () => unsubscribe();
  }, []);

  const totalThemes = themes.length;

  // Navegação de mês inteligente (inicia sempre no mês e ano vigentes do sistema)
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    const realNow = new Date();
    setSelectedYear(realNow.getFullYear());
    setSelectedMonth(realNow.getMonth());
  };

  const isCurrentSystemMonth = useMemo(() => {
    const realNow = new Date();
    return selectedYear === realNow.getFullYear() && selectedMonth === realNow.getMonth();
  }, [selectedYear, selectedMonth]);

  const currentMonthLabel = `${monthNames[selectedMonth]} de ${selectedYear}`;

  // Locações do mês selecionado (não canceladas)
  const selectedMonthRentals = useMemo(() => {
    return rentals.filter((r) => {
      if (!r.event_date || r.status === 'cancelado') return false;
      const evtDate = new Date(r.event_date.split('T')[0] + 'T12:00:00Z');
      return evtDate.getUTCFullYear() === selectedYear && evtDate.getUTCMonth() === selectedMonth;
    });
  }, [rentals, selectedYear, selectedMonth]);

  // Contagem do status de locação levando em consideração apenas as locações do mês selecionado
  const waitingRentalsCount = useMemo(() => {
    return selectedMonthRentals.filter((r) => r.status === 'reservado').length;
  }, [selectedMonthRentals]);

  const rentedRentalsCount = useMemo(() => {
    return selectedMonthRentals.filter((r) => r.status === 'alugado').length;
  }, [selectedMonthRentals]);

  const completedRentalsCount = useMemo(() => {
    return selectedMonthRentals.filter((r) => r.status === 'devolvido' || r.status === 'historico').length;
  }, [selectedMonthRentals]);

  // Filtro de etiquetas de status: 'todos' | 'aguardando' | 'alugados' | 'concluidos'
  type StatusFilter = 'todos' | 'aguardando' | 'alugados' | 'concluidos';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');

  // Saldo Recebido no mês selecionado (ajustado de acordo com a navegação de meses)
  const selectedMonthReceived = useMemo(() => {
    return selectedMonthRentals.reduce(
      (acc, r) => acc + (r.status === 'historico' ? (r.paid || r.total || 0) : (r.paid || 0)),
      0
    );
  }, [selectedMonthRentals]);

  // Saldo a Receber no mês selecionado (ajustado de acordo com a navegação de meses)
  const selectedMonthBalanceToReceive = useMemo(() => {
    return selectedMonthRentals
      .filter((r) => r.status !== 'historico')
      .reduce((acc, r) => acc + (r.balance || 0), 0);
  }, [selectedMonthRentals]);

  // Lista de locações do mês selecionado, ordenadas cronologicamente
  const monthRentalsList = useMemo(() => {
    return [...selectedMonthRentals].sort((a, b) => {
      const aDate = a.event_date ? a.event_date.split('T')[0] : '';
      const bDate = b.event_date ? b.event_date.split('T')[0] : '';
      return aDate.localeCompare(bDate);
    });
  }, [selectedMonthRentals]);

  // Filtragem da lista pelo status selecionado (Aguardando, Alugados, Concluídos ou Todos)
  const filteredMonthRentals = useMemo(() => {
    if (statusFilter === 'todos') return monthRentalsList;
    if (statusFilter === 'aguardando') {
      return monthRentalsList.filter((r) => r.status === 'reservado');
    }
    if (statusFilter === 'alugados') {
      return monthRentalsList.filter((r) => r.status === 'alugado');
    }
    if (statusFilter === 'concluidos') {
      return monthRentalsList.filter((r) => r.status === 'devolvido' || r.status === 'historico');
    }
    return monthRentalsList;
  }, [monthRentalsList, statusFilter]);

  // Etiqueta e estilo de badge
  const getRentalStatusBadge = (status: string) => {
    switch (status) {
      case 'reservado':
        return {
          label: 'Aguardando',
          classes: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40',
        };
      case 'alugado':
        return {
          label: 'Alugado',
          classes: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40',
        };
      case 'devolvido':
      case 'historico':
        return {
          label: 'Concluído',
          classes: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40',
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          classes: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40',
        };
      default:
        return {
          label: status,
          classes: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
        };
    }
  };

  // Identificação dinâmica de conflito real de estoque entre reservas ativas
  const stockConflict = useMemo(() => {
    for (const theme of themes) {
      const activeForTheme = rentals.filter(
        (r) => r.theme_id === theme.id && (r.status === 'reservado' || r.status === 'alugado')
      );
      if (activeForTheme.length > 0) {
        for (const r1 of activeForTheme) {
          const r1Start = new Date(r1.pickup_date).getTime();
          const r1End = new Date(r1.return_date).getTime();
          const overlapping = activeForTheme.filter((r2) => {
            const r2Start = new Date(r2.pickup_date).getTime();
            const r2End = new Date(r2.return_date).getTime();
            return r1Start <= r2End && r1End >= r2Start;
          });
          if (overlapping.length > (theme.stock_quantity || 1)) {
            return {
              hasConflict: true,
              themeName: theme.name,
              stockTotal: theme.stock_quantity || 1,
              stockCommitted: overlapping.length,
              periodText: `${formatDateBR(r1.pickup_date)} a ${formatDateBR(r1.return_date)}`,
            };
          }
        }
      }
    }
    return null;
  }, [themes, rentals]);

  return (
    <div className="space-y-5 sm:space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Visão Geral da Operação
          </h1>
        </div>

        {/* Botoes Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/admin/locacoes"
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            + Nova Reserva
          </Link>
          <Link
            href="/admin/temas"
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Novo Tema
          </Link>
        </div>

        {/* 3 Botoes Padronizados no Mobile: Quantidade de Temas, Nova Reserva e Novo Tema */}
        <div className="grid grid-cols-3 gap-1.5 w-full sm:hidden">
          <Link
            href="/admin/temas"
            className="flex items-center justify-center gap-1 py-2 px-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors text-center truncate"
            title="Ir para página de temas"
          >
            <Palette className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">{totalThemes} Temas</span>
          </Link>
          <Link
            href="/admin/locacoes"
            className="flex items-center justify-center py-2 px-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors text-center truncate"
          >
            + Reserva
          </Link>
          <Link
            href="/admin/temas"
            className="flex items-center justify-center py-2 px-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors text-center truncate"
          >
            + Tema
          </Link>
        </div>
      </div>

      {/* Stock Conflict Alert Banner (Dinamico) */}
      {stockConflict && stockConflict.hasConflict && (
        <div className="p-3.5 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <h4 className="text-xs sm:text-sm font-bold sm:hidden">Conflito Potencial de Estoque</h4>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold hidden sm:block">Atenção: Conflito Potencial de Estoque Detectado</h4>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              O tema <strong>{stockConflict.themeName}</strong> possui {stockConflict.stockTotal} unidade(s) no total e está com {stockConflict.stockCommitted} locações ativas com sobreposição no período de {stockConflict.periodText}.
            </p>
          </div>
          <Link
            href="/admin/locacoes?period=all&operational=active"
            className="self-start sm:self-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Ver em Locações
          </Link>
        </div>
      )}

      {/* Navegador Inteligente de Meses */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 sm:px-5 py-2.5 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-left min-w-[130px] sm:min-w-[180px]">
            <span className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white capitalize block leading-tight">
              {currentMonthLabel}
            </span>
            {isCurrentSystemMonth ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                Mês Vigente
              </span>
            ) : (
              <button
                onClick={handleResetToCurrentMonth}
                className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-bold block cursor-pointer"
              >
                Voltar ao mês atual
              </button>
            )}
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-right text-xs">
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">Locações no mês: </span>
          <span className="font-extrabold text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {monthRentalsList.length} {monthRentalsList.length === 1 ? 'evento' : 'eventos'}
          </span>
        </div>
      </div>

      {/* 4 Primary KPI Cards com Links Diretos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        {/* 1. Total Themes -> Visivel no Desktop, no Mobile ja fica no topo */}
        <Link
          href="/admin/temas"
          className="hidden sm:flex col-span-1 p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md transition-all cursor-pointer flex-col justify-between group"
          title="Clique para ir à página de Temas"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Quantidade de Temas
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3 flex items-baseline sm:block gap-2">
            <div className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {totalThemes}
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block sm:inline mt-0.5 sm:mt-0 sm:ml-2">
              cadastrados no acervo
            </span>
          </div>
        </Link>

        {/* 2. Saldo Recebido (Mês Selecionado) - Compacto no Mobile */}
        <Link
          href="/admin/locacoes?financial=paid"
          className="col-span-1 p-2.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title={`Clique para ver as locações quitadas de ${currentMonthLabel}`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Saldo Recebido
            </span>
            <div className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <div className="text-sm xs:text-base sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-tight truncate">
              R$ {selectedMonthReceived.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate capitalize">
              {monthNames[selectedMonth]}
            </span>
          </div>
        </Link>

        {/* 3. Saldo a Receber (Mês Selecionado) - Compacto no Mobile */}
        <Link
          href="/admin/locacoes?financial=pending"
          className="col-span-1 p-2.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title={`Clique para ver as locações com saldo a receber de ${currentMonthLabel}`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Saldo a Receber
            </span>
            <div className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <div className="text-sm xs:text-base sm:text-2xl font-black text-amber-600 dark:text-amber-400 leading-tight truncate">
              R$ {selectedMonthBalanceToReceive.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate capitalize">
              {monthNames[selectedMonth]}
            </span>
          </div>
        </Link>

        {/* 4. Status dos Temas: Aguardando, Alugados e Concluídos do mês selecionado */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
              title="Clique para ver todas as locações do mês"
            >
              Status das Locações
            </button>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="mt-2 sm:mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2">
            {/* Aguardando */}
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === 'aguardando' ? 'todos' : 'aguardando'))}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col items-center text-center cursor-pointer group ${
                statusFilter === 'aguardando'
                  ? 'bg-blue-100 dark:bg-blue-900/60 border-blue-400 ring-2 ring-blue-400/40'
                  : 'bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200/60 dark:border-blue-900/40'
              }`}
              title="Filtrar temas aguardando no mês"
            >
              <span className="text-base sm:text-xl font-black text-blue-700 dark:text-blue-300 leading-none group-hover:scale-105 transition-transform">
                {waitingRentalsCount}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-blue-600/90 dark:text-blue-400/90 mt-1 uppercase tracking-tight truncate w-full">
                Aguardando
              </span>
            </button>

            {/* Alugados */}
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === 'alugados' ? 'todos' : 'alugados'))}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col items-center text-center cursor-pointer group ${
                statusFilter === 'alugados'
                  ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-400 ring-2 ring-amber-400/40'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-amber-200/60 dark:border-amber-900/40'
              }`}
              title="Filtrar temas alugados (na rua) no mês"
            >
              <span className="text-base sm:text-xl font-black text-amber-700 dark:text-amber-300 leading-none group-hover:scale-105 transition-transform">
                {rentedRentalsCount}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-amber-600/90 dark:text-amber-400/90 mt-1 uppercase tracking-tight truncate w-full">
                Alugados
              </span>
            </button>

            {/* Concluídos */}
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === 'concluidos' ? 'todos' : 'concluidos'))}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col items-center text-center cursor-pointer group ${
                statusFilter === 'concluidos'
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-400 ring-2 ring-emerald-400/40'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-200/60 dark:border-emerald-900/40'
              }`}
              title="Filtrar temas concluídos no mês"
            >
              <span className="text-base sm:text-xl font-black text-emerald-700 dark:text-emerald-300 leading-none group-hover:scale-105 transition-transform">
                {completedRentalsCount}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600/90 dark:text-emerald-400/90 mt-1 uppercase tracking-tight truncate w-full">
                Concluídos
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Eventos & Locações do Mês Selecionado */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Eventos & Locações do Mês
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 capitalize">
              {monthNames[selectedMonth]} / {selectedYear}
            </span>
          </div>

          {/* Filtro por Etiquetas: Todos, Aguardando, Alugados, Concluídos */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold mr-1 hidden sm:inline">Filtrar:</span>
            
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'todos'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({monthRentalsList.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('aguardando')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'aguardando'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"></span>
              <span>Aguardando ({waitingRentalsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('alugados')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'alugados'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
              <span>Alugados ({rentedRentalsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('concluidos')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'concluidos'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-900/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              <span>Concluídos ({completedRentalsCount})</span>
            </button>

            <Link
              href="/admin/locacoes"
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 shrink-0 ml-1.5"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {filteredMonthRentals.length === 0 ? (
          <div className="py-12 px-4 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {monthRentalsList.length === 0
                ? `Nenhuma locação agendada para ${currentMonthLabel}.`
                : `Nenhuma locação com o status "${statusFilter}" em ${currentMonthLabel}.`}
            </p>
            {statusFilter !== 'todos' ? (
              <button
                type="button"
                onClick={() => setStatusFilter('todos')}
                className="mt-3 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Limpar filtro e ver todas ({monthRentalsList.length})
              </button>
            ) : (
              <Link
                href="/admin/locacoes"
                className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                Ver Todas as Locações na Agenda
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* 1. Tabela em Linha para Versão Web (Padrão da aba Locações) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Cliente / Contato</th>
                    <th className="py-3 px-4">Tema / Variação</th>
                    <th className="py-3 px-4">Intervalo de Datas</th>
                    <th className="py-3 px-4">Total / Saldo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                  {filteredMonthRentals.map((rental) => {
                    const badge = getRentalStatusBadge(rental.status);
                    const rawPhone = rental.customer?.phone?.replace(/\D/g, '') || '';
                    const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

                    return (
                      <tr
                        key={rental.id}
                        onClick={() => setSelectedRental(rental)}
                        className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                        title="Clique para abrir detalhes completos"
                      >
                        {/* Cliente */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 dark:text-white block group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                            {rental.customer?.name || 'Cliente'}
                          </span>
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
                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50"
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

                        {/* Tema */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {rental.theme?.name || 'Tema Desvinculado'}
                          </span>
                          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 block mt-0.5">
                            {rental.theme_variant?.name || 'Padrão'}
                          </span>
                        </td>

                        {/* Datas */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>Evento: {formatDateBR(rental.event_date)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Retirada: {formatDateBR(rental.pickup_date || rental.event_date)}</span>
                          </div>
                        </td>

                        {/* Financeiro */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 dark:text-white block">
                            R$ {(rental.total || 0).toFixed(2).replace('.', ',')}
                          </span>
                          {rental.status === 'historico' ? (
                            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
                              Histórico / Passado
                            </span>
                          ) : (rental.balance || 0) === 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Quitado
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                              Falta: R$ {(rental.balance || 0).toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${badge.classes}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Ação */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-rose-600 transition-colors">
                            <span>Ver Detalhes</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. Cards para Versão Mobile (md:hidden) */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {filteredMonthRentals.map((rental) => {
                const badge = getRentalStatusBadge(rental.status);
                const rawPhone = rental.customer?.phone?.replace(/\D/g, '') || '';
                const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

                return (
                  <div
                    key={rental.id}
                    onClick={() => setSelectedRental(rental)}
                    className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    title="Clique para abrir detalhes completos da locação e cliente"
                  >
                    <div>
                      {/* Cabeçalho do Card: Tema, Variação e Status Operacional */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors block truncate">
                            {rental.theme?.name || 'Tema Desvinculado'}
                          </span>
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mt-0.5">
                            {rental.theme_variant?.name || 'Padrão'}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Cliente e Botão do WhatsApp ao lado */}
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-1.5">
                          <span className="text-slate-400 dark:text-slate-500 font-medium text-xs shrink-0">
                            Cliente:
                          </span>
                          <strong className="text-slate-800 dark:text-slate-100 text-xs truncate">
                            {rental.customer?.name || 'Cliente'}
                          </strong>
                        </div>

                        {rental.customer?.phone && (
                          <a
                            href={`https://wa.me/${waPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                            title={`Conversar com ${rental.customer.name} no WhatsApp`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>

                      {/* Valor da Locação e Quanto Falta Pagar */}
                      <div className="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-750 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block">
                            Valor da Locação
                          </span>
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            R$ {(rental.total || 0).toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block">
                            Quanto falta pagar
                          </span>
                          {(rental.balance || 0) === 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Quitado
                            </span>
                          ) : (
                            <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400">
                              R$ {(rental.balance || 0).toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rodapé: Data da Retirada e Data do Evento */}
                    <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-750 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Data da Retirada */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">Retirada:</span>
                          <strong className="font-semibold text-slate-700 dark:text-slate-200">
                            {formatDateBR(rental.pickup_date || rental.event_date)}
                          </strong>
                        </div>

                        {/* Data do Evento */}
                        <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-rose-500/80 font-normal text-[10px]">Evento:</span>
                          <span>{formatDateBR(rental.event_date)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-rose-600 transition-colors shrink-0">
                        <span>Detalhes</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Caixa de diálogo com informações completas da locação e cliente */}
      {selectedRental && (
        <RentalEditDrawer
          rental={selectedRental}
          isOpen={!!selectedRental}
          onClose={() => setSelectedRental(null)}
          onSave={(updated) => {
            store.updateRental(updated.id, updated);
            setRentals(store.getRentals());
            setSelectedRental(null);
          }}
          onDelete={(id) => {
            store.deleteRental(id);
            setRentals(store.getRentals());
            setSelectedRental(null);
          }}
        />
      )}
    </div>
  );
}
