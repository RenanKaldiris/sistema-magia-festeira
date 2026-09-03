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
} from 'lucide-react';
import { store } from '@/lib/store';
import { RentalWithDetails, RentalStatus, Payment } from '@/types/database';

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
    showNotification(`Pagamento de R$ ${Number(payAmount).toFixed(2)} registrado com sucesso!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Locações & Contratos</h1>
          <p className="text-xs sm:text-sm text-slate-500">
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou tema..."
            className="w-full text-xs sm:text-sm focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'reservado', 'alugado', 'devolvido', 'cancelado'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                statusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'Todos os Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Rentals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-6">Cliente / Contato</th>
                <th className="py-3.5 px-6">Tema / Variação</th>
                <th className="py-3.5 px-6">Intervalo Completo</th>
                <th className="py-3.5 px-6">Financeiro</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRentals.map((rental) => (
                <tr key={rental.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 block">{rental.customer?.name}</span>
                    <span className="text-[11px] text-slate-500 block">{rental.customer?.phone}</span>
                    {rental.delivery_location && (
                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-xs">
                        📍 {rental.delivery_location}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{rental.theme?.name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold">
                        {rental.theme?.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {rental.theme_variant?.name || 'Padrão'} {rental.kit ? `• ${rental.kit.name}` : ''}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-xs">
                    <span className="font-semibold text-rose-600 block">Festa: {rental.event_date}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Retirada: {rental.pickup_date} ➔ Devolução: {rental.return_date}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 block">
                      Total: R$ {rental.total.toFixed(2).replace('.', ',')}
                    </span>
                    <span
                      className={`text-[11px] font-semibold block mt-0.5 ${
                        rental.balance === 0 ? 'text-emerald-600' : 'text-amber-600'
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
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : rental.status === 'alugado'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : rental.status === 'devolvido'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
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
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Registrar Pagamento para {selectedRentalForPayment.customer?.name}
            </h3>
            <p className="text-xs text-slate-500">
              Tema: <strong>{selectedRentalForPayment.theme?.name}</strong> • Saldo Atual: R${' '}
              {selectedRentalForPayment.balance.toFixed(2)}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Pago (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as Payment['method'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Comprovante / Observação</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Ex: Quitação final na retirada, Sinal PIX..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRentalForPayment(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600"
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
