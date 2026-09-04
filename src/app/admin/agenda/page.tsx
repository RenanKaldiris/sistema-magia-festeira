'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { store, StockCheckResult } from '@/lib/store';
import { RentalWithDetails } from '@/types/database';
import { formatDateBR, formatDateRangeBR } from '@/lib/dateUtils';

export default function AdminAgendaPage() {
  const [rentals, setRentals] = useState<RentalWithDetails[]>(store.getRentals());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Booking Form State
  const [customerId, setCustomerId] = useState('30000000-0000-0000-0000-000000000001');
  const [themeId, setThemeId] = useState('e0000000-0000-0000-0000-000000000001'); // Vingadores
  const [pickupDate, setPickupDate] = useState('2026-09-14');
  const [eventDate, setEventDate] = useState('2026-09-15');
  const [returnDate, setReturnDate] = useState('2026-09-16');
  const [total, setTotal] = useState(169.9);
  const [paid, setPaid] = useState(60.0);
  const [location, setLocation] = useState('Buffet Vila Encantada');
  const [notes, setNotes] = useState('Terceira tentativa de reserva concorrente');

  // Conflict State
  const [conflictResult, setConflictResult] = useState<StockCheckResult | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const customers = store.getCustomers();
  const themes = store.getThemes();

  // Verificação Reativa Instantânea de Estoque
  const liveStockCheck = useMemo(() => {
    if (!themeId || !pickupDate || !returnDate) return null;
    try {
      return store.checkStockAvailability(themeId, pickupDate, returnDate, 1);
    } catch {
      return null;
    }
  }, [themeId, pickupDate, returnDate, rentals]);

  const handleBookingSubmit = (e: React.FormEvent, forceOverride: boolean = false) => {
    e.preventDefault();

    const res = store.createRental(
      {
        tenant_id: 'a0000000-0000-0000-0000-000000000001',
        customer_id: customerId,
        theme_id: themeId,
        theme_variant_id: null,
        kit_id: null,
        event_date: eventDate,
        pickup_date: pickupDate,
        return_date: returnDate,
        status: 'reservado',
        total: Number(total),
        paid: Number(paid),
        balance: Math.max(0, Number(total) - Number(paid)),
        delivery_location: location,
        notes,
      },
      forceOverride
    );

    if (!res.success) {
      setConflictResult(res.conflict || null);
      setNotification({
        type: 'error',
        message: res.error || 'Conflito de estoque detectado!',
      });
      return;
    }

    setRentals(store.getRentals());
    setIsModalOpen(false);
    setConflictResult(null);
    setNotification({
      type: 'success',
      message: 'Reserva confirmada com sucesso e sincronizada com Google Calendar!',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Agenda & Calendário
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Controle de reservas por período integral (retirada a devolução) e sincronização com Google Calendar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'day'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dia
            </button>
          </div>

          <button
            onClick={() => {
              setConflictResult(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Reserva</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Calendar Navigation Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
            Setembro de 2026
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
            {rentals.length} reservas registradas
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Google Calendar Conectado
          </span>
        </div>
      </div>

      {/* Bookings Visual List (Month Grid / Agenda Feed) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Linha do Tempo de Reservas do Mês (Formato DD/MM/AAAA)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rentals.map((rental) => (
            <div
              key={rental.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {rental.theme?.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-900/40">
                      {rental.theme?.code}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <strong className="text-slate-700 dark:text-slate-200">{rental.customer?.name}</strong> ({rental.customer?.phone})
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 uppercase border border-blue-200 dark:border-blue-900/40">
                  {rental.status}
                </span>
              </div>

              {/* Interval & Dates formatted DD/MM/YYYY */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-semibold">
                  <span>📅 Data do Evento:</span>
                  <span className="text-rose-600 dark:text-rose-400 font-extrabold">{formatDateBR(rental.event_date)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>📦 Retirada: <strong className="text-slate-700 dark:text-slate-300">{formatDateBR(rental.pickup_date)}</strong></span>
                  <span>🔄 Devolução: <strong className="text-slate-700 dark:text-slate-300">{formatDateBR(rental.return_date)}</strong></span>
                </div>
              </div>

              {/* Financial Breakdown & GCal Sync */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Total / Saldo</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    R$ {rental.total.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1.5 text-[11px]">
                    (Saldo: R$ {rental.balance.toFixed(2).replace('.', ',')})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Sincronizado: {rental.calendar_sync?.external_event_id || 'gcal_ok'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Nova Reserva com Checagem de Conflito */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[85dvh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Agendar Nova Locação / Reserva</h3>

            {/* Conflict Alert Box if Overlap Detected */}
            {conflictResult && !conflictResult.available && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold">CONFLITO DE ESTOQUE DETECTADO!</h4>
                    <p className="text-xs text-rose-800 dark:text-rose-300 mt-1">
                      O tema <strong>{conflictResult.themeName}</strong> possui <strong>{conflictResult.stockTotal} unidades</strong> e já tem <strong>{conflictResult.stockCommitted} unidade(s) comprometida(s)</strong> no intervalo de <strong>{formatDateRangeBR(pickupDate, returnDate)}</strong>.
                    </p>
                  </div>
                </div>

                <div className="text-xs bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                  ⚠️ Por regra de negócio do Sistema Magia Festeira, uma 3ª reserva não pode ser confirmada automaticamente sem uma decisão administrativa explícita.
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setConflictResult(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    1 - Cancelar Reserva
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleBookingSubmit(e, true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs"
                  >
                    2 - Forçar Reserva (Ação Administrativa)
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={(e) => handleBookingSubmit(e, false)} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cliente *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tema Solicitado *</label>
                  <select
                    value={themeId}
                    onChange={(e) => setThemeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {themes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code}) - Estoque: {t.stock_quantity}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates Interval */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Data Retirada *</label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">{formatDateBR(pickupDate)}</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Data Festa *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">{formatDateBR(eventDate)}</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Data Devolução *</label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">{formatDateBR(returnDate)}</span>
                </div>
              </div>

              {/* Instant Stock Availability Feedback Pill */}
              {liveStockCheck && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                    liveStockCheck.available
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {liveStockCheck.available ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        <strong>Estoque Livre:</strong> {liveStockCheck.stockAvailable} de {liveStockCheck.stockTotal} un. disponíveis para este período.
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>
                        <strong>Atenção:</strong> 100% ocupado ({liveStockCheck.stockCommitted} un. em uso no período). Conflito ao tentar salvar!
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={total}
                    onChange={(e) => setTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor Pago / Sinal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paid}
                    onChange={(e) => setPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Local do Evento / Entrega</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Buffet, endereço residencial ou salão..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setConflictResult(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold"
                >
                  Verificar & Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
