'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  DollarSign,
  Package,
} from 'lucide-react';
import { store } from '@/lib/store';

export default function AdminRelatoriosPage() {
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setDownloadNotification(msg);
    setTimeout(() => setDownloadNotification(null), 3500);
  };

  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`Arquivo "${filename}" exportado com sucesso!`);
  };

  const exportThemes = () => {
    const themes = store.getThemes();
    const headers = ['Código', 'Nome', 'Preço Base', 'Estoque Total', 'Personagens', 'Status'];
    const rows = themes.map((t) => [
      t.code,
      `"${t.name}"`,
      t.base_price,
      t.stock_quantity,
      `"${t.characters.join(', ')}"`,
      t.status,
    ]);
    downloadCSV('relatorio_temas_magia_festeira.csv', headers, rows);
  };

  const exportItems = () => {
    const items = store.getItems();
    const headers = ['Código', 'Nome', 'Categoria', 'Estoque Total', 'Disponível', 'Preço Unitário'];
    const rows = items.map((i) => [
      i.code,
      `"${i.name}"`,
      i.category || '',
      i.quantity_total,
      i.quantity_available,
      i.unit_price,
    ]);
    downloadCSV('relatorio_itens_estoque.csv', headers, rows);
  };

  const exportRentals = () => {
    const rentals = store.getRentals();
    const headers = ['ID', 'Cliente', 'Tema', 'Data Evento', 'Retirada', 'Devolução', 'Total', 'Pago', 'Saldo', 'Status'];
    const rows = rentals.map((r) => [
      r.id.substring(0, 8),
      `"${r.customer?.name || ''}"`,
      `"${r.theme?.name || ''}"`,
      r.event_date,
      r.pickup_date,
      r.return_date,
      r.total,
      r.paid,
      r.balance,
      r.status,
    ]);
    downloadCSV('relatorio_locacoes.csv', headers, rows);
  };

  const exportPayments = () => {
    const rentals = store.getRentals();
    const headers = ['ID Reserva', 'Cliente', 'Valor', 'Status'];
    const rows = rentals.map((r) => [
      r.id.substring(0, 8),
      `"${r.customer?.name || ''}"`,
      r.paid,
      r.balance === 0 ? 'Quitado' : 'Pendente',
    ]);
    downloadCSV('relatorio_pagamentos.csv', headers, rows);
  };

  const exportConflicts = () => {
    const headers = ['Tema', 'Período', 'Estoque Total', 'Ocupadas', 'Status'];
    const rows = [
      ['"Vingadores (MF-0127)"', '14/09/2026 a 16/09/2026', 2, 2, 'Bloqueado (100% ocupado)'],
    ];
    downloadCSV('relatorio_conflitos_estoque.csv', headers, rows);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Relatórios & Exportações da Operação
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Gere arquivos CSV consolidados para contabilidade, inventário de peças e análise de reservas por período.
        </p>
      </div>

      {downloadNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{downloadNotification}</span>
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Temas */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Relatório de Temas</h3>
            <p className="text-xs text-slate-500 mt-1">
              Catálogo completo com códigos, preços base, personagens e estoque atribuído.
            </p>
          </div>
          <button
            onClick={exportThemes}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Temas)</span>
          </button>
        </div>

        {/* Itens e Estoque */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Inventário de Peças</h3>
            <p className="text-xs text-slate-500 mt-1">
              Peças avulsas, mobília, painéis, saldo disponível e valor unitário de reposição.
            </p>
          </div>
          <button
            onClick={exportItems}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Estoque)</span>
          </button>
        </div>

        {/* Locações */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Histórico de Locações</h3>
            <p className="text-xs text-slate-500 mt-1">
              Datas de retirada e devolução, clientes, valores totais e status da locação.
            </p>
          </div>
          <button
            onClick={exportRentals}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Locações)</span>
          </button>
        </div>

        {/* Pagamentos */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Pagamentos & Saldos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Valores quitados, adiantamentos e saldo pendente a receber dos contratos.
            </p>
          </div>
          <button
            onClick={exportPayments}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Pagamentos)</span>
          </button>
        </div>

        {/* Conflitos */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Relatório de Conflitos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Registro de tentativas sobrepostas e ocupação limite de estoque por data.
            </p>
          </div>
          <button
            onClick={exportConflicts}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Conflitos)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
