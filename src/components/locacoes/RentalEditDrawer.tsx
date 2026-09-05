'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Palette,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { RentalWithDetails, RentalStatus, Payment } from '@/types/database';
import { store } from '@/lib/store';
import { formatDateBR } from '@/lib/dateUtils';

interface RentalEditDrawerProps {
  rental: RentalWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: RentalWithDetails) => void;
  onDelete?: (rentalId: string) => void;
  onOpenPaymentModal?: (rental: RentalWithDetails) => void;
}

export function RentalEditDrawer({
  rental,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onOpenPaymentModal,
}: RentalEditDrawerProps) {
  const [status, setStatus] = useState<RentalStatus>('reservado');
  const [eventDate, setEventDate] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [total, setTotal] = useState<number>(0);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Pagamento rápido dentro do drawer
  const [showPayForm, setShowPayForm] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(50);
  const [quickPayMethod, setQuickPayMethod] = useState<Payment['method']>('pix');
  const [quickPayNote, setQuickPayNote] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (rental) {
      setStatus(rental.status);
      setEventDate(rental.event_date);
      setPickupDate(rental.pickup_date);
      setReturnDate(rental.return_date);
      setTotal(rental.total);
      setDeliveryLocation(rental.delivery_location || '');
      setNotes(rental.notes || '');
      setQuickPayAmount(rental.balance > 0 ? rental.balance : 50);
      setShowPayForm(false);
    }
  }, [rental]);

  // ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  if (!isOpen || !rental) return null;

  const rawPhone = rental.customer?.phone?.replace(/\D/g, '') || '';
  const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

  const payments = rental.payments || [];
  const currentPaid = rental.paid;
  const currentBalance = Math.max(0, Number(total) - Number(currentPaid));

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.updateRental(rental.id, {
      status,
      event_date: eventDate,
      pickup_date: pickupDate,
      return_date: returnDate,
      total: Number(total),
      delivery_location: deliveryLocation.trim() || null,
      notes: notes.trim() || null,
    });

    if (res.success && res.rental) {
      showToast('Locação atualizada com sucesso!');
      onSave({
        ...rental,
        ...res.rental,
      });
    }
  };

  const handleQuickPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPayAmount <= 0) return;

    store.recordPayment(rental.id, Number(quickPayAmount), quickPayMethod, quickPayNote);
    const updatedRentals = store.getRentals();
    const updated = updatedRentals.find((r) => r.id === rental.id);

    if (updated) {
      onSave(updated);
      showToast(`Pagamento de R$ ${Number(quickPayAmount).toFixed(2).replace('.', ',')} registrado!`);
      setShowPayForm(false);
      setQuickPayNote('');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold block">
              Contrato #{rental.id.substring(0, 8)}
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Detalhes & Edição da Locação
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className="m-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card do Cliente & WhatsApp */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Cliente Contratante
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {rental.customer?.name}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {status}
              </span>
            </div>

            {rental.customer?.phone && (
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${rental.customer.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{rental.customer.phone}</span>
                </a>
                <a
                  href={`https://wa.me/${waPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Conversar WhatsApp</span>
                </a>
              </div>
            )}
          </div>

          {/* Tema & Detalhes do Acervo */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Tema Escolhido
            </span>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {rental.theme?.name}
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-mono font-bold">
                {rental.theme?.code}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Variação: <strong>{rental.theme_variant?.name || 'Padrão'}</strong>{' '}
              {rental.kit ? `• Kit: ${rental.kit.name}` : ''}
            </div>
          </div>

          {/* Form de Edição de Status e Datas */}
          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Operacional
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RentalStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="reservado">Reservado</option>
                  <option value="alugado">Alugado (Em Andamento)</option>
                  <option value="devolvido">Devolvido (Concluído)</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Valor Total do Contrato (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={total}
                  onChange={(e) => setTotal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">
                  Data do Evento
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Data de Retirada
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Data de Devolução
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Local da Festa / Entrega
              </label>
              <input
                type="text"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder="Ex: Buffet Estrela Mágica, Rua Augusta 500"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Anotações e Observações
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações operacionais..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>

          {/* Resumo Financeiro & Histórico de Pagamentos */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Situação Financeira</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPayForm(!showPayForm)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Pagamento</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  R$ {Number(total).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">Pago</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  R$ {Number(currentPaid).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 block uppercase font-bold">Saldo Devedor</span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400">
                  R$ {currentBalance.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Formulário Embutido de Novo Pagamento */}
            {showPayForm && (
              <form onSubmit={handleQuickPaymentSubmit} className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-3 mt-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                  Registrar Entrada / Parcela
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={quickPayAmount}
                      onChange={(e) => setQuickPayAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Forma
                    </label>
                    <select
                      value={quickPayMethod}
                      onChange={(e) => setQuickPayMethod(e.target.value as Payment['method'])}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="pix">PIX</option>
                      <option value="cartao">Cartão</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="transferencia">Transferência</option>
                    </select>
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    value={quickPayNote}
                    onChange={(e) => setQuickPayNote(e.target.value)}
                    placeholder="Nota (ex: Sinal PIX, Pagamento final)"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPayForm(false)}
                    className="px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                  >
                    Confirmar Recebimento
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Pagamentos Registrados */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
                Histórico de Entradas ({payments.length})
              </span>
              {payments.length === 0 ? (
                <span className="text-xs text-slate-400 block italic">Nenhum pagamento registrado ainda.</span>
              ) : (
                <div className="space-y-1.5">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                          + R$ {p.amount.toFixed(2).replace('.', ',')} ({p.method.toUpperCase()})
                        </span>
                        {p.note && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">{p.note}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.paid_at ? formatDateBR(p.paid_at) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer com Ação de Excluir */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(rental.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Locação</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
}
