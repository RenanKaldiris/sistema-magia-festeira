'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
  Printer,
  MessageSquare,
  Trash2,
  ArrowRight,
  Filter,
  Calendar,
  MapPin,
  User,
  Phone,
  Tag,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Orcamento, OrcamentoStatus, OrcamentoItemData, ThemeWithDetails, Item } from '@/types/database';
import { store } from '@/lib/store';

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [themes, setThemes] = useState<ThemeWithDetails[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Novo Orçamento
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrcamentoItemData[]>([]);
  const [discountValue, setDiscountValue] = useState<number | string>('0');
  const [shippingFee, setShippingFee] = useState<number | string>('0');
  const [notes, setNotes] = useState('');

  // Notificação toast
  const [notification, setNotification] = useState<string | null>(null);

  const refreshData = () => {
    setOrcamentos(store.getOrcamentos());
    setThemes(store.getThemes());
    setItems(store.getItems());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = store.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // KPIs
  const totalOrcamentos = orcamentos.length;
  const pendentes = orcamentos.filter((o) => o.status === 'pendente');
  const aprovados = orcamentos.filter((o) => o.status === 'aprovado' || o.status === 'convertido');
  const totalAprovadoValor = aprovados.reduce((acc, o) => acc + (o.total || 0), 0);
  const taxaConversao = totalOrcamentos > 0 ? Math.round((aprovados.length / totalOrcamentos) * 100) : 0;

  // Filtro
  const filteredOrcamentos = useMemo(() => {
    return orcamentos.filter((orc) => {
      const matchStatus = statusFilter === 'todos' || orc.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        orc.customer_name.toLowerCase().includes(q) ||
        orc.code.toLowerCase().includes(q) ||
        orc.customer_phone.includes(q) ||
        (orc.event_location && orc.event_location.toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [orcamentos, statusFilter, searchQuery]);

  // Handler criar orçamento
  const handleAddItemToQuote = (type: 'theme' | 'item', entity: ThemeWithDetails | Item) => {
    const isTheme = type === 'theme';
    const unitPrice = isTheme
      ? (entity as ThemeWithDetails).promotional_price || (entity as ThemeWithDetails).base_price
      : (entity as Item).promotional_price || (entity as Item).unit_price;

    const newItem: OrcamentoItemData = {
      id: 'quote-item-' + Math.random().toString(36).substring(2, 9),
      item_type: type,
      entity_id: entity.id,
      title: entity.name,
      description: isTheme ? `Decoração temática código ${(entity as ThemeWithDetails).code}` : `Peça de acervo ${(entity as Item).code}`,
      quantity: 1,
      unit_price: unitPrice,
      discount: 0,
      total: unitPrice,
    };

    setSelectedItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItemFromQuote = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const subtotalNewQuote = selectedItems.reduce((acc, i) => acc + i.total, 0);
  const totalNewQuote = Math.max(0, subtotalNewQuote - Number(discountValue || 0) + Number(shippingFee || 0));

  const handleCreateOrcamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      showNotification('Informe ao menos o nome e telefone do cliente.');
      return;
    }

    if (selectedItems.length === 0) {
      showNotification('Adicione pelo menos um tema ou item ao orçamento.');
      return;
    }

    store.createOrcamento({
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      code: `ORC-${new Date().getFullYear()}-${String(orcamentos.length + 1).padStart(3, '0')}`,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || undefined,
      event_date: eventDate || undefined,
      event_location: eventLocation.trim() || undefined,
      items: selectedItems,
      subtotal: subtotalNewQuote,
      discount: Number(discountValue) || 0,
      shipping_fee: Number(shippingFee) || 0,
      total: totalNewQuote,
      status: 'pendente',
      notes: notes.trim() || undefined,
    });

    setIsNewModalOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setEventDate('');
    setEventLocation('');
    setSelectedItems([]);
    setDiscountValue('0');
    setShippingFee('0');
    setNotes('');
    showNotification('Orçamento criado com sucesso!');
  };

  const handleUpdateStatus = (id: string, newStatus: OrcamentoStatus) => {
    store.updateOrcamento(id, { status: newStatus });
    showNotification(`Status alterado para ${newStatus}.`);
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Deseja realmente excluir o orçamento ${code}?`)) {
      store.deleteOrcamento(id);
      showNotification(`Orçamento ${code} excluído.`);
    }
  };

  const handleSendWhatsApp = (orc: Orcamento) => {
    let msg = `Olá, *${orc.customer_name}*! Tudo bem? 🎈\n\n`;
    msg += `Aqui está a proposta de orçamento (*${orc.code}*) da *Magia Festeira* para o seu evento:\n\n`;

    if (orc.event_date) {
      msg += `📅 *Data:* ${orc.event_date}\n`;
    }
    if (orc.event_location) {
      msg += `📍 *Local:* ${orc.event_location}\n`;
    }
    msg += `\n*Itens Inclusos:*\n`;

    orc.items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.title} (qtd: ${item.quantity}) - R$ ${item.total.toFixed(2).replace('.', ',')}\n`;
    });

    msg += `\nSubtotal: R$ ${orc.subtotal.toFixed(2).replace('.', ',')}\n`;
    if (orc.discount > 0) {
      msg += `Desconto especial: - R$ ${orc.discount.toFixed(2).replace('.', ',')}\n`;
    }
    if (orc.shipping_fee > 0) {
      msg += `Frete / Montagem: + R$ ${orc.shipping_fee.toFixed(2).replace('.', ',')}\n`;
    }
    msg += `*Total Final:* R$ ${orc.total.toFixed(2).replace('.', ',')}\n\n`;

    if (orc.notes) {
      msg += `Observações: ${orc.notes}\n\n`;
    }

    msg += `Para confirmar a reserva da sua data, basta nos responder por aqui! 🎈✨`;

    const phoneNum = orc.customer_phone.replace(/\D/g, '');
    const cleanPhone = phoneNum.startsWith('55') ? phoneNum : `55${phoneNum}`;
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-zinc-700 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-pink-600" />
            Orçamentos & Propostas
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Crie, envie via WhatsApp e controle propostas de locação para clientes
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Orçamento</span>
        </button>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Total Propostas</span>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            {totalOrcamentos}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Pendentes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {pendentes.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Aprovados / Fechados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {aprovados.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Valor Fechado</span>
            <TrendingUp className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            R$ {totalAprovadoValor.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, código ou local..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['todos', 'pendente', 'aprovado', 'recusado'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                statusFilter === status
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* List of Proposals */}
      {filteredOrcamentos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            Nenhum orçamento encontrado
          </h3>
          <p className="text-xs text-zinc-500 mt-1 mb-4">
            Crie uma nova proposta rápida para seus clientes.
          </p>
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition"
          >
            Novo Orçamento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrcamentos.map((orc) => {
            const isApproved = orc.status === 'aprovado' || orc.status === 'convertido';
            const isPending = orc.status === 'pendente';
            const isRejected = orc.status === 'recusado';

            return (
              <div
                key={orc.id}
                className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-pink-300 dark:hover:border-pink-900/60 transition"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-pink-600 bg-pink-50 dark:bg-pink-950/40 px-2.5 py-0.5 rounded-lg">
                      {orc.code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : isPending
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {orc.status}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      Criado em {new Date(orc.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {orc.customer_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        {orc.customer_phone}
                      </span>
                      {orc.event_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-pink-500" />
                          Festa: {orc.event_date}
                        </span>
                      )}
                      {orc.event_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          {orc.event_location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Itens */}
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {orc.items.map((item) => (
                        <span
                          key={item.id}
                          className="text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md"
                        >
                          {item.quantity}x {item.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total & Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 font-medium">Total da Proposta</span>
                    <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                      R$ {orc.total.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Alterar Status */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(orc.id, 'aprovado')}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                        title="Marcar como Aprovado"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprovar
                      </button>
                    )}

                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(orc)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-xs"
                      title="Enviar proposta no WhatsApp do cliente"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>

                    {/* Excluir */}
                    <button
                      type="button"
                      onClick={() => handleDelete(orc.id, orc.code)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                      title="Excluir proposta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: NOVO ORÇAMENTO */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Criar Novo Orçamento
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Monte a proposta com itens do catálogo e envie direto ao cliente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateOrcamento} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Cliente */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                  1. Dados do Cliente & Evento
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Camila Silva"
                      className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 99999-8888"
                      className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Data da Festa
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Local do Evento / Endereço
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Ex: Buffet Estrela Encantada - Rua das Palmeiras, 100"
                      className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seleção de Itens */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                  2. Adicionar Temas e Peças
                </h3>

                {/* Seletores rápidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 block">
                      + Adicionar Tema de Decoração
                    </span>
                    <select
                      onChange={(e) => {
                        const t = themes.find((item) => item.id === e.target.value);
                        if (t) handleAddItemToQuote('theme', t);
                        e.target.value = '';
                      }}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none"
                    >
                      <option value="">Selecione um tema para incluir...</option>
                      {themes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (R$ {(t.promotional_price || t.base_price).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 block">
                      + Adicionar Peça do Estoque
                    </span>
                    <select
                      onChange={(e) => {
                        const it = items.find((item) => item.id === e.target.value);
                        if (it) handleAddItemToQuote('item', it);
                        e.target.value = '';
                      }}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none"
                    >
                      <option value="">Selecione uma peça avulsa...</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} (R$ {(it.promotional_price || it.unit_price).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Itens Selecionados */}
                {selectedItems.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs">
                    Nenhum item adicionado ainda à proposta.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.title}
                          </p>
                          <span className="text-zinc-400 text-[11px]">{item.description}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            R$ {item.total.toFixed(2).replace('.', ',')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromQuote(item.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Valores & Totais */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Desconto Geral (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Frete / Taxa de Deslocamento (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    Total da Proposta:
                  </span>
                  <span className="text-lg font-black text-pink-600">
                    R$ {totalNewQuote.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Observações para a Montagem / Proposta
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Montagem às 9h e retirada no mesmo dia às 20h"
                  className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none"
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Criar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
