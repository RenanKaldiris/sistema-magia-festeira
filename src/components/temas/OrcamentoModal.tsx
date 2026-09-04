'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  Plus,
  Trash2,
  Share2,
  Copy,
  Printer,
  Mail,
  MessageSquare,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Theme, Item } from '@/types/database';
import { store } from '@/lib/store';
import { getWhatsAppUrl } from '@/lib/whatsapp';

export interface OrcamentoItem {
  id: string;
  type: 'theme' | 'item';
  name: string;
  code: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface OrcamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialThemeIds?: string[];
  initialItemIds?: string[];
}

export function OrcamentoModal({
  isOpen,
  onClose,
  initialThemeIds = [],
  initialItemIds = [],
}: OrcamentoModalProps) {
  // Client & Event Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [freight, setFreight] = useState<number>(0);

  // Items in Quote
  const [items, setItems] = useState<OrcamentoItem[]>([]);

  // Add Item Dropdown
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedEntityToAdd, setSelectedEntityToAdd] = useState<string>('');

  // Share Options Dropdown
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Populate initial items when modal opens
  useEffect(() => {
    if (isOpen) {
      const allThemes = store.getThemes();
      const allItems = store.getItems();

      const themeItems: OrcamentoItem[] = allThemes
        .filter((t) => initialThemeIds.includes(t.id))
        .map((t) => {
          const details = store.getThemeById(t.id);
          return {
            id: t.id,
            type: 'theme',
            name: t.name,
            code: t.code,
            price: t.base_price,
            quantity: 1,
            imageUrl: details?.primary_media?.storage_path,
          };
        });

      const itemItems: OrcamentoItem[] = allItems
        .filter((it) => initialItemIds.includes(it.id))
        .map((it) => ({
          id: it.id,
          type: 'item',
          name: it.name,
          code: it.code,
          price: it.unit_price,
          quantity: 1,
        }));

      setItems([...themeItems, ...itemItems]);
      setIsShareMenuOpen(false);
    }
  }, [isOpen, initialThemeIds, initialItemIds]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  const total = useMemo(() => {
    const calculated = subtotal + Number(freight) - Number(discount);
    return calculated > 0 ? calculated : 0;
  }, [subtotal, freight, discount]);

  if (!isOpen) return null;

  // Change Item Quantity
  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: newQty } : item))
    );
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Item from Catalog
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityToAdd) return;

    const [type, id] = selectedEntityToAdd.split(':');
    if (type === 'theme') {
      const theme = store.getThemeById(id);
      if (theme) {
        setItems((prev) => [
          ...prev,
          {
            id: theme.id,
            type: 'theme',
            name: theme.name,
            code: theme.code,
            price: theme.base_price,
            quantity: 1,
            imageUrl: theme.primary_media?.storage_path,
          },
        ]);
      }
    } else if (type === 'item') {
      const looseItem = store.getItems().find((i) => i.id === id);
      if (looseItem) {
        setItems((prev) => [
          ...prev,
          {
            id: looseItem.id,
            type: 'item',
            name: looseItem.name,
            code: looseItem.code,
            price: looseItem.unit_price,
            quantity: 1,
          },
        ]);
      }
    }

    setSelectedEntityToAdd('');
    setIsAddingItem(false);
  };

  // Format Proposal Message
  const buildProposalText = () => {
    const formattedDate = eventDate ? new Date(eventDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir';
    const lines = items.map(
      (item, idx) =>
        `${idx + 1}. *${item.name}* (${item.code})\n   Qtd: ${item.quantity}x • Unit: R$ ${item.price
          .toFixed(2)
          .replace('.', ',')} • Subtotal: R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`
    );

    return (
      `🎈 *PROPOSTA DE ORÇAMENTO - MAGIA FESTEIRA DECORAÇÕES*\n\n` +
      `Olá${customerName ? `, *${customerName}*` : ''}! Segue a composição detalhada do orçamento para o seu evento:\n\n` +
      `📅 *Data da Festa:* ${formattedDate}\n` +
      (eventLocation ? `📍 *Local:* ${eventLocation}\n` : '') +
      `\n📋 *Itens Selecionados:*\n${lines.join('\n\n')}\n\n` +
      `💰 *Resumo Financeiro:*\n` +
      `• Subtotal dos itens: R$ ${subtotal.toFixed(2).replace('.', ',')}\n` +
      (freight > 0 ? `• Frete / Montagem: R$ ${Number(freight).toFixed(2).replace('.', ',')}\n` : '') +
      (discount > 0 ? `• Desconto Especial: -R$ ${Number(discount).toFixed(2).replace('.', ',')}\n` : '') +
      `👉 *VALOR TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*\n\n` +
      (notes ? `📝 *Observações:* ${notes}\n\n` : '') +
      `Ficamos à disposição para garantir a reserva dessa data! ✨`
    );
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const text = buildProposalText();
    let url = `https://wa.me/`;
    if (customerPhone) {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      url += `${fullPhone}?text=${encodeURIComponent(text)}`;
    } else {
      url += `?text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');
    setIsShareMenuOpen(false);
  };

  // Copy to Clipboard
  const handleCopyProposal = () => {
    const text = buildProposalText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
    setIsShareMenuOpen(false);
  };

  // Send via Email
  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Proposta de Orçamento Magia Festeira - ${customerName || 'Evento'}`);
    const body = encodeURIComponent(buildProposalText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setIsShareMenuOpen(false);
  };

  // Print Proposal
  const handlePrint = () => {
    window.print();
    setIsShareMenuOpen(false);
  };

  const allThemesList = store.getThemes();
  const allItemsList = store.getItems();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Montagem de Orçamento
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  {items.length} itens cotados
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adicione temas e peças avulsas, personalize valores e compartilhe diretamente com o cliente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar janela de orçamento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Toast de Cópia */}
          {copiedToast && (
            <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Texto completo do orçamento copiado para a área de transferência!</span>
            </div>
          )}

          {/* Dados do Cliente e Evento */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dados da Reserva & Cliente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-rose-500" />
                  <span>Nome do Cliente</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>WhatsApp do Cliente</span>
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Data da Festa</span>
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Local / Buffet</span>
                </label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Buffet Estrela, Salão do Prédio..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Tabela de Itens Selecionados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Composição do Orçamento ({items.length} itens)
              </h3>

              <button
                type="button"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Mais Itens</span>
              </button>
            </div>

            {/* Dropdown para Adicionar Item / Tema */}
            {isAddingItem && (
              <form
                onSubmit={handleAddItem}
                className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row gap-3 items-end"
              >
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200 mb-1">
                    Selecione um tema ou peça avulsa do acervo:
                  </label>
                  <select
                    value={selectedEntityToAdd}
                    onChange={(e) => setSelectedEntityToAdd(e.target.value)}
                    className="w-full px-3 py-2 border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="">Selecione um item...</option>
                    <optgroup label="Temas de Decoração">
                      {allThemesList.map((t) => (
                        <option key={t.id} value={`theme:${t.id}`}>
                          {t.name} ({t.code}) - R$ {t.base_price.toFixed(2).replace('.', ',')}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Peças Avulsas & Mobília">
                      {allItemsList.map((i) => (
                        <option key={i.id} value={`item:${i.id}`}>
                          {i.name} ({i.code}) - R$ {i.unit_price.toFixed(2).replace('.', ',')}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!selectedEntityToAdd}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    Inserir no Orçamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Listagem de Itens */}
            {items.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                Nenhum item inserido no orçamento. Clique em "Adicionar Mais Itens" acima para começar.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Item / Tema</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4 text-center">Quantidade</th>
                      <th className="py-3 px-4 text-right">Preço Unit.</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {items.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
                                {item.code}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              item.type === 'theme'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {item.type === 'theme' ? 'Tema Completo' : 'Peça Avulsa'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 bg-white dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold px-1"
                            >
                              -
                            </button>
                            <span className="font-bold text-xs w-5 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold px-1"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-medium">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </td>

                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Remover item da proposta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totais, Descontos e Frete */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Observações da Proposta */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observações / Condições Comerciais
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Incluso montagem e desmontagem. Pagamento: 50% na reserva + 50% na entrega..."
                className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Cálculo Financeiro */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal dos Itens:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600 dark:text-slate-400">Frete / Montagem (R$):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={freight}
                  onChange={(e) => setFreight(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600 dark:text-slate-400">Desconto Especial (R$):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold text-emerald-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  VALOR TOTAL DA PROPOSTA:
                </span>
                <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Botões de Ação */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Dúvidas? Todos os preços e itens ficam registrados para consulta rápida.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end relative">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {/* Menu de Envio */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar Orçamento</span>
              </button>

              {isShareMenuOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition-colors text-left"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyProposal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto Formatado</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareEmail}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Enviar por E-mail</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir / Salvar PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
