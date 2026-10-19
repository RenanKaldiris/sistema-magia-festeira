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
  const totalItems = items.reduce((acc, i) => acc + (i.quantity_total || 0), 0);
  
  // Reservas ativas no momento (reservadas ou alugadas)
  const activeRentals = useMemo(() => {
    return rentals.filter((r) => r.status === 'reservado' || r.status === 'alugado');
  }, [rentals]);

  // Saldo real a receber: somente das locações ativas que ainda possuem saldo devedor
  const balanceToReceive = useMemo(() => {
    return activeRentals.reduce((acc, r) => acc + (r.balance || 0), 0);
  }, [activeRentals]);

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
        {/* Total Themes -> Leva para página de Temas */}
        <Link
          href="/admin/temas"
          className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title="Clique para ir à página de Temas"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Total de Temas
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {totalThemes}
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block sm:inline mt-0.5 sm:mt-0 sm:ml-2">
              100% ativos
            </span>
          </div>
        </Link>

        {/* Total Items Stock -> Leva para página de Itens / Acervo */}
        <Link
          href="/admin/itens"
          className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title="Clique para ver o acervo de peças"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Peças no Acervo
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
              <Package2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {totalItems}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 block sm:inline mt-0.5 sm:mt-0 sm:ml-2 truncate">
              unidades físicas
            </span>
          </div>
        </Link>

        {/* Active Reservations -> Leva para reservas ativas */}
        <Link
          href="/admin/locacoes?period=all&operational=active"
          className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title="Clique para ver todas as Reservas Ativas"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Reservas Ativas
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {activeRentals.length}
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block sm:inline mt-0.5 sm:mt-0 sm:ml-2 truncate">
              sincronizadas GCal
            </span>
          </div>
        </Link>

        {/* Balance to Receive -> Leva para locações com saldo a receber */}
        <Link
          href="/admin/locacoes?period=all&financial=pending"
          className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title="Clique para ver todas as locações com Saldo a Receber"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Saldo a Receber
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-base sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 leading-tight truncate">
              R$ {balanceToReceive.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 block sm:inline mt-0.5 sm:mt-0 sm:ml-2">
              pendente ativo
            </span>
          </div>
        </Link>
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        (rental.balance || 0) === 0
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {(rental.balance || 0) === 0
                        ? 'Quitado'
                        : `Saldo: R$ ${(rental.balance || 0).toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Cliente:</span>
                    <strong className="text-slate-800 dark:text-slate-100 truncate">
                      {rental.customer?.name || 'Cliente'}
                    </strong>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-750 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDateBR(rental.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-rose-600 transition-colors">
                    <span>Ver Detalhes</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caixa de diálogo com informações completas da locação e cliente */}
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
    </div>
  );
}
