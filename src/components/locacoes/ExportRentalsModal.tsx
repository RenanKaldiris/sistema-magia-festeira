'use client';

import React from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Copy,
  Printer,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { RentalWithDetails } from '@/types/database';
import { formatDateBR } from '@/lib/dateUtils';

interface ExportRentalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentals: RentalWithDetails[];
  onNotify: (msg: string) => void;
}

export function ExportRentalsModal({
  isOpen,
  onClose,
  rentals,
  onNotify,
}: ExportRentalsModalProps) {
  if (!isOpen) return null;

  // 1. Exportar para Excel (.csv com UTF-8 BOM)
  const handleExportExcel = () => {
    const headers = [
      'Código Contrato',
      'Cliente',
      'Telefone',
      'Tema',
      'Código Tema',
      'Variação',
      'Kit',
      'Data Festa',
      'Data Retirada',
      'Data Devolução',
      'Status',
      'Valor Total (R$)',
      'Valor Pago (R$)',
      'Saldo Devedor (R$)',
      'Local de Entrega',
      'Observações',
    ];

    const rows = rentals.map((r) => {
      return [
        `"#${r.id.substring(0, 8)}"`,
        `"${(r.customer?.name || '').replace(/"/g, '""')}"`,
        `"${r.customer?.phone || ''}"`,
        `"${(r.theme?.name || '').replace(/"/g, '""')}"`,
        `"${r.theme?.code || ''}"`,
        `"${r.theme_variant?.name || 'Padrão'}"`,
        `"${r.kit?.name || 'Cenário'}"`,
        `"${formatDateBR(r.event_date)}"`,
        `"${formatDateBR(r.pickup_date)}"`,
        `"${formatDateBR(r.return_date)}"`,
        `"${r.status}"`,
        r.total.toFixed(2),
        r.paid.toFixed(2),
        r.balance.toFixed(2),
        `"${(r.delivery_location || '').replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `locacoes_magia_festeira_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify(`Planilha com ${rentals.length} locações exportada com sucesso!`);
    onClose();
  };

  // 2. Exportar para PDF / Imprimir Relatório
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onNotify('Permita a abertura de popups para visualizar e salvar o PDF.');
      return;
    }

    const todayBR = new Date().toLocaleDateString('pt-BR');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatório de Locações - Magia Festeira</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 25px; color: #0f172a; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
          h1 { color: #e11d48; margin: 0 0 4px 0; font-size: 22px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th { text-align: left; background: #f8fafc; padding: 8px; border-bottom: 2px solid #cbd5e1; font-weight: bold; }
          td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; }
          .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 9px; }
          .reservado { background: #dbeafe; color: #1e40af; }
          .alugado { background: #fef3c7; color: #92400e; }
          .devolvido { background: #d1fae5; color: #065f46; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Magia Festeira Decorações</h1>
          <p>Relatório Completo de Locações e Contratos • Gerado em ${todayBR} • Total: ${rentals.length} registro(s)</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Cliente / Contato</th>
              <th>Tema / Kit</th>
              <th>Data Festa</th>
              <th>Retirada / Devolução</th>
              <th>Total</th>
              <th>Saldo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rentals.map((r) => `
              <tr>
                <td><strong>${r.customer?.name || 'Cliente'}</strong><br/>${r.customer?.phone || ''}</td>
                <td><strong>${r.theme?.name || 'Tema'}</strong> (${r.theme?.code || ''})<br/>${r.kit?.name || 'Cenário'}</td>
                <td>${formatDateBR(r.event_date)}</td>
                <td>${formatDateBR(r.pickup_date)} até ${formatDateBR(r.return_date)}</td>
                <td>R$ ${r.total.toFixed(2).replace('.', ',')}</td>
                <td><strong>R$ ${r.balance.toFixed(2).replace('.', ',')}</strong></td>
                <td><span class="badge ${r.status}">${r.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);

    onNotify('Documento para impressão / PDF gerado com sucesso!');
    onClose();
  };

  // 3. Copiar resumo de locações para WhatsApp / CRM
  const handleCopyText = () => {
    const text = rentals
      .map((r) => {
        return `• ${r.customer?.name} - ${r.theme?.name} (${r.theme?.code}) | Festa: ${formatDateBR(r.event_date)} | Total: R$ ${r.total.toFixed(2)} | Saldo: R$ ${r.balance.toFixed(2)} [${r.status.toUpperCase()}]`;
      })
      .join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        onNotify(`${rentals.length} locações copiadas em texto simples para a área de transferência!`);
        onClose();
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Exportar Locações
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione o formato desejado para exportar {rentals.length} registro(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formatos de Exportação */}
        <div className="p-6 space-y-3">
          {/* Opção 1: Excel / CSV */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Planilha Excel (.CSV com BOM UTF-8)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  Planilha formatada com clientes, temas, datas e valores financeiros
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
          </button>

          {/* Opção 2: PDF / Impressão */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Relatório PDF / Impressão
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  Visualização limpa e profissional com cabeçalho oficial da loja
                </span>
              </div>
            </div>
            <Printer className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors shrink-0" />
          </button>

          {/* Opção 3: Texto para WhatsApp / CRM */}
          <button
            type="button"
            onClick={handleCopyText}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Copy className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Copiar Lista em Texto Simples
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  Lista rápida formatada para colar no WhatsApp ou CRM
                </span>
              </div>
            </div>
            <Copy className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
