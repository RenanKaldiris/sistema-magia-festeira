'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  PieChart,
} from 'lucide-react';
import { RentalWithDetails } from '@/types/database';
import { formatDateBR } from '@/lib/dateUtils';

interface RentalChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentals: RentalWithDetails[];
}

type PeriodFilter = 'all' | 'current_month' | 'last_30' | 'next_30' | 'custom';

export function RentalChartsModal({ isOpen, onClose, rentals }: RentalChartsModalProps) {
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtragem dos dados conforme o período escolhido
  const filteredRentals = useMemo(() => {
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];

    if (period === 'all') {
      return rentals;
    }

    if (period === 'current_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startOfMonth = `${year}-${month}-01`;
      return rentals.filter((r) => r.event_date >= startOfMonth);
    }

    if (period === 'last_30') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      const pastISO = past.toISOString().split('T')[0];
      return rentals.filter((r) => r.event_date >= pastISO && r.event_date <= todayISO);
    }

    if (period === 'next_30') {
      const future = new Date();
      future.setDate(future.getDate() + 30);
      const futureISO = future.toISOString().split('T')[0];
      return rentals.filter((r) => r.event_date >= todayISO && r.event_date <= futureISO);
    }

    if (period === 'custom') {
      return rentals.filter((r) => {
        if (customStart && r.event_date < customStart) return false;
        if (customEnd && r.event_date > customEnd) return false;
        return true;
      });
    }

    return rentals;
  }, [rentals, period, customStart, customEnd]);

  // Cálculos Analíticos
  const totalCount = filteredRentals.length;
  const totalRevenue = filteredRentals.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalPaid = filteredRentals.reduce((sum, r) => sum + (r.paid || 0), 0);
  const totalBalance = filteredRentals.reduce((sum, r) => sum + (r.balance || 0), 0);
  const averageTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

  // Status Counts
  const rentedCount = filteredRentals.filter((r) => r.status === 'alugado').length;
  const reservedCount = filteredRentals.filter((r) => r.status === 'reservado').length;
  const returnedCount = filteredRentals.filter((r) => r.status === 'devolvido').length;
  const cancelledCount = filteredRentals.filter((r) => r.status === 'cancelado').length;

  // Ranking: Temas que mais saíram
  const topThemes = useMemo(() => {
    const themeMap: { [themeName: string]: { name: string; code: string; count: number; revenue: number } } = {};

    filteredRentals.forEach((r) => {
      const name = r.theme?.name || 'Sem Tema';
      const code = r.theme?.code || '';
      if (!themeMap[name]) {
        themeMap[name] = { name, code, count: 0, revenue: 0 };
      }
      themeMap[name].count += 1;
      themeMap[name].revenue += r.total || 0;
    });

    return Object.values(themeMap).sort((a, b) => b.count - a.count || b.revenue - a.revenue);
  }, [filteredRentals]);

  const maxThemeCount = topThemes.length > 0 ? topThemes[0].count : 1;

  // Ranking: Formato de kit mais alugado
  const topKits = useMemo(() => {
    const kitMap: { [kitName: string]: { name: string; count: number; revenue: number } } = {};

    filteredRentals.forEach((r) => {
      const kitName = r.kit?.name || 'Apenas Cenário / Sem Kit Adicional';
      if (!kitMap[kitName]) {
        kitMap[kitName] = { name: kitName, count: 0, revenue: 0 };
      }
      kitMap[kitName].count += 1;
      kitMap[kitName].revenue += r.total || 0;
    });

    return Object.values(kitMap).sort((a, b) => b.count - a.count);
  }, [filteredRentals]);

  const maxKitCount = topKits.length > 0 ? topKits[0].count : 1;

  // Formas de Pagamento
  const paymentMethods = useMemo(() => {
    const methodMap: { [method: string]: { name: string; count: number; total: number } } = {
      pix: { name: 'PIX', count: 0, total: 0 },
      cartao: { name: 'Cartão de Crédito/Débito', count: 0, total: 0 },
      dinheiro: { name: 'Dinheiro', count: 0, total: 0 },
      transferencia: { name: 'Transferência Bancária', count: 0, total: 0 },
    };

    filteredRentals.forEach((r) => {
      (r.payments || []).forEach((p) => {
        const m = p.method || 'pix';
        if (!methodMap[m]) {
          methodMap[m] = { name: m.toUpperCase(), count: 0, total: 0 };
        }
        methodMap[m].count += 1;
        methodMap[m].total += p.amount || 0;
      });
    });

    return Object.values(methodMap).filter((m) => m.count > 0);
  }, [filteredRentals]);

  // Exportar dados dos gráficos para CSV
  const handleExportCSV = () => {
    const lines = [
      'RELATORIO DE GRAFICOS E METRICAS - MAGIA FESTEIRA',
      `Periodo Selecionado:;${period}`,
      `Total de Locacoes:;${totalCount}`,
      `Faturamento Total:;R$ ${totalRevenue.toFixed(2)}`,
      `Total Pago:;R$ ${totalPaid.toFixed(2)}`,
      `Saldo Devedor:;R$ ${totalBalance.toFixed(2)}`,
      `Ticket Medio:;R$ ${averageTicket.toFixed(2)}`,
      `Temas Alugados Ativos:;${rentedCount}`,
      `Temas Reservados:;${reservedCount}`,
      `Temas Devolvidos:;${returnedCount}`,
      '',
      'TOP TEMAS MAIS ALUGADOS',
      'Tema;Codigo;Quantidade de Locacoes;Receita Total (R$)',
      ...topThemes.map((t) => `"${t.name}";"${t.code}";${t.count};${t.revenue.toFixed(2)}`),
      '',
      'FORMATO DE KITS MAIS ALUGADOS',
      'Formato / Kit;Quantidade;Receita (R$)',
      ...topKits.map((k) => `"${k.name}";${k.count};${k.revenue.toFixed(2)}`),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_metricas_magia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha analítica exportada com sucesso!');
  };

  // Imprimir / Salvar PDF
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Permita popups para imprimir o relatório.');
      return;
    }

    const todayBR = new Date().toLocaleDateString('pt-BR');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatório Operacional & Gráficos - Magia Festeira</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #0f172a; }
          h1 { color: #e11d48; margin-bottom: 4px; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
          .kpis { display: flex; gap: 15px; margin-bottom: 25px; }
          .kpi-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .kpi-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .kpi-value { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; }
          th { text-align: left; background: #f1f5f9; padding: 8px; font-size: 12px; border-bottom: 2px solid #cbd5e1; }
          td { padding: 8px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
          .section-title { font-size: 16px; font-weight: bold; border-left: 4px solid #e11d48; padding-left: 8px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Magia Festeira Decorações</h1>
          <p>Relatório de Gráficos e Métricas Operacionais • Emitido em ${todayBR}</p>
        </div>

        <div class="kpis">
          <div class="kpi-card">
            <div class="kpi-title">Ticket Médio</div>
            <div class="kpi-value">R$ ${averageTicket.toFixed(2).replace('.', ',')}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Faturamento Total</div>
            <div class="kpi-value">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Saldo Devedor</div>
            <div class="kpi-value">R$ ${totalBalance.toFixed(2).replace('.', ',')}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Temas Alugados / Reservados</div>
            <div class="kpi-value">${rentedCount} alugados / ${reservedCount} reservados</div>
          </div>
        </div>

        <div class="section-title">Temas Que Mais Saíram (Ranking)</div>
        <table>
          <thead>
            <tr>
              <th>Tema</th>
              <th>Código</th>
              <th>Locações</th>
              <th>Receita Total</th>
            </tr>
          </thead>
          <tbody>
            ${topThemes.map(t => `
              <tr>
                <td><strong>${t.name}</strong></td>
                <td>${t.code}</td>
                <td>${t.count} festa(s)</td>
                <td>R$ ${t.revenue.toFixed(2).replace('.', ',')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Formatos de Kits Mais Alugados</div>
        <table>
          <thead>
            <tr>
              <th>Formato / Kit</th>
              <th>Locações</th>
              <th>Receita Estimada</th>
            </tr>
          </thead>
          <tbody>
            ${topKits.map(k => `
              <tr>
                <td><strong>${k.name}</strong></td>
                <td>${k.count} vez(es)</td>
                <td>R$ ${k.revenue.toFixed(2).replace('.', ',')}</td>
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
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Gráficos & Métricas Operacionais</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                  {totalCount} locações
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Temas mais alugados, média de preços, kits populares e saldo a receber
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Imprimir ou Salvar PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Exportar Planilha Excel/CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {notification && (
          <div className="m-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Filtros de Período */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Período:</span>
            </span>

            {[
              { key: 'all', label: 'Todo o Período' },
              { key: 'current_month', label: 'Mês Atual' },
              { key: 'last_30', label: 'Últimos 30 Dias' },
              { key: 'next_30', label: 'Próximos 30 Dias' },
              { key: 'custom', label: 'Personalizado' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key as PeriodFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === item.key
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 text-xs w-full sm:w-auto pt-2 sm:pt-0">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <span className="text-slate-400">até</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Modal Body com Métricas & Gráficos */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Linha 1: 4 KPIs Principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Ticket Médio */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Média de Preço
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                R$ {averageTicket.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Ticket médio por festa</span>
            </div>

            {/* Faturamento do Período */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Faturamento Total
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                R$ {totalRevenue.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
                Pago: R$ {totalPaid.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Saldo Devedor a Receber */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Saldo a Receber
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
                R$ {totalBalance.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Valores pendentes</span>
            </div>

            {/* Ocupação Operacional */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Status dos Temas
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                  {rentedCount} alugados
                </span>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                  {reservedCount} reserv.
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {returnedCount} já devolvidos
              </span>
            </div>
          </div>

          {/* Gráfico 1: Qual Tema Que Mais Saiu */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                  <span>Qual Tema Que Mais Saiu (Top Temas Mais Alugados)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ranking visual por volume de locações contratadas
                </p>
              </div>
            </div>

            {topThemes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum tema locado no período selecionado.
              </div>
            ) : (
              <div className="space-y-3">
                {topThemes.map((theme, index) => {
                  const percent = Math.round((theme.count / maxThemeCount) * 100);
                  return (
                    <div key={theme.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {index + 1}º
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {theme.name}
                          </span>
                          {theme.code && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                              {theme.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-extrabold text-rose-600 dark:text-rose-400">
                            {theme.count} {theme.count > 1 ? 'locações' : 'locação'}
                          </span>
                          <span className="text-slate-400 text-[11px] hidden sm:inline">
                            (R$ {theme.revenue.toFixed(2).replace('.', ',')})
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso Dark Theme */}
                      <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percent, 6)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gráfico 2 & 3: Formato de Kit Mais Alugado & Distribuição por Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kits Mais Alugados */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-500" />
                  <span>Formato de Kit Mais Alugado</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Preferência comercial de kits</p>
              </div>

              {topKits.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">Sem dados no período.</div>
              ) : (
                <div className="space-y-3 pt-2">
                  {topKits.map((kit) => {
                    const percent = Math.round((kit.count / maxKitCount) * 100);
                    return (
                      <div key={kit.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {kit.name}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white shrink-0">
                            {kit.count} un.
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percent, 8)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Distribuição por Status */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-rose-500" />
                  <span>Distribuição por Status</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Situação das locações no período</p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Reservadas (Futuras)</span>
                  <span className="font-bold text-blue-800 dark:text-blue-200">{reservedCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <span className="font-semibold text-amber-700 dark:text-amber-300">Alugadas (Em Andamento)</span>
                  <span className="font-bold text-amber-800 dark:text-amber-200">{rentedCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">Devolvidas (Concluídas)</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-200">{returnedCount}</span>
                </div>
                {cancelledCount > 0 && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs text-slate-500">
                    <span>Canceladas</span>
                    <span className="font-bold">{cancelledCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico 4: Formas de Pagamento Mais Utilizadas */}
          {paymentMethods.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Formas de Pagamento Mais Utilizadas</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.name}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {pm.name}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm block mt-1">
                      R$ {pm.total.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {pm.count} {pm.count > 1 ? 'entradas' : 'entrada'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Exportar Dados</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-rose-400" />
              <span>Imprimir Relatório</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
