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

  // Quantidades operacionais de temas
  const reservedRentalsCount = useMemo(() => {
    return rentals.filter((r) => r.status === 'reservado').length;
  }, [rentals]);

  const rentedRentalsCount = useMemo(() => {
    return rentals.filter((r) => r.status === 'alugado').length;
  }, [rentals]);

  const returnedRentalsCount = useMemo(() => {
    return rentals.filter((r) => r.status === 'devolvido').length;
  }, [rentals]);

  // Locações do mês vigente (para cálculos de saldo recebido e saldo a receber do mês)
  const currentMonthRentals = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return rentals.filter((r) => {
      if (!r.event_date || r.status === 'cancelado') return false;
      const evtDate = new Date(r.event_date.split('T')[0] + 'T12:00:00Z');
      return evtDate.getUTCFullYear() === currentYear && evtDate.getUTCMonth() === currentMonth;
    });
  }, [rentals]);

  // Saldo Recebido no mês vigente (seguindo o mesmo cálculo da tela de locações)
  const currentMonthReceived = useMemo(() => {
    return currentMonthRentals.reduce(
      (acc, r) => acc + (r.status === 'historico' ? (r.paid || r.total || 0) : (r.paid || 0)),
      0
    );
  }, [currentMonthRentals]);

  // Saldo a Receber no mês vigente (seguindo o mesmo cálculo da tela de locações)
  const currentMonthBalanceToReceive = useMemo(() => {
    return currentMonthRentals
      .filter((r) => r.status !== 'historico')
      .reduce((acc, r) => acc + (r.balance || 0), 0);
  }, [currentMonthRentals]);

  // Próximos Eventos: considerando a data vigente do sistema, apenas eventos futuros limitados aos próximos 15 dias
  const upcomingRentals = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Limite máximo: 15 dias à frente
    const in15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
    const in15DaysStr = `${in15Days.getFullYear()}-${String(in15Days.getMonth() + 1).padStart(2, '0')}-${String(in15Days.getDate()).padStart(2, '0')}`;

    return rentals
      .filter((r) => {
        // Não visualiza nenhuma locação cancelada, devolvida ou de histórico passado
        if (r.status === 'cancelado' || r.status === 'devolvido' || r.status === 'historico') {
          return false;
        }

        const eventDateStr = r.event_date ? r.event_date.split('T')[0] : '';
        if (!eventDateStr) return false;

        // Somente eventos futuros a partir da data de hoje até os próximos 15 dias
        return eventDateStr >= todayStr && eventDateStr <= in15DaysStr;
      })
      .sort((a, b) => {
        const aDate = a.event_date ? a.event_date.split('T')[0] : '';
        const bDate = b.event_date ? b.event_date.split('T')[0] : '';
        return aDate.localeCompare(bDate);
      });
  }, [rentals]);

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
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Indicadores de estoque, locações ativas e agenda dos próximos eventos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/locacoes"
            className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            + Nova Reserva
          </Link>
          <Link
            href="/admin/temas"
            className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Novo Tema
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

      {/* 4 Primary KPI Cards com Links Diretos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        {/* 1. Total Themes -> Leva para página de Temas */}
        <Link
          href="/admin/temas"
          className="col-span-2 sm:col-span-1 p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
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

        {/* 2. Saldo Recebido (Mês Vigente) - Compacto no Mobile */}
        <Link
          href="/admin/locacoes?period=current_month&financial=paid"
          className="col-span-1 p-2.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title="Clique para ver as locações quitadas do mês vigente"
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
              R$ {currentMonthReceived.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              mês vigente
            </span>
          </div>
        </Link>

        {/* 3. Saldo a Receber (Mês Vigente) - Compacto no Mobile */}
        <Link
          href="/admin/locacoes?period=current_month&financial=pending"
          className="col-span-1 p-2.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title="Clique para ver as locações com saldo a receber no mês vigente"
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
              R$ {currentMonthBalanceToReceive.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              mês vigente
            </span>
          </div>
        </Link>

        {/* 4. Status dos Temas: Reservados, Alugados e Devolvidos em um único card */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <Link
              href="/admin/locacoes?period=all&operational=all"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              title="Clique para ver todas as locações"
            >
              Status das Locações
            </Link>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="mt-2 sm:mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2">
            {/* Reservados */}
            <Link
              href="/admin/locacoes?period=all&operational=waiting"
              className="p-1.5 sm:p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-900/40 transition-colors flex flex-col items-center text-center cursor-pointer group"
              title="Filtrar temas reservados"
            >
              <span className="text-base sm:text-xl font-black text-blue-700 dark:text-blue-300 leading-none group-hover:scale-105 transition-transform">
                {reservedRentalsCount}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-blue-600/90 dark:text-blue-400/90 mt-1 uppercase tracking-tight truncate w-full">
                Reservados
              </span>
            </Link>

            {/* Alugados */}
            <Link
              href="/admin/locacoes?period=all&operational=in_progress"
              className="p-1.5 sm:p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-900/40 transition-colors flex flex-col items-center text-center cursor-pointer group"
              title="Filtrar temas alugados (na rua)"
            >
              <span className="text-base sm:text-xl font-black text-emerald-700 dark:text-emerald-300 leading-none group-hover:scale-105 transition-transform">
                {rentedRentalsCount}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600/90 dark:text-emerald-400/90 mt-1 uppercase tracking-tight truncate w-full">
                Alugados
              </span>
            </Link>

            {/* Devolvidos */}
            <Link
              href="/admin/locacoes?period=all&operational=returned"
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex flex-col items-center text-center cursor-pointer group"
              title="Filtrar temas devolvidos"
            >
              <span className="text-base sm:text-xl font-black text-slate-700 dark:text-slate-300 leading-none group-hover:scale-105 transition-transform">
                {returnedRentalsCount}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tight truncate w-full">
                Devolvidos
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Próximos Eventos & Locações (Apenas próximos 15 dias da data vigente) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Próximos Eventos & Locações
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                Próximos 15 dias
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Eventos futuros a partir da data de hoje. Clique na locação para abrir as informações completas.
            </p>
          </div>

          <Link
            href="/admin/locacoes"
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 shrink-0 self-start sm:self-center"
          >
            <span>Ver todas as locações</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingRentals.length === 0 ? (
          <div className="py-12 px-4 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhum evento agendado para os próximos 15 dias.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md">
              Locações com datas anteriores ou além dos próximos 15 dias não são exibidas aqui.
            </p>
            <Link
              href="/admin/locacoes"
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Ver Todas as Locações na Agenda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {upcomingRentals.map((rental) => (
              <div
                key={rental.id}
                onClick={() => setSelectedRental(rental)}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                title="Clique para abrir detalhes completos da locação e cliente"
              >
                <div>
                  {/* Cabeçalho do Card: Tema, Variação e Status Operacional */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors block truncate">
                        {rental.theme?.name || 'Tema Desvinculado'}
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mt-0.5">
                        {rental.theme_variant?.name || 'Padrão'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 capitalize ${
                        rental.status === 'alugado'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {rental.status === 'alugado' ? 'Alugado' : 'Reservado'}
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
                        href={`https://wa.me/${
                          rental.customer.phone.replace(/\D/g, '').startsWith('55')
                            ? rental.customer.phone.replace(/\D/g, '')
                            : '55' + rental.customer.phone.replace(/\D/g, '')
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-[11px] font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
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
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
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
                        <span className="font-extrabold text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                          R$ {(rental.balance || 0).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé: Data da Retirada e Data do Evento */}
                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-750 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
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
                    <span className="hidden xs:inline">Ver Detalhes</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
