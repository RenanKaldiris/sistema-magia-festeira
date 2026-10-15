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
  AlertCircle,
  Plus,
  CreditCard,
  Sparkles,
  Edit2,
  Pencil,
  ArrowRight,
  RefreshCw,
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
}: RentalEditDrawerProps) {
  const [status, setStatus] = useState<RentalStatus>('reservado');
  const [eventDate, setEventDate] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [total, setTotal] = useState<number>(0);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Formulário de Novo Pagamento
  const [showPayForm, setShowPayForm] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(50);
  const [quickPayMethod, setQuickPayMethod] = useState<Payment['method']>('pix');
  const [quickPayDate, setQuickPayDate] = useState<string>('');
  const [quickPayStatus, setQuickPayStatus] = useState<'efetivado' | 'pendente'>('efetivado');
  const [quickPayNote, setQuickPayNote] = useState('');

  // Estado de Edição Inline de um Pagamento Específico
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMethod, setEditMethod] = useState<Payment['method']>('pix');
  const [editDate, setEditDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'efetivado' | 'pendente'>('efetivado');
  const [editNote, setEditNote] = useState<string>('');

  // Confirmação de exclusão de pagamento
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

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
      setQuickPayDate(todayStr);
      setQuickPayStatus('efetivado');
      setShowPayForm(false);
      setEditingPaymentId(null);
      setDeletingPaymentId(null);
    }
  }, [rental, todayStr]);

  // ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (editingPaymentId) {
          setEditingPaymentId(null);
        } else if (showPayForm) {
          setShowPayForm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editingPaymentId, showPayForm]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  if (!isOpen || !rental) return null;

  const rawPhone = rental.customer?.phone?.replace(/\D/g, '') || '';
  const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

  const orderNumberMatch = rental.notes?.match(/Pedido:\s*#([0-9A-Za-z]+)/i);
  const displayOrderNumber = orderNumberMatch ? `#${orderNumberMatch[1]}` : `#${rental.id.substring(0, 4).toUpperCase()}`;

  const payments = rental.payments || [];

  // Recálculo dinâmico preciso baseado nos pagamentos da locação
  const currentPaid = payments
    .filter((p) => (p.status || 'efetivado') === 'efetivado')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingPaymentsTotal = payments
    .filter((p) => p.status === 'pendente')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const currentBalance = Math.max(0, Number(total) - Number(currentPaid));

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();

    // Se o valor total foi zerado e existem pagamentos ativos registrados
    if (Number(total) === 0 && currentPaid > 0) {
      const confirmZeroPayments = window.confirm(
        `Você definiu o valor total desta locação como R$ 0,00.\n\nExistem R$ ${currentPaid.toFixed(2).replace('.', ',')} em pagamentos registrados.\n\nDeseja zerar também os pagamentos desta locação para não constarem como dinheiro recebido no caixa atual?`
      );
      if (confirmZeroPayments) {
        payments.forEach((p) => {
          store.deletePayment(p.id);
        });
      }
    }

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
      showToast('Locação e valor total atualizados com sucesso!');
      const updatedRentals = store.getRentals();
      const fresh = updatedRentals.find((r) => r.id === rental.id);
      if (fresh) onSave(fresh);
    }
  };

  // Iniciar edição de uma entrada / pagamento
  const handleStartEditPayment = (p: Payment) => {
    setEditingPaymentId(p.id);
    setEditAmount(Number(p.amount));
    setEditMethod(p.method);
    setEditStatus(p.status || 'efetivado');
    setEditNote(p.note || '');
    // Extrai data em formato YYYY-MM-DD
    const dateFormatted = p.paid_at ? p.paid_at.substring(0, 10) : todayStr;
    setEditDate(dateFormatted);
  };

  // Salvar alteração de uma entrada / pagamento
  const handleSavePaymentEdit = (e: React.FormEvent, paymentId: string) => {
    e.preventDefault();
    if (editAmount <= 0) {
      alert('O valor deve ser maior que zero.');
      return;
    }

    const isoDate = editDate ? new Date(`${editDate}T12:00:00Z`).toISOString() : new Date().toISOString();

    const res = store.updatePayment(paymentId, {
      amount: Number(editAmount),
      method: editMethod,
      note: editNote.trim() || null,
      status: editStatus,
      paid_at: isoDate,
    });

    if (res.success) {
      showToast('Lançamento atualizado e saldo recalculado!');
      setEditingPaymentId(null);
      const updatedRentals = store.getRentals();
      const fresh = updatedRentals.find((r) => r.id === rental.id);
      if (fresh) onSave(fresh);
    } else {
      alert(res.error || 'Erro ao atualizar pagamento.');
    }
  };

  // Excluir uma entrada / pagamento
  const handleDeletePayment = (paymentId: string) => {
    const res = store.deletePayment(paymentId);
    if (res.success) {
      showToast('Entrada removida e saldo recalculado com sucesso!');
      setDeletingPaymentId(null);
      const updatedRentals = store.getRentals();
      const fresh = updatedRentals.find((r) => r.id === rental.id);
      if (fresh) onSave(fresh);
    } else {
      alert(res.error || 'Erro ao remover pagamento.');
    }
  };

  // Submeter novo pagamento
  const handleQuickPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPayAmount <= 0) return;

    const isoDate = quickPayDate ? new Date(`${quickPayDate}T12:00:00Z`).toISOString() : new Date().toISOString();

    store.recordPayment(
      rental.id,
      Number(quickPayAmount),
      quickPayMethod,
      quickPayNote.trim() || (quickPayStatus === 'pendente' ? 'Parcela pendente cadastrada' : 'Pagamento recebido'),
      quickPayStatus,
      isoDate
    );

    const updatedRentals = store.getRentals();
    const fresh = updatedRentals.find((r) => r.id === rental.id);

    if (fresh) {
      onSave(fresh);
      showToast(
        quickPayStatus === 'efetivado'
          ? `Pagamento de R$ ${Number(quickPayAmount).toFixed(2).replace('.', ',')} efetivado com sucesso!`
          : `Entrada de R$ ${Number(quickPayAmount).toFixed(2).replace('.', ',')} registrada como pendente.`
      );
      setShowPayForm(false);
      setQuickPayNote('');
    }
  };

  // Ação rápida: Dar baixa no saldo restante
  const handleQuickPayFullBalance = () => {
    setQuickPayAmount(currentBalance);
    setQuickPayNote('Quitação do saldo restante');
    setQuickPayStatus('efetivado');
    setQuickPayDate(todayStr);
    setShowPayForm(true);
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
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl h-full h-[100dvh] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80 backdrop-blur-sm shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold block">
              Pedido {displayOrderNumber}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              Detalhes & Gestão Financeira da Locação
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                status === 'historico' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' :
                status === 'reservado' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' :
                status === 'alugado' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' :
                status === 'devolvido' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              }`}>
                {status === 'historico' ? 'Histórico / Passado' : status}
              </span>
            </div>

            {rental.customer?.phone && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
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
                {rental.theme?.name || 'Tema Desvinculado'}
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-mono font-bold">
                {rental.theme?.code || 'S/N'}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Variação: <strong>{rental.theme_variant?.name || 'Padrão'}</strong>{' '}
              {rental.kit ? `• Kit: ${rental.kit.name}` : ''}
            </div>
          </div>

          {/* Form de Edição de Status, Valor Total e Datas */}
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
                  <option value="historico">Histórico / Passado (Sem impacto no caixa atual)</option>
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Alterações Gerais</span>
              </button>
            </div>
          </form>

          {/* ================================================================= */}
          {/* MÓDULO FINANCEIRO: HISTÓRICO DE ENTRADAS, PENDÊNCIAS E EDIÇÃO LIVRE */}
          {/* ================================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Situação Financeira & Entradas</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowPayForm(!showPayForm);
                  setQuickPayAmount(currentBalance > 0 ? currentBalance : 50);
                  setQuickPayDate(todayStr);
                  setQuickPayStatus('efetivado');
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Pagamento</span>
              </button>
            </div>

            {/* Quadro de Indicadores */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Geral</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  R$ {Number(total).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">
                  Pago (Efetivado)
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  R$ {Number(currentPaid).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 border ${
                currentBalance > 0 ? 'border-amber-300 dark:border-amber-700/60' : 'border-slate-200 dark:border-slate-700'
              }`}>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 block uppercase font-bold">
                  Saldo Devedor
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400">
                  R$ {currentBalance.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Linha de Pendência Ativa (se houver saldo a receber) */}
            {currentBalance > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                      Saldo Restante a Receber: R$ {currentBalance.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block">
                      {pendingPaymentsTotal > 0
                        ? `(R$ ${pendingPaymentsTotal.toFixed(2).replace('.', ',')} aguardando efetivação em pendências)`
                        : 'Aguardando quitação ou parcelamento final'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickPayFullBalance}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Dar Baixa</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Formulário de Novo Pagamento (Embutido) */}
            {showPayForm && (
              <form onSubmit={handleQuickPaymentSubmit} className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lançar Nova Entrada / Pagamento</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPayForm(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={quickPayAmount}
                      onChange={(e) => setQuickPayAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Forma
                    </label>
                    <select
                      value={quickPayMethod}
                      onChange={(e) => setQuickPayMethod(e.target.value as Payment['method'])}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="pix">PIX</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartão</option>
                      <option value="transferencia">Transferência</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Data
                    </label>
                    <input
                      type="date"
                      value={quickPayDate}
                      onChange={(e) => setQuickPayDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Status
                    </label>
                    <select
                      value={quickPayStatus}
                      onChange={(e) => setQuickPayStatus(e.target.value as 'efetivado' | 'pendente')}
                      className="w-full px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="efetivado">Efetivado (Pago)</option>
                      <option value="pendente">Pendente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={quickPayNote}
                    onChange={(e) => setQuickPayNote(e.target.value)}
                    placeholder="Descrição / Nota (ex: Sinal PIX, 2ª Parcela, Quitação)"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPayForm(false)}
                    className="px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    Confirmar Entrada
                  </button>
                </div>
              </form>
            )}

            {/* Lista Interativa de Entradas / Histórico */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Histórico de Entradas ({payments.length})
                </span>
                <span className="text-[10px] text-slate-400">
                  Clique no ícone de lápis para editar valores, datas ou status
                </span>
              </div>

              {payments.length === 0 ? (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 text-center text-xs text-slate-400 italic border border-slate-200 dark:border-slate-700/60">
                  Nenhum pagamento registrado ainda nesta locação.
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => {
                    const isEditing = editingPaymentId === p.id;
                    const isDeleting = deletingPaymentId === p.id;
                    const isEffective = (p.status || 'efetivado') === 'efetivado';

                    if (isEditing) {
                      return (
                        <form
                          key={p.id}
                          onSubmit={(e) => handleSavePaymentEdit(e, p.id)}
                          className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar Lançamento</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingPaymentId(null)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                                Valor (R$)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={editAmount}
                                onChange={(e) => setEditAmount(Number(e.target.value))}
                                className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                                Forma
                              </label>
                              <select
                                value={editMethod}
                                onChange={(e) => setEditMethod(e.target.value as Payment['method'])}
                                className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                              >
                                <option value="pix">PIX</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="cartao">Cartão</option>
                                <option value="transferencia">Transferência</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                                Data
                              </label>
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                                Status
                              </label>
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as 'efetivado' | 'pendente')}
                                className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                              >
                                <option value="efetivado">Efetivado (Pago)</option>
                                <option value="pendente">Voltar para Pendente</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="Observação (ex: Sinal corrigido, 2ª parcela)"
                              className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingPaymentId(null)}
                              className="px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                            >
                              Salvar Alteração
                            </button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl bg-white dark:bg-slate-800 border transition-all ${
                          isEffective
                            ? 'border-slate-200 dark:border-slate-700/70 hover:border-emerald-300 dark:hover:border-emerald-700/60'
                            : 'border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  isEffective
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                                }`}
                              >
                                {isEffective ? (
                                  <>
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Efetivado</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>Pendente</span>
                                  </>
                                )}
                              </span>

                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {p.method.toUpperCase()}
                              </span>

                              <span className="text-[10px] text-slate-400 font-mono">
                                {p.paid_at ? formatDateBR(p.paid_at) : ''}
                              </span>
                            </div>

                            <div className="mt-1 flex items-baseline gap-2">
                              <span
                                className={`text-sm sm:text-base font-extrabold ${
                                  isEffective
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {isEffective ? '+ ' : '(Pendente) '}R${' '}
                                {Number(p.amount).toFixed(2).replace('.', ',')}
                              </span>
                            </div>

                            {p.note && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {p.note}
                              </p>
                            )}
                          </div>

                          {/* Ações da Linha: Editar & Excluir */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isDeleting ? (
                              <div className="flex items-center gap-1 animate-in fade-in duration-100">
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                                  Excluir?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(p.id)}
                                  className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Sim
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingPaymentId(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditPayment(p)}
                                  title="Editar este lançamento (valor, data, status ou forma)"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingPaymentId(p.id)}
                                  title="Excluir este lançamento"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer com Ação de Excluir */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(rental.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
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
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
}
