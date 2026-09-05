'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Phone,
  Mail,
  FileText,
  Calendar,
  Search,
  Plus,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit3,
  MapPin,
  X,
  UploadCloud,
  Download,
} from 'lucide-react';
import { store } from '@/lib/store';
import { Customer, RentalWithDetails } from '@/types/database';
import { formatDateBR } from '@/lib/dateUtils';
import { CustomerEditDrawer } from '@/components/clientes/CustomerEditDrawer';
import { CustomerBatchActionBar } from '@/components/clientes/CustomerBatchActionBar';
import { DeleteConfirmationModal } from '@/components/temas/DeleteConfirmationModal';
import { ImportCustomersModal } from '@/components/clientes/ImportCustomersModal';
import { ExportCustomersModal } from '@/components/clientes/ExportCustomersModal';
import { OrcamentoModal } from '@/components/temas/OrcamentoModal';

type SortField = 'name' | 'rentals' | 'date';
type SortOrder = 'asc' | 'desc' | null;

interface SortState {
  field: SortField | null;
  order: SortOrder;
}

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>(store.getCustomers());
  const [rentals, setRentals] = useState<RentalWithDetails[]>(store.getRentals());
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Tri-State Sorting: Nome, Locações, Data de Cadastro
  const [sortState, setSortState] = useState<SortState>({ field: null, order: null });

  // Bulk Selection State
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Modais e Gavetas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isOrcamentoModalOpen, setIsOrcamentoModalOpen] = useState(false);
  const [selectedCustomerForOrcamento, setSelectedCustomerForOrcamento] = useState<Customer | null>(null);

  // Form novo cliente
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Inscrição reativa para atualizações instantâneas entre abas e mutações locais
  useEffect(() => {
    setCustomers(store.getCustomers());
    setRentals(store.getRentals());

    const unsubscribe = store.subscribe(() => {
      setCustomers(store.getCustomers());
      setRentals(store.getRentals());
    });

    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtered and Sorted customers
  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = customers.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.document && c.document.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    });

    // Tri-State Sorting: Nome, Quantidade de Festas, Data
    if (sortState.field === 'name' && sortState.order) {
      list = [...list].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, 'pt-BR');
        return sortState.order === 'asc' ? cmp : -cmp;
      });
    } else if (sortState.field === 'rentals' && sortState.order) {
      list = [...list].sort((a, b) => {
        const aCount = rentals.filter((r) => r.customer_id === a.id).length;
        const bCount = rentals.filter((r) => r.customer_id === b.id).length;
        const diff = aCount - bCount;
        return sortState.order === 'asc' ? diff : -diff;
      });
    } else if (sortState.field === 'date' && sortState.order) {
      list = [...list].sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return sortState.order === 'asc' ? aTime - bTime : bTime - aTime;
      });
    }

    return list;
  }, [customers, search, sortState, rentals]);

  // Handle column header sort toggle (asc -> desc -> null)
  const handleSort = (field: SortField) => {
    setSortState((prev) => {
      if (prev.field !== field) {
        return { field, order: 'asc' };
      }
      if (prev.order === 'asc') {
        return { field, order: 'desc' };
      }
      return { field: null, order: null }; // 3rd click: volta à ordem original
    });
  };

  // Selection helpers
  const allVisibleSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every((c) => selectedCustomerIds.includes(c.id));
  const someVisibleSelected =
    filteredCustomers.some((c) => selectedCustomerIds.includes(c.id)) && !allVisibleSelected;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredCustomers.map((c) => c.id));
      setSelectedCustomerIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      const visibleIds = filteredCustomers.map((c) => c.id);
      setSelectedCustomerIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleSelect = (customerId: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  };

  // Copiar contatos selecionados para WhatsApp / CRM
  const handleCopyContacts = () => {
    const selected = customers.filter((c) => selectedCustomerIds.includes(c.id));
    if (selected.length === 0) return;

    const text = selected
      .map((c) => `${c.name} - ${c.phone}${c.email ? ` (${c.email})` : ''}`)
      .join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showNotification(`${selected.length} contatos copiados para a área de transferência!`);
      });
    }
  };

  // Disparar modal de exclusão em lote
  const handleTriggerBatchDelete = () => {
    if (selectedCustomerIds.length === 0) return;
    setDeleteTargetIds(selectedCustomerIds);
    setIsDeleteModalOpen(true);
  };

  // Disparar exclusão de cliente individual vindo do drawer ou linha
  const handleTriggerSingleDelete = (customerId: string) => {
    setDeleteTargetIds([customerId]);
    setIsDeleteModalOpen(true);
  };

  // Confirmar exclusão no modal
  const handleConfirmDelete = () => {
    const count = deleteTargetIds.length;
    if (count === 0) return;

    store.deleteCustomers(deleteTargetIds);
    setCustomers(store.getCustomers());
    setSelectedCustomerIds((prev) => prev.filter((id) => !deleteTargetIds.includes(id)));
    if (editingCustomer && deleteTargetIds.includes(editingCustomer.id)) {
      setEditingCustomer(null);
    }
    setIsDeleteModalOpen(false);
    setDeleteTargetIds([]);
    showNotification(`${count} ${count > 1 ? 'clientes excluídos' : 'cliente excluído'} com sucesso.`);
  };

  // Criar novo cliente
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const newCust = store.createCustomer({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      document: document.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    });

    setCustomers(store.getCustomers());
    setIsModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setDocument('');
    setAddress('');
    setNotes('');

    showNotification(`Cliente "${newCust.name}" cadastrado com sucesso!`);
  };

  // Salvar cliente editado no drawer
  const handleSaveEditedCustomer = (updated: Customer) => {
    setCustomers(store.getCustomers());
    setEditingCustomer(null);
    showNotification(`Cliente "${updated.name}" atualizado com sucesso!`);
  };

  // Abrir modal de criação de orçamento para cliente específico
  const handleOpenOrcamentoForCustomer = (customer: Customer) => {
    setSelectedCustomerForOrcamento(customer);
    setIsOrcamentoModalOpen(true);
  };

  // Nomes dos clientes para confirmação de exclusão
  const deleteTargetNames = useMemo(() => {
    return customers
      .filter((c) => deleteTargetIds.includes(c.id))
      .map((c) => `${c.name} (${c.phone})`);
  }, [customers, deleteTargetIds]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header com Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Cadastro & CRM de Clientes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
              {customers.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Contatos diretos, histórico de locações anteriores e canais de WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botão Escuro: Importar */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs sm:text-sm font-bold border border-slate-700/80 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Importar lista de contatos (Excel, CSV, PDF ou anotações)"
          >
            <UploadCloud className="w-4 h-4 text-rose-400" />
            <span>Importar</span>
          </button>

          {/* Botão Escuro: Exportar */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs sm:text-sm font-bold border border-slate-700/80 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Exportar todos os contatos para Excel, PDF ou texto"
          >
            <Download className="w-4 h-4 text-rose-400" />
            <span>Exportar</span>
          </button>

          {/* Botão Principal: Cadastrar Novo Cliente */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Notificação Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Barra de Busca & Ordenação Rápida Mobile */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone, e-mail, documento ou observações..."
            className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Mobile Quick-Sort Chips */}
        <div className="flex md:hidden items-center gap-2 w-full justify-between pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Ordenar:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSort('name')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                sortState.field === 'name'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>Nome</span>
              {sortState.field === 'name' ? (
                sortState.order === 'asc' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSort('rentals')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                sortState.field === 'rentals'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>Locações</span>
              {sortState.field === 'rentals' ? (
                sortState.order === 'asc' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSort('date')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                sortState.field === 'date'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>Recentes</span>
              {sortState.field === 'date' ? (
                sortState.order === 'asc' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dica de edição rápida */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-1">
        <Edit3 className="w-3.5 h-3.5 text-rose-500" />
        <span>
          <strong>Dica:</strong> Clique em qualquer linha da tabela para abrir o formulário de edição rápida de dados cadastrais e histórico completo de festas.
        </span>
      </div>

      {/* Mobile Clientes Cards (touch-friendly) */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <span>Nenhum cliente encontrado com os termos pesquisados.</span>
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const customerRentals = rentals.filter((r) => r.customer_id === c.id);
            const isSelected = selectedCustomerIds.includes(c.id);
            const rawPhone = c.phone.replace(/\D/g, '');
            const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

            const initials = c.name
              ? c.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0].toUpperCase())
                  .join('')
              : 'CL';

            return (
              <div
                key={c.id}
                onClick={() => setEditingCustomer(c)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {c.name}
                        </span>
                        <span className="font-extrabold text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/40">
                          {customerRentals.length} festa(s)
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mt-0.5">
                        {c.phone}
                      </span>
                      {c.email && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">
                          {c.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checkbox Touch Selection */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 cursor-pointer"
                    title={isSelected ? 'Desmarcar' : 'Selecionar'}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(c.id)}
                      className="w-5 h-5 text-rose-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-rose-500 cursor-pointer"
                      aria-label={`Selecionar ${c.name}`}
                    />
                  </div>
                </div>

                {/* Resumo de Locações Recentes ou Preferências */}
                {customerRentals.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Festas:</span>
                    {customerRentals.slice(0, 2).map((r) => (
                      <span
                        key={r.id}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700 font-medium truncate max-w-[150px]"
                      >
                        ✨ {r.theme?.name || 'Tema'} ({formatDateBR(r.event_date)})
                      </span>
                    ))}
                  </div>
                ) : (
                  c.notes && (
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] italic text-slate-500 dark:text-slate-400 line-clamp-1">
                        {c.notes}
                      </span>
                    </div>
                  )
                )}

                {/* Botões Rápidos de Ação Touch */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                      `Olá, ${c.name}! Tudo bem? Falamos da Magia Festeira decorações.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="py-2 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 border border-emerald-200 dark:border-emerald-800/50 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenOrcamentoForCustomer(c);
                    }}
                    className="py-2 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1 border border-rose-100 dark:border-rose-900/40 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Orçamento</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCustomer(c);
                    }}
                    className="py-2 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1 border border-rose-100 dark:border-rose-900/40 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Clientes Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                {/* Sortable: Nome do Cliente */}
                <th className="py-3.5 px-6">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] hover:text-slate-900 dark:hover:text-white transition-colors group cursor-pointer select-none"
                    title="Ordenar por Nome (1º clique: A-Z, 2º clique: Z-A, 3º clique: ordem original)"
                  >
                    <span>Cliente</span>
                    {sortState.field === 'name' ? (
                      sortState.order === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </th>

                <th className="py-3.5 px-6">Telefone / WhatsApp</th>
                <th className="py-3.5 px-6">E-mail</th>

                {/* Sortable: Festas / Histórico */}
                <th className="py-3.5 px-6">
                  <button
                    type="button"
                    onClick={() => handleSort('rentals')}
                    className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] hover:text-slate-900 dark:hover:text-white transition-colors group cursor-pointer select-none"
                    title="Ordenar por Quantidade de Locações"
                  >
                    <span>Festas / Histórico</span>
                    {sortState.field === 'rentals' ? (
                      sortState.order === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </th>

                <th className="py-3.5 px-6">Preferências / Notas</th>

                {/* Checkbox Mestre & Ações */}
                <th className="py-3.5 px-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <span>Ações</span>
                    <label
                      className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none"
                      title="Selecionar todos os clientes visíveis"
                    >
                      <input
                        type="checkbox"
                        ref={masterCheckboxRef}
                        checked={allVisibleSelected}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 text-rose-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-rose-500 cursor-pointer"
                      />
                      <span className="sr-only">Selecionar todos</span>
                    </label>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400 text-xs">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <span>Nenhum cliente encontrado com os critérios de busca.</span>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const customerRentals = rentals.filter((r) => r.customer_id === c.id);
                  const isSelected = selectedCustomerIds.includes(c.id);
                  const rawPhone = c.phone.replace(/\D/g, '');
                  const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

                  const initials = c.name
                    ? c.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0].toUpperCase())
                        .join('')
                    : 'CL';

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setEditingCustomer(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-rose-50/60 dark:bg-rose-950/25 hover:bg-rose-50/80 dark:hover:bg-rose-950/35'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                      title="Clique para abrir a edição rápida e histórico deste cliente"
                    >
                      {/* Cliente (Avatar + Nome + Documento/Endereço) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {c.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {c.document ? (
                                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                                  CPF: {c.document}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                  Cliente Cadastrado
                                </span>
                              )}
                              {c.address && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5 truncate max-w-[160px]">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{c.address}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Telefone / WhatsApp */}
                      <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                        <span className="font-semibold font-mono">{c.phone}</span>
                      </td>

                      {/* E-mail */}
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                        {c.email ? (
                          <span className="truncate max-w-[200px] block">{c.email}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic text-xs">
                            Não informado
                          </span>
                        )}
                      </td>

                      {/* Festas / Histórico */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                            {customerRentals.length}{' '}
                            {customerRentals.length === 1 ? 'festa' : 'festas'}
                          </span>
                          {customerRentals.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {customerRentals.slice(0, 2).map((r) => (
                                <span
                                  key={r.id}
                                  className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px] block"
                                >
                                  ✨ {r.theme?.name || 'Tema'} ({formatDateBR(r.event_date)})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Preferências / Notas */}
                      <td className="py-4 px-6">
                        {c.notes ? (
                          <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs italic">
                            {c.notes}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-xs italic">
                            Sem observações
                          </span>
                        )}
                      </td>

                      {/* Ações & Checkbox Individual */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenOrcamentoForCustomer(c);
                            }}
                            title="Criar Orçamento para este Cliente"
                            className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                              `Olá, ${c.name}! Tudo bem? Falamos da Magia Festeira decorações.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Conversar no WhatsApp"
                            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </a>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCustomer(c);
                            }}
                            title="Editar Dados do Cliente"
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Checkbox adjacente aos botões de ação */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pl-1.5 flex items-center"
                            title={isSelected ? 'Desmarcar cliente' : 'Selecionar cliente'}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(c.id)}
                              className="w-4 h-4 text-rose-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-rose-500 cursor-pointer transition-all"
                              aria-label={`Selecionar ${c.name}`}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de Ações em Lote Flutuante */}
      <CustomerBatchActionBar
        selectedCount={selectedCustomerIds.length}
        onClearSelection={() => setSelectedCustomerIds([])}
        onCopyContacts={handleCopyContacts}
        onDelete={handleTriggerBatchDelete}
      />

      {/* Gaveta Lateral de Edição Rápida */}
      <CustomerEditDrawer
        customer={editingCustomer}
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSave={handleSaveEditedCustomer}
        onDelete={(id) => handleTriggerSingleDelete(id)}
      />

      {/* Modal: Novo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cadastrar Novo Cliente
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF / Documento
                  </label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mariana@gmail.com"
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço / Bairro (opcional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Palmeiras, 120 - Jardim América"
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações / Preferências
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Prefere paleta candy color, festa de 1 ano, indicação da Luiza..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemNames={deleteTargetNames}
        entityLabel="Cliente"
      />

      {/* Modal de Importação de Contatos */}
      <ImportCustomersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(count) => {
          setCustomers(store.getCustomers());
          showNotification(`${count} cliente(s) importado(s) com sucesso para o cadastro!`);
        }}
      />

      {/* Modal de Exportação de Contatos */}
      <ExportCustomersModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        customers={customers}
        rentals={rentals}
        onNotify={showNotification}
      />

      {/* Modal de Criação de Orçamento para o Cliente */}
      <OrcamentoModal
        isOpen={isOrcamentoModalOpen}
        onClose={() => {
          setIsOrcamentoModalOpen(false);
          setSelectedCustomerForOrcamento(null);
        }}
        initialCustomerName={selectedCustomerForOrcamento?.name || ''}
        initialCustomerPhone={selectedCustomerForOrcamento?.phone || ''}
        initialLocation={selectedCustomerForOrcamento?.address || ''}
        initialNotes={selectedCustomerForOrcamento?.notes || ''}
      />
    </div>
  );
}
