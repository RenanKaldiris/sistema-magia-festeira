'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Calendar,
  DollarSign,
  User,
  Palette,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  FileText,
  CreditCard,
  Layers,
} from 'lucide-react';
import { store, StockCheckResult } from '@/lib/store';
import { Customer, ThemeWithDetails, ThemeVariant, Kit, RentalWithDetails, Payment } from '@/types/database';

interface CreateRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function CreateRentalModal({ isOpen, onClose, onSuccess }: CreateRentalModalProps) {
  const [customers, setCustomers] = useState<Customer[]>(store.getCustomers());
  const [themes, setThemes] = useState<ThemeWithDetails[]>(store.getThemes());

  // Customer Mode: 'existing' | 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');

  // New Customer Fields
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Theme & Kit Selection
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedKitId, setSelectedKitId] = useState<string>('');

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const [eventDate, setEventDate] = useState<string>(todayStr);
  const [pickupDate, setPickupDate] = useState<string>(todayStr);
  const [returnDate, setReturnDate] = useState<string>(todayStr);

  // Financial
  const [total, setTotal] = useState<number>(180);
  const [paid, setPaid] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<Payment['method']>('pix');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Stock check & Force override
  const [forceOverride, setForceOverride] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update lists whenever store updates or modal opens
  useEffect(() => {
    if (isOpen) {
      const c = store.getCustomers();
      const t = store.getThemes();
      setCustomers(c);
      setThemes(t);

      if (c.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(c[0].id);
      }
      if (t.length > 0 && !selectedThemeId) {
        setSelectedThemeId(t[0].id);
      }
    }
  }, [isOpen]);

  // Selected Theme
  const selectedTheme = useMemo(() => {
    return themes.find((t) => t.id === selectedThemeId) || null;
  }, [themes, selectedThemeId]);

  // Available variants and kits for selected theme
  const availableVariants = useMemo(() => {
    return selectedTheme?.variants || [];
  }, [selectedTheme]);

  const availableKits = useMemo(() => {
    return selectedTheme?.kits || [];
  }, [selectedTheme]);

  // Adjust total price when theme or kit changes
  useEffect(() => {
    if (selectedTheme) {
      let price = selectedTheme.base_price || 180;
      if (selectedKitId) {
        const kit = selectedTheme.kits?.find((k) => k.id === selectedKitId);
        if (kit && kit.price) price = kit.price;
      }
      setTotal(price);
    }
  }, [selectedTheme, selectedKitId]);

  // Auto-adjust pickup and return dates when eventDate changes
  const handleEventDateChange = (newDate: string) => {
    setEventDate(newDate);
    // If pickupDate is after or far from eventDate, align
    if (!pickupDate || pickupDate > newDate) {
      setPickupDate(newDate);
    }
    // Set return date 1 day after event by default
    try {
      const d = new Date(newDate + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      const nextDay = d.toISOString().split('T')[0];
      setReturnDate(nextDay);
    } catch {
      setReturnDate(newDate);
    }
  };

  // Stock check in real-time
  const stockCheck = useMemo(() => {
    if (!selectedThemeId || !pickupDate || !returnDate) return null;
    try {
      return store.checkStockAvailability(selectedThemeId, pickupDate, returnDate, 1);
    } catch {
      return null;
    }
  }, [selectedThemeId, pickupDate, returnDate]);

  // Filtered customer list for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, customerSearch]);

  const calculatedBalance = Math.max(0, Number(total) - Number(paid));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let finalCustomerId = selectedCustomerId;

    // Se estiver no modo novo cliente, cria primeiro o cliente
    if (customerMode === 'new') {
      if (!newCustName.trim() || !newCustPhone.trim()) {
        setErrorMsg('Por favor, informe o nome e o telefone do novo cliente.');
        return;
      }

      const createdCustomer = store.createCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        email: newCustEmail.trim() || null,
        address: newCustAddress.trim() || null,
        document: null,
        notes: null,
      });
      finalCustomerId = createdCustomer.id;
    }

    if (!finalCustomerId) {
      setErrorMsg('Selecione ou cadastre um cliente.');
      return;
    }

    if (!selectedThemeId) {
      setErrorMsg('Selecione um tema de decoração.');
      return;
    }

    // Criar locação no store
    const res = store.createRental(
      {
        tenant_id: 'a0000000-0000-0000-0000-000000000001',
        customer_id: finalCustomerId,
        theme_id: selectedThemeId,
        theme_variant_id: selectedVariantId || null,
        kit_id: selectedKitId || null,
        event_date: eventDate,
        pickup_date: pickupDate,
        return_date: returnDate,
        status: 'reservado',
        total: Number(total),
        paid: Number(paid),
        balance: calculatedBalance,
        delivery_location: location.trim() || null,
        notes: notes.trim() || null,
      },
      forceOverride
    );

    if (!res.success) {
      setErrorMsg(res.error || 'Não foi possível salvar a locação devido a um conflito de estoque.');
      return;
    }

    // Se houve pagamento inicial (sinal), registrar comprovante
    if (Number(paid) > 0 && res.rental) {
      store.recordPayment(
        res.rental.id,
        Number(paid),
        payMethod,
        'Sinal inicial registrado no momento da reserva'
      );
    }

    onSuccess('Nova reserva/locação cadastrada com sucesso!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Adicionar Reserva/Locação
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastro direto com checagem automática de estoque e financeiro
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. SELEÇÃO DE CLIENTE */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-500" />
                <span>Cliente Contratante</span>
              </span>
              <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    customerMode === 'existing'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Existente
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    customerMode === 'new'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  + Novo Cliente
                </button>
              </div>
            </div>

            {customerMode === 'existing' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Filtrar cliente por nome ou telefone..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                >
                  {filteredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone} {c.address ? `(${c.address})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="Ex: Mariana Silva"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Endereço de Entrega / Residência
                  </label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="Rua das Flores, 123 - Apto 4"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. SELEÇÃO DE TEMA & KITS */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-rose-500" />
              <span>Tema de Decoração & Kit</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tema Principal *
                </label>
                <select
                  value={selectedThemeId}
                  onChange={(e) => {
                    setSelectedThemeId(e.target.value);
                    setSelectedVariantId('');
                    setSelectedKitId('');
                  }}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                >
                  {themes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) — Estoque Total: {t.stock_quantity} un.
                    </option>
                  ))}
                </select>
              </div>

              {availableVariants.length > 0 && (
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Variação
                  </label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="">Padrão / Original</option>
                    {availableVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {availableKits.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Composição do Kit
                  </label>
                  <select
                    value={selectedKitId}
                    onChange={(e) => setSelectedKitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="">Apenas Cenário (R$ {themes.find(t => t.id === selectedThemeId)?.base_price?.toFixed(2) || '180,00'})</option>
                    {availableKits.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} — R$ {k.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 3. INTERVALO DE DATAS & DISPONIBILIDADE */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>Intervalo de Datas</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">
                  📅 Data da Festa *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => handleEventDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  📦 Data Retirada *
                </label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  🔄 Data Devolução *
                </label>
                <input
                  type="date"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Live Stock Availability Result Banner */}
            {stockCheck && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                  stockCheck.available
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                }`}
              >
                {stockCheck.available ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  {stockCheck.available ? (
                    <span>
                      <strong>Estoque Disponível:</strong> {stockCheck.stockAvailable} de {stockCheck.stockTotal} unidades livres para o período selecionado.
                    </span>
                  ) : (
                    <div>
                      <span className="block font-bold">
                        Atenção: Conflito de Disponibilidade!
                      </span>
                      <span className="block mt-0.5">
                        O tema já possui todas as {stockCheck.stockTotal} unidades comprometidas neste intervalo.
                      </span>
                      <label className="mt-2 flex items-center gap-2 cursor-pointer font-bold text-rose-700 dark:text-rose-400">
                        <input
                          type="checkbox"
                          checked={forceOverride}
                          onChange={(e) => setForceOverride(e.target.checked)}
                          className="rounded text-rose-600"
                        />
                        <span>Autorizar reserva administrativa excepcional (ignorar bloqueio)</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. FINANCEIRO */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-rose-500" />
              <span>Valores & Pagamento</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Valor Total (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={total}
                  onChange={(e) => setTotal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Valor Pago / Sinal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={total}
                  value={paid}
                  onChange={(e) => setPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Saldo Devedor Restante
                </label>
                <div className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold flex items-center justify-between">
                  <span>R$ {calculatedBalance.toFixed(2).replace('.', ',')}</span>
                  {calculatedBalance === 0 ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Quitado</span>
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Pendente</span>
                  )}
                </div>
              </div>

              {paid > 0 && (
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Forma de Pagamento do Sinal
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as Payment['method'])}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="pix">PIX</option>
                    <option value="cartao">Cartão de Crédito/Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência Bancária</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 5. LOCAL E OBSERVAÇÕES */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Local da Festa / Buffet / Endereço de Entrega
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Buffet Estrela Mágica - Salão 2, Rua Bela Cintra 100"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Observações Operacionais ou da Montagem
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Cliente solicita painel com arco de balões desconstruído..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={stockCheck ? !stockCheck.available && !forceOverride : false}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Confirmar Reserva/Locação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
