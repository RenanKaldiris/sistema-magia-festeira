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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Visão Geral da Operação
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Indicadores de estoque, locações, agenda e observabilidade em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/agenda"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            + Nova Reserva
          </Link>
          <Link
            href="/admin/temas"
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Novo Tema
          </Link>
        </div>
      </div>

      {/* Stock Conflict Alert Banner (If Any) */}
      {!vingadoresCheck.available && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-900 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Atenção: Conflito Potencial de Estoque Detectado</h4>
            <p className="text-xs text-amber-800 mt-1">
              O tema <strong>{vingadoresCheck.themeName}</strong> possui {vingadoresCheck.stockTotal} unidades no total e está com 100% de ocupação ({vingadoresCheck.stockCommitted} locações ativas) entre 14/09 e 16/09. Qualquer tentativa adicional de reserva exigirá autorização administrativa explícita.
            </p>
          </div>
          <Link
            href="/admin/agenda"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0"
          >
            Ver na Agenda
          </Link>
        </div>
      )}

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Themes */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total de Temas</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Palette className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalThemes}</span>
            <span className="text-[11px] text-emerald-600 font-semibold ml-2">100% ativos</span>
          </div>
        </div>

        {/* Total Items Stock */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Peças no Acervo</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Package2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalItems}</span>
            <span className="text-[11px] text-slate-400 ml-2">unidades físicas</span>
          </div>
        </div>

        {/* Active Reservations */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Reservas Ativas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeRentals.length}</span>
            <span className="text-[11px] text-emerald-600 font-semibold ml-2">sincronizadas GCal</span>
          </div>
        </div>

        {/* Balance to Receive */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo a Receber</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              R$ {balanceToReceive.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-slate-400 ml-2">pendente</span>
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Events & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Próximos Eventos & Reservas (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Próximos Eventos & Locações</h3>
              <p className="text-xs text-slate-400">Controle de datas de retirada e devolução</p>
            </div>
            <Link
              href="/admin/locacoes"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {rentals.map((rental) => (
              <div
                key={rental.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{rental.theme?.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-semibold">
                      {rental.theme_variant?.name || 'Padrão'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Cliente: <strong>{rental.customer?.name}</strong> • Evento: {rental.event_date}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Retirada: {rental.pickup_date} ➔ Devolução: {rental.return_date}
                  </div>
                </div>

                <div className="text-right flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="text-xs font-extrabold text-slate-900">
                    R$ {rental.total.toFixed(2).replace('.', ',')}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      rental.balance === 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
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
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Atividades & Auditoria</h3>
                <p className="text-xs text-slate-400">Últimos registros operacionais</p>
              </div>
              <Link
                href="/admin/logs"
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <span>Histórico</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Entidade: {log.entity} {log.entity_id ? `(#${log.entity_id.substring(0, 8)})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Imports Quick Callout */}
          <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
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
