'use client';

import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  XCircle,
  Clock,
  User,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { store } from '@/lib/store';
import { RentalWithDetails, RentalStatus, Payment } from '@/types/database';
import { formatDateBR } from '@/lib/dateUtils';

export default function AdminLocacoesPage() {
  const [rentals, setRentals] = useState<RentalWithDetails[]>(store.getRentals());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRentalForPayment, setSelectedRentalForPayment] = useState<RentalWithDetails | null>(null);

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(50);
  const [payMethod, setPayMethod] = useState<Payment['method']>('pix');
  const [payNote, setPayNote] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredRentals = rentals.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      r.customer?.name.toLowerCase().includes(q) ||
      r.theme?.name.toLowerCase().includes(q) ||
      r.theme?.code.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = (rentalId: string, newStatus: RentalStatus) => {
    store.updateRental(rentalId, { status: newStatus });
    setRentals(store.getRentals());
    showNotification(`Status da reserva atualizado para "${newStatus}".`);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRentalForPayment || payAmount <= 0) return;

    store.recordPayment(selectedRentalForPayment.id, Number(payAmount), payMethod, payNote);
    setRentals(store.getRentals());
    setSelectedRentalForPayment(null);
    setPayNote('');
    showNotification(`Pagamento de R$ ${Number(payAmount).toFixed(2).replace('.', ',')} registrado com sucesso!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Locações & Contratos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Acompanhe o status operacional das reservas, pagamentos parciais, saldo devedor e devoluções.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou tema..."
            className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'reservado', 'alugado', 'devolvido', 'cancelado'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 dark:bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'all' ? 'Todos os Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Rentals View (Cards touch-friendly) */}
      <div className="md:hidden space-y-4">
        {filteredRentals.map((rental) => {
          const rawPhone = rental.customer?.phone?.replace(/\D/g, '') || '';
          const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
          return (
            <div
              key={rental.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{rental.customer?.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {rental.customer?.phone && (
                      <>
                        <a
                          href={`tel:${rental.customer.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 hover:text-rose-600 font-medium"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{rental.customer.phone}</span>
                        </a>
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <select
                  value={rental.status}
                  onChange={(e) => handleStatusChange(rental.id, e.target.value as RentalStatus)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold capitalize border focus:outline-none ${
                    rental.status === 'reservado'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300'
                      : rental.status === 'alugado'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300'
                      : rental.status === 'devolvido'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <option value="reservado">Reservado</option>
                  <option value="alugado">Alugado</option>
                  <option value="devolvido">Devolvido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Tema e Detalhes */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{rental.theme?.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-mono font-bold">
                    {rental.theme?.code}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {rental.theme_variant?.name || 'Padrão'} {rental.kit ? `• ${rental.kit.name}` : ''}
                </span>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">📅 Festa:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{formatDateBR(rental.event_date)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>📦 Retirada: {formatDateBR(rental.pickup_date)}</span>
                    <span>🔄 Devolução: {formatDateBR(rental.return_date)}</span>
                  </div>
                </div>
              </div>

              {/* Financeiro e Ação */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">Total / Saldo</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    R$ {rental.total.toFixed(2).replace('.', ',')}
                  </span>
                  <span
                    className={`ml-1.5 text-[11px] font-semibold ${
                      rental.balance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    ({rental.balance === 0 ? 'Quitado' : `Saldo: R$ ${rental.balance.toFixed(2).replace('.', ',')}`})
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedRentalForPayment(rental);
                    setPayAmount(rental.balance > 0 ? rental.balance : 50);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Pagar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Rentals Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-6">Cliente / Contato</th>
                <th className="py-3.5 px-6">Tema / Variação</th>
                <th className="py-3.5 px-6">Intervalo Completo (DD/MM/AAAA)</th>
                <th className="py-3.5 px-6">Financeiro</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredRentals.map((rental) => (
                <tr key={rental.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 dark:text-white block">{rental.customer?.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{rental.customer?.phone}</span>
                    {rental.delivery_location && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate max-w-xs">
                        📍 {rental.delivery_location}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">{rental.theme?.name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                        {rental.theme?.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {rental.theme_variant?.name || 'Padrão'} {rental.kit ? `• ${rental.kit.name}` : ''}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-xs">
                    <span className="font-semibold text-rose-600 dark:text-rose-400 block">
                      Festa: {formatDateBR(rental.event_date)}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Retirada: {formatDateBR(rental.pickup_date)} ➔ Devolução: {formatDateBR(rental.return_date)}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Total: R$ {rental.total.toFixed(2).replace('.', ',')}
                    </span>
                    <span
                      className={`text-[11px] font-semibold block mt-0.5 ${
                        rental.balance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {rental.balance === 0
                        ? 'Quitado'
                        : `Saldo devedor: R$ ${rental.balance.toFixed(2).replace('.', ',')}`}
                    </span>
                  </td>

                  <td className="py-4 px-6">
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
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <option value="reservado">Reservado</option>
                      <option value="alugado">Alugado</option>
                      <option value="devolvido">Devolvido</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => {
                        setSelectedRentalForPayment(rental);
                        setPayAmount(rental.balance > 0 ? rental.balance : 50);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors border border-emerald-200 dark:border-emerald-800/50"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Registrar Pagamento</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Pagamento */}
      {selectedRentalForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor Pago (R$) *</label>
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Forma de Pagamento *</label>
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Comprovante / Observação</label>
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
