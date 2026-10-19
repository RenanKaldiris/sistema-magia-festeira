'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  Calendar,
  DollarSign,
  Clock,
  Sparkles,
  Search,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  MapPin,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { RentalWithDetails, Item } from '@/types/database';
import { store } from '@/lib/store';
import { formatDateBR } from '@/lib/dateUtils';

interface ContractItemRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface RentalContractDrawerProps {
  rental: RentalWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onContractGenerated?: (rental: RentalWithDetails, contractUrl: string) => void;
}

export function RentalContractDrawer({
  rental,
  isOpen,
  onClose,
  onContractGenerated,
}: RentalContractDrawerProps) {
  const [activeTab, setActiveTab] = useState<'itens' | 'financeiro' | 'cronograma' | 'preview'>('itens');

  // Itens Locados
  const [items, setItems] = useState<ContractItemRow[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [customItemText, setCustomItemText] = useState('');

  // Financeiro
  const [total, setTotal] = useState<number>(0);
  const [paid, setPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('pix');
  const [paymentTerms, setPaymentTerms] = useState<string>('PIX - 50% no sinal e 50% na retirada');

  // Cronograma
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('17:00');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Cliente e Evento
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerRg, setCustomerRg] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('13h às 20h');

  // Estados de Geração
  const [isGenerating, setIsGenerating] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [formattedPreview, setFormattedPreview] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Catálogo de itens avulsos do acervo para inclusão rápida
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);

  useEffect(() => {
    setCatalogItems(store.getItems());
  }, [isOpen]);

  // Inicialização quando a locação abre
  useEffect(() => {
    if (rental && isOpen) {
      setTotal(rental.total || 0);
      setPaid(rental.paid || 0);
      setPickupDate(rental.pickup_date || '');
      setReturnDate(rental.return_date || '');
      setDeliveryLocation(rental.delivery_location || '');
      setNotes(rental.notes || '');

      setCustomerName(rental.customer?.name || '');
      setCustomerPhone(rental.customer?.phone || '');
      setCustomerDocument(rental.customer?.document || '');
      setCustomerAddress(rental.customer?.address || rental.delivery_location || '');

      setEventDate(rental.event_date || rental.pickup_date || '');
      setEventName(`Aniversário de ${rental.customer?.name?.split(' ')[0] || 'Cliente'}`);

      setContractUrl(rental.contract_url || null);
      setStatusMessage(null);
      setCopiedLink(false);

      // Extrai horários das notas se existirem
      if (rental.notes) {
        const timeMatch = rental.notes.match(/Horário:\s*([^\n]+)/i);
        if (timeMatch) setEventTime(timeMatch[1].trim());

        const payTermsMatch = rental.notes.match(/Condição de Pagamento:\s*([^\n]+)/i);
        if (payTermsMatch) setPaymentTerms(payTermsMatch[1].trim());
      }

      // Inicializa itens locados:
      // Se houver rental.lines, usa elas; caso contrário, inicializa com os itens padrão do kit/tema
      if (rental.lines && rental.lines.length > 0) {
        setItems(
          rental.lines.map((l, idx) => ({
            id: l.id || `line-${idx}`,
            description: l.description,
            quantity: l.quantity || 1,
            unitPrice: l.unit_price || 0,
          }))
        );
      } else {
        const defaultList: ContractItemRow[] = [
          {
            id: 'item-1',
            description: `Kit Painel e Estrutura - Tema ${rental.theme?.name || 'Magia Festeira'}`,
            quantity: 1,
            unitPrice: 0,
          },
          {
            id: 'item-2',
            description: 'Trio de cilindros com capas personalizadas do tema',
            quantity: 1,
            unitPrice: 0,
          },
          {
            id: 'item-3',
            description: 'Conjunto de doceiras, boleira e bandejas temáticas',
            quantity: 1,
            unitPrice: 0,
          },
          {
            id: 'item-4',
            description: 'Suporte de balões de chão (sem balões inclusos)',
            quantity: 1,
            unitPrice: 0,
          },
        ];
        setItems(defaultList);
      }
    }
  }, [rental, isOpen]);

  // Tecla ESC fecha o drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isGenerating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating, onClose]);

  // Saldo calculado
  const balance = useMemo(() => Math.max(0, total - paid), [total, paid]);

  // Itens filtrados para busca no catálogo
  const filteredCatalogItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return catalogItems.slice(0, 10);
    const q = itemSearchQuery.toLowerCase();
    return catalogItems.filter(
      (it) => it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q) || (it.category && it.category.toLowerCase().includes(q))
    );
  }, [catalogItems, itemSearchQuery]);

  // Adicionar item do catálogo
  const handleAddCatalogItem = (item: Item) => {
    const newRow: ContractItemRow = {
      id: `cat-${item.id}-${Date.now()}`,
      description: `${item.name} (${item.code})`,
      quantity: 1,
      unitPrice: item.unit_price || 0,
    };
    setItems((prev) => [...prev, newRow]);
    if (item.unit_price && item.unit_price > 0) {
      setTotal((prev) => Number((prev + item.unit_price).toFixed(2)));
    }
    setItemSearchQuery('');
    setShowItemSearch(false);
  };

  // Adicionar item personalizado digitado
  const handleAddCustomItem = () => {
    if (!customItemText.trim()) return;
    const newRow: ContractItemRow = {
      id: `custom-${Date.now()}`,
      description: customItemText.trim(),
      quantity: 1,
      unitPrice: 0,
    };
    setItems((prev) => [...prev, newRow]);
    setCustomItemText('');
  };

  // Remover item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const removed = prev.find((it) => it.id === id);
      if (removed && removed.unitPrice > 0) {
        setTotal((t) => Math.max(0, Number((t - removed.unitPrice * removed.quantity).toFixed(2))));
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  // Atualizar quantidade
  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const diff = newQty - it.quantity;
          if (it.unitPrice > 0) {
            setTotal((t) => Number((t + diff * it.unitPrice).toFixed(2)));
          }
          return { ...it, quantity: newQty };
        }
        return it;
      })
    );
  };

  // Gerar Contrato no Google Docs via API
  const handleGenerateContract = async () => {
    if (!rental) return;
    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/rentals/${rental.id}/contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'mf_live_sec_magiafesteira2026',
        },
        body: JSON.stringify({
          items: items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
          total,
          paid,
          paymentMethod,
          paymentTerms,
          pickupDate,
          pickupTime,
          returnDate,
          returnTime,
          deliveryLocation,
          notes,
          customer: {
            name: customerName,
            phone: customerPhone,
            document: customerDocument,
            rg: customerRg,
            address: customerAddress,
          },
          event: {
            name: eventName,
            date: eventDate,
            time: eventTime,
            location: deliveryLocation,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar documento no Google Docs.');
      }

      const generatedUrl = data.data.contractUrl;
      setContractUrl(generatedUrl);
      setFormattedPreview(data.data.formattedText || null);
      setStatusMessage({
        type: 'success',
        text: 'Contrato gerado e sincronizado com o Google Drive e Agenda com sucesso!',
      });

      if (onContractGenerated && data.data.rental) {
        onContractGenerated(data.data.rental, generatedUrl);
      }
    } catch (err: unknown) {
      console.error('[GenerateContract Error]', err);
      setStatusMessage({
        type: 'error',
        text: (err as Error).message || 'Falha ao conectar com o serviço do Google.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar Link
  const handleCopyLink = () => {
    if (contractUrl) {
      navigator.clipboard.writeText(contractUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Montar link direto de WhatsApp com mensagem de envio do contrato
  const whatsappShareUrl = useMemo(() => {
    if (!customerPhone || !contractUrl) return '';
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text =
      `Olá, ${customerName}! 🎈 Segue o Contrato Oficial de Locação da Magia Festeira para a festa do tema *${rental?.theme?.name || 'Decoração'}*:\n\n` +
      `📄 *Acesse e revise seu contrato aqui:*\n${contractUrl}\n\n` +
      `Qualquer dúvida estamos à disposição!`;
    return `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(text)}`;
  }, [customerPhone, customerName, contractUrl, rental]);

  if (!isOpen || !rental) return null;

  const orderDisplay = rental.id.slice(-4);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  LOC-2026-#{orderDisplay}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {rental.theme?.name || 'Tema'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate mt-0.5">
                Contrato de Locação • {customerName || 'Cliente'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificações / Status */}
        {statusMessage && (
          <div
            className={`p-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Card de Contrato Gerado (se já existir) */}
        {contractUrl && (
          <div className="m-4 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-blue-500/10 border border-rose-300 dark:border-rose-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  Contrato no Google Drive
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  Pronto para edição colaborativa e impressão
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Abrir Google Docs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                title="Copiar link do contrato"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? 'Copiado' : 'Copiar'}</span>
              </button>

              {whatsappShareUrl && (
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Enviar no WhatsApp da cliente"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('itens')}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'itens'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Itens Locados ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financeiro')}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'financeiro'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Valores & Pagamento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cronograma')}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cronograma'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Prazos & Local</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Minuta do Contrato</span>
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* ABA 1: ITENS LOCADOS */}
          {activeTab === 'itens' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Composição do Acervo no Contrato
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Edite as peças que constarão na Cláusula 5 do contrato.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowItemSearch(!showItemSearch)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Item do Estoque</span>
                </button>
              </div>

              {/* Caixa de Busca do Catálogo de Peças */}
              {showItemSearch && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in duration-150">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      placeholder="Buscar peça avulsa no acervo (ex: boleira, bandeja, arco)..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCatalogItems.length > 0 ? (
                      filteredCatalogItems.map((catItem) => (
                        <div
                          key={catItem.id}
                          onClick={() => handleAddCatalogItem(catItem)}
                          className="py-1.5 px-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {catItem.name}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                              ({catItem.code})
                            </span>
                          </div>
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            + R$ {catItem.unit_price.toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-2 text-center text-xs text-slate-400">
                        Nenhuma peça encontrada com esse termo.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Campo para Adicionar Item Personalizado Rápido */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customItemText}
                  onChange={(e) => setCustomItemText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomItem())}
                  placeholder="Ou digite um item avulso extra (ex: 2x Vasos de mesa dourados)..."
                  className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  disabled={!customItemText.trim()}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  Adicionar
                </button>
              </div>

              {/* Lista Atual de Itens do Contrato */}
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Quantidade */}
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(it.id, it.quantity - 1)}
                          className="px-2 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs"
                        >
                          -
                        </button>
                        <span className="px-1.5 text-xs font-bold text-slate-900 dark:text-white">
                          {it.quantity}x
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(it.id, it.quantity + 1)}
                          className="px-2 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Descrição do Item */}
                      <input
                        type="text"
                        value={it.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems((prev) =>
                            prev.map((row) => (row.id === it.id ? { ...row, description: val } : row))
                          );
                        }}
                        className="w-full text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
                      />
                    </div>

                    {/* Preço Unitário e Exclusão */}
                    <div className="flex items-center gap-2 shrink-0">
                      {it.unitPrice > 0 && (
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          R$ {(it.unitPrice * it.quantity).toFixed(2)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remover item do contrato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 2: VALORES & FORMA DE PAGAMENTO */}
          {activeTab === 'financeiro' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Valor Total */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Valor Total Contratado
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={total}
                      onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-2 py-1.5 text-sm font-extrabold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Sinal Pago */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Sinal na Reserva (Pago)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={paid}
                      onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-2 py-1.5 text-sm font-extrabold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Saldo Restante */}
                <div className="p-3.5 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900">
                  <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase block mb-1">
                    Saldo Restante na Retirada
                  </label>
                  <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 py-1.5">
                    R$ {balance.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>

              {/* Condição de Pagamento por Extenso */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Condição e Prazos de Pagamento (Cláusula 4)
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Ex: PIX - 50% em 09/10 e 50% em 16/10 no ato da retirada"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Meio Principal de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500 uppercase font-semibold"
                >
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão de Crédito / Débito</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="transferencia">Transferência Bancária</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  O novo modelo de contrato possui a cláusula que determina a <strong>quitação obrigatória do saldo devedor</strong> antes da entrega ou retirada dos itens da loja.
                </span>
              </div>
            </div>
          )}

          {/* ABA 3: CRONOGRAMA, PRAZOS & DADOS */}
          {activeTab === 'cronograma' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Data e Hora de Retirada */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    📦 Retirada do Acervo
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Data</label>
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Horário</label>
                      <input
                        type="text"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        placeholder="Ex: 10:00"
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Data e Hora de Devolução */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    🔄 Devolução do Acervo
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Data</label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Horário Limite</label>
                      <input
                        type="text"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        placeholder="Ex: Até às 17h00"
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados do Cliente para o Contrato */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  👤 Dados Cadastrais do Contratante
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Nome Completo</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">CPF</label>
                    <input
                      type="text"
                      value={customerDocument}
                      onChange={(e) => setCustomerDocument(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">RG</label>
                    <input
                      type="text"
                      value={customerRg}
                      onChange={(e) => setCustomerRg(e.target.value)}
                      placeholder="00.000.000-0"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Endereço Residencial do Cliente</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Rua, número, complemento, bairro..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Local do Evento & Observações */}
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Local do Evento / Entrega (se diferente da residência)
                  </label>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="Ex: Salão de Festas do Edifício..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Observações Gerais do Contrato (Cláusula 6)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações que constarão no contrato..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: PRÉ-VISUALIZAÇÃO DA MINUTA */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Minuta Atualizada em Tempo Real
                </span>
                <span className="text-[10px] text-slate-400">
                  Modelo Oficial Blindado 2026
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 max-h-96 overflow-y-auto whitespace-pre-wrap">
                {formattedPreview ||
                  `MAGIA FESTEIRA - LOCAÇÃO PARA DECORAÇÕES DE FESTAS\nCNPJ: 51.492.381/0001-90 | WhatsApp: (11) 97782-3876\n\nCONTRATO DE LOCAÇÃO DE KITS E MOBILIÁRIO\nContrato nº LOC-2026-#${orderDisplay}\n\n1. CONTRATANTE: ${customerName}\nCPF: ${customerDocument || '—'} | Cel: ${customerPhone}\n\n2. LOCAÇÃO: ${rental.theme?.name}\nTotal: R$ ${total.toFixed(2)} | Sinal: R$ ${paid.toFixed(2)} | Saldo: R$ ${balance.toFixed(2)}\n\n3. ITENS LOCADOS:\n${items.map((i) => `• ${i.quantity}x ${i.description}`).join('\n')}\n\n(Clique em 'Gerar e Salvar no Google Drive' para compilar o documento oficial)`}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Fixo de Ação */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleGenerateContract}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gerando no Google Drive...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{contractUrl ? 'Regerar e Atualizar Contrato' : 'Gerar e Salvar no Google Drive'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
