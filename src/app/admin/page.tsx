'use client';

import React from 'react';
import Link from 'next/link';
import {
  Palette,
  Package2,
  Calendar,
  AlertTriangle,
  DollarSign,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { store } from '@/lib/store';
import { formatDateBR, formatDateTimeBR } from '@/lib/dateUtils';

export default function AdminDashboardPage() {
  const themes = store.getThemes();
  const items = store.getItems();
  const rentals = store.getRentals();
  const imports = store.getImports();
  const auditLogs = store.getAuditLogs();

  const totalThemes = themes.length;
  const totalItems = items.reduce((acc, i) => acc + i.quantity_total, 0);
  const activeRentals = rentals.filter((r) => r.status === 'reservado' || r.status === 'alugado');
  const balanceToReceive = rentals.reduce((acc, r) => acc + r.balance, 0);
  const pendingImports = imports.filter((i) => i.status === 'review' || i.status === 'processing');

  // Identificação do conflito demonstrativo de estoque para o tema Vingadores entre 14/09 e 16/09
  const vingadoresCheck = store.checkStockAvailability(
    'e0000000-0000-0000-0000-000000000001',
    '2026-09-14',
    '2026-09-16',
    1
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Visão Geral da Operação
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Indicadores de estoque, locações, faturamento e observabilidade em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/locacoes"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            + Nova Reserva
          </Link>
          <Link
            href="/admin/temas"
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Novo Tema
          </Link>
        </div>
      </div>

      {/* Stock Conflict Alert Banner (If Any) */}
      {!vingadoresCheck.available && (
        <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Atenção: Conflito Potencial de Estoque Detectado</h4>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1">
              O tema <strong>{vingadoresCheck.themeName}</strong> possui {vingadoresCheck.stockTotal} unidades no total e está com 100% de ocupação ({vingadoresCheck.stockCommitted} locações ativas) no período de {formatDateBR('2026-09-14')} a {formatDateBR('2026-09-16')}. Qualquer tentativa adicional de reserva exigirá autorização administrativa explícita.
            </p>
          </div>
          <Link
            href="/admin/locacoes"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0"
          >
            Ver em Locações
          </Link>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Themes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total de Temas</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <Palette className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{totalThemes}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold ml-2">100% ativos</span>
          </div>
        </div>

        {/* Total Items Stock */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Peças no Acervo</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Package2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{totalItems}</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">unidades físicas</span>
          </div>
        </div>

        {/* Active Reservations */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reservas Ativas</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{activeRentals.length}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold ml-2">sincronizadas GCal</span>
          </div>
        </div>

        {/* Balance to Receive */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saldo a Receber</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              R$ {balanceToReceive.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">pendente</span>
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Events & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Próximos Eventos & Reservas (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Próximos Eventos & Locações</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Controle de datas de retirada e devolução (DD/MM/AAAA)</p>
            </div>
            <Link
              href="/admin/locacoes"
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {rentals.map((rental) => (
              <div
                key={rental.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{rental.theme?.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-200 dark:border-rose-900/40">
                      {rental.theme_variant?.name || 'Padrão'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cliente: <strong className="text-slate-700 dark:text-slate-200">{rental.customer?.name}</strong> • Evento: <span className="font-semibold text-rose-600 dark:text-rose-400">{formatDateBR(rental.event_date)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Retirada: <span className="text-slate-600 dark:text-slate-300 font-medium">{formatDateBR(rental.pickup_date)}</span> ➔ Devolução: <span className="text-slate-600 dark:text-slate-300 font-medium">{formatDateBR(rental.return_date)}</span>
                  </div>
                </div>

                <div className="text-right flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    R$ {rental.total.toFixed(2).replace('.', ',')}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      rental.balance === 0
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {rental.balance === 0 ? 'Quitado' : `Saldo: R$ ${rental.balance.toFixed(2)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atividades Recentes & IA (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Atividades & Auditoria</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Últimos registros operacionais</p>
              </div>
              <Link
                href="/admin/logs"
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1"
              >
                <span>Histórico</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {formatDateTimeBR(log.created_at)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Entidade: {log.entity} {log.entity_id ? `(#${log.entity_id.substring(0, 8)})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Imports Quick Callout */}
          <div className="mt-6 p-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-between border border-slate-800 dark:border-slate-700">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Importações Pendentes</span>
              <span className="text-lg font-extrabold text-white">
                {pendingImports.length} lote(s) em revisão
              </span>
            </div>
            <Link
              href="/admin/importacoes"
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
            >
              Revisar Assets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
