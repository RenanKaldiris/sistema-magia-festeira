'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  Calendar,
  CheckCircle2,
  Trash2,
  MessageCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Customer, RentalWithDetails } from '@/types/database';
import { store } from '@/lib/store';
import { formatDateBR } from '@/lib/dateUtils';

interface CustomerEditDrawerProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Customer) => void;
  onDelete?: (customerId: string) => void;
}

export function CustomerEditDrawer({
  customer,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: CustomerEditDrawerProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Histórico de Locações do Cliente
  const [customerRentals, setCustomerRentals] = useState<RentalWithDetails[]>([]);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setDocument(customer.document || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');

      // Carrega histórico de locações associadas
      const allRentals = store.getRentals();
      const filtered = allRentals.filter((r) => r.customer_id === customer.id);
      setCustomerRentals(filtered);
    }
  }, [customer]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  if (!isOpen || !customer) return null;

  const rawPhone = phone.replace(/\D/g, '');
  const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

  // Avatar initials
  const initials = customer.name
    ? customer.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('')
    : 'CL';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSaving(true);
    try {
      const updated = store.updateCustomer(customer.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        document: document.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      });

      onSave(updated);
      showNotification('Dados do cliente atualizados com sucesso!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('[UpdateCustomer Error]', err);
      showNotification('Erro ao salvar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reservado':
        return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50';
      case 'alugado':
        return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50';
      case 'devolvido':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'cancelado':
        return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-250">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-sm flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate max-w-[230px] sm:max-w-[280px]">
                  {customer.name}
                </h3>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">
                  {customerRentals.length}{' '}
                  {customerRentals.length === 1 ? 'locação registrada' : 'locações registradas'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar gaveta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Notification */}
          {notification && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Seção 1: Dados Pessoais & Contato */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                <User className="w-4 h-4 text-rose-500" />
                <span>Dados Pessoais & Contato</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    CPF / Documento
                  </label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Botão de Atalho do WhatsApp */}
              {rawPhone.length >= 8 && (
                <div className="pt-1">
                  <a
                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                      `Olá, ${name || customer.name}! Tudo bem? Falamos da Magia Festeira decorações.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Iniciar conversa no WhatsApp ({phone})</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Seção 2: Localização & Endereço */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Endereço & Entrega</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Endereço / Bairro / Cidade
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 120 - Jardim América"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Seção 3: Observações & Preferências */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                <FileText className="w-4 h-4 text-purple-500" />
                <span>Observações & Preferências</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Preferências de Festas / Notas Internas
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Mãe da Sophia (3 anos), prefere tons candy colors, indicação da cliente Luiza..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Seção 4: Histórico de Locações */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>Histórico de Locações</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {customerRentals.length} {customerRentals.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              {customerRentals.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  Nenhuma locação registrada até o momento para este cliente.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customerRentals.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{r.theme?.name || 'Tema Personalizado'}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                            Data: {formatDateBR(r.event_date)}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                            r.status
                          )}`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          Total: R$ {r.total.toFixed(2).replace('.', ',')}
                        </span>
                        {r.balance > 0 ? (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            Pendente: R$ {r.balance.toFixed(2).replace('.', ',')}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Quitado ✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(customer.id)}
                  className="px-3.5 py-2.5 rounded-xl font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Excluir cliente"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold shadow-xs text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
