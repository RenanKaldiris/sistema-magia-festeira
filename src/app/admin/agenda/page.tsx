'use client';

import React, { useState } from 'react';
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Agenda & Calendário</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Controle de reservas por período integral (retirada a devolução) e sincronização com Google Calendar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'day' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Calendar Navigation Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-rose-600" />
          <span className="font-extrabold text-base sm:text-lg text-slate-900">Setembro de 2026</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
            {rentals.length} reservas registradas
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Google Calendar Conectado
          </span>
        </div>
      </div>

      {/* Bookings Visual List (Month Grid / Agenda Feed) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Linha do Tempo de Reservas do Mês
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rentals.map((rental) => (
            <div
              key={rental.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">{rental.theme?.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {rental.theme?.code}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{rental.customer?.name}</strong> ({rental.customer?.phone})
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 uppercase">
                  {rental.status}
                </span>
              </div>

              {/* Interval & Dates */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700 font-semibold">
                  <span>📅 Data do Evento:</span>
                  <span className="text-rose-600 font-extrabold">{rental.event_date}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>📦 Retirada: {rental.pickup_date}</span>
                  <span>🔄 Devolução: {rental.return_date}</span>
                </div>
              </div>

              {/* Financial Breakdown & GCal Sync */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Total / Saldo</span>
                  <span className="font-extrabold text-slate-900">
                    R$ {rental.total.toFixed(2)}
                  </span>
                  <span className="text-slate-500 ml-1.5 text-[11px]">
                    (Saldo: R$ {rental.balance.toFixed(2)})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Agendar Nova Locação / Reserva</h3>

            {/* Conflict Alert Box if Overlap Detected */}
            {conflictResult && !conflictResult.available && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold">CONFLITO DE ESTOQUE DETECTADO!</h4>
                    <p className="text-xs text-rose-800 mt-1">
                      O tema <strong>{conflictResult.themeName}</strong> possui <strong>{conflictResult.stockTotal} unidades</strong> e já tem <strong>{conflictResult.stockCommitted} unidade(s) comprometida(s)</strong> no intervalo de {pickupDate} a {returnDate}.
                    </p>
                  </div>
                </div>

                <div className="text-xs bg-white/80 p-2.5 rounded-xl border border-rose-200 text-rose-800">
                  ⚠️ Por regra de negócio do Sistema Magia Festeira, uma 3ª reserva não pode ser confirmada automaticamente sem uma decisão administrativa explícita.
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setConflictResult(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cliente *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tema Solicitado *</label>
                  <select
                    value={themeId}
                    onChange={(e) => setThemeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
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
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Retirada *</label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Festa *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Devolução *</label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={total}
                    onChange={(e) => setTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Pago / Sinal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paid}
                    onChange={(e) => setPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Local do Evento / Entrega</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Buffet, endereço residencial ou salão..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setConflictResult(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600"
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
