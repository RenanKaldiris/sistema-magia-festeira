'use client';

import React from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Copy,
  CheckCircle2,
  Users,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Customer, RentalWithDetails } from '@/types/database';
import { formatDateBR } from '@/lib/dateUtils';

interface ExportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  rentals: RentalWithDetails[];
  onNotify: (msg: string) => void;
}

export function ExportCustomersModal({
  isOpen,
  onClose,
  customers,
  rentals,
  onNotify,
}: ExportCustomersModalProps) {
  if (!isOpen) return null;

  // 1. Exportar para Excel (.csv com UTF-8 BOM)
  const handleExportExcel = () => {
    const headers = [
      'Nome Completo',
      'Telefone / WhatsApp',
      'E-mail',
      'CPF / Documento',
      'Endereço Completo',
      'Total de Festas',
      'Últimos Temas',
      'Observações / Notas',
      'Data de Cadastro',
    ];

    const rows = customers.map((c) => {
      const customerRentals = rentals.filter((r) => r.customer_id === c.id);
      const themesStr = customerRentals.map((r) => r.theme?.name || 'Tema').join(', ');
      return [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${c.phone || ''}"`,
        `"${c.email || ''}"`,
        `"${c.document || ''}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        customerRentals.length,
        `"${themesStr.replace(/"/g, '""')}"`,
        `"${(c.notes || '').replace(/"/g, '""')}"`,
        `"${c.created_at ? formatDateBR(c.created_at) : ''}"`,
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
      `clientes_magia_festeira_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify(`Planilha com ${customers.length} clientes exportada com sucesso!`);
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
    const timeBR = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatório Geral de Clientes - Magia Festeira</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            padding: 32px;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e11d48;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .title { font-size: 22px; font-weight: 800; color: #0f172a; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .badge {
            background: #ffe4e6;
            color: #be123c;
            padding: 6px 14px;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 12px;
          }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th {
            background: #f8fafc;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 10px;
            font-weight: 700;
            color: #475569;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
          }
          tr:nth-child(even) { background: #fafafa; }
          .bold { font-weight: 700; color: #0f172a; }
          .phone { font-family: monospace; font-weight: 600; color: #be123c; }
          .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
          }
          @media print {
            body { padding: 16px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">🎈 Magia Festeira - Base Geral de Clientes</div>
            <div class="subtitle">Relatório gerado em ${todayBR} às ${timeBR} • Sistema Magia Festeira</div>
          </div>
          <div class="badge">${customers.length} Clientes Cadastrados</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nome Completo</th>
              <th>Telefone / WhatsApp</th>
              <th>E-mail</th>
              <th>CPF / Documento</th>
              <th>Endereço</th>
              <th>Festas</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            ${customers
              .map((c) => {
                const count = rentals.filter((r) => r.customer_id === c.id).length;
                return `
                  <tr>
                    <td class="bold">${c.name || '-'}</td>
                    <td class="phone">${c.phone || '-'}</td>
                    <td>${c.email || '-'}</td>
                    <td>${c.document || '-'}</td>
                    <td>${c.address || '-'}</td>
                    <td class="bold">${count} festa(s)</td>
                    <td>${c.notes || '-'}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          Documento gerado automaticamente pelo Sistema Magia Festeira • Uso interno confidencial
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();

    onNotify('Relatório PDF gerado! Salve ou imprima através da janela aberta.');
    onClose();
  };

  // 3. Copiar todos em texto simples
  const handleCopyText = () => {
    const text = customers
      .map((c) => `${c.name} - ${c.phone}${c.email ? ` (${c.email})` : ''}${c.notes ? ` [${c.notes}]` : ''}`)
      .join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        onNotify(`${customers.length} contatos copiados em formato texto!`);
        onClose();
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 space-y-5 text-white scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Exportar Base de Clientes
              </h3>
              <p className="text-xs text-slate-400">
                Selecione o formato desejado para salvar seus contatos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Counter */}
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-900/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-300 font-semibold">
            <Users className="w-4 h-4 text-rose-400" />
            <span>Total de contatos para exportação:</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-xs shadow-2xs">
            {customers.length}
          </span>
        </div>

        {/* Opções de Exportação */}
        <div className="space-y-3">
          {/* Opção 1: Excel (.csv) */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full p-4 rounded-2xl border border-slate-750 hover:border-emerald-500/80 bg-slate-800/80 hover:bg-slate-800 flex items-center justify-between gap-3 text-left transition-all group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-white block group-hover:text-emerald-400 transition-colors">
                  Planilha Excel (.CSV)
                </span>
                <span className="text-xs text-slate-400 block truncate">
                  Compatível com Microsoft Excel, Google Planilhas e LibreOffice
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0 transition-colors" />
          </button>

          {/* Opção 2: PDF / Impressão */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="w-full p-4 rounded-2xl border border-slate-750 hover:border-blue-500/80 bg-slate-800/80 hover:bg-slate-800 flex items-center justify-between gap-3 text-left transition-all group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-950/70 border border-blue-800/60 text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-white block group-hover:text-blue-400 transition-colors">
                  Relatório PDF / Impressão
                </span>
                <span className="text-xs text-slate-400 block truncate">
                  Documento visual pronto para salvar em PDF ou imprimir
                </span>
              </div>
            </div>
            <Printer className="w-4 h-4 text-slate-400 group-hover:text-blue-400 shrink-0 transition-colors" />
          </button>

          {/* Opção 3: Copiar Lista de Contatos */}
          <button
            type="button"
            onClick={handleCopyText}
            className="w-full p-4 rounded-2xl border border-slate-750 hover:border-purple-500/80 bg-slate-800/80 hover:bg-slate-800 flex items-center justify-between gap-3 text-left transition-all group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-950/70 border border-purple-800/60 text-purple-400 flex items-center justify-center shrink-0">
                <Copy className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-white block group-hover:text-purple-400 transition-colors">
                  Copiar em Formato Texto
                </span>
                <span className="text-xs text-slate-400 block truncate">
                  Linha por linha (Nome - Telefone) para disparos rápidos no WhatsApp
                </span>
              </div>
            </div>
            <Copy className="w-4 h-4 text-slate-400 group-hover:text-purple-400 shrink-0 transition-colors" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-semibold text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
