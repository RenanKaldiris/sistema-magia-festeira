'use client';

import React from 'react';
import { Copy, Trash2, X, CheckSquare, Users } from 'lucide-react';

interface CustomerBatchActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onCopyContacts: () => void;
  onDelete: () => void;
}

export function CustomerBatchActionBar({
  selectedCount,
  onClearSelection,
  onCopyContacts,
  onDelete,
}: CustomerBatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <aside
      aria-label="Barra de ações em lote de clientes"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl sm:rounded-full border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Contador de seleção e botão desmarcar */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap">
            {selectedCount} {selectedCount > 1 ? 'clientes selecionados' : 'cliente selecionado'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          title="Limpar seleção"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Desmarcar</span>
        </button>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Copiar Contatos / Disparo */}
        <button
          type="button"
          onClick={onCopyContacts}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-100 border border-slate-700 hover:border-slate-600 shadow-xs transition-colors cursor-pointer"
          title="Copiar lista de nomes e números de WhatsApp dos selecionados"
        >
          <Copy className="w-4 h-4 text-rose-400" />
          <span>Copiar Contatos</span>
        </button>

        {/* Excluir Selecionados */}
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          title="Excluir clientes selecionados"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir</span>
        </button>
      </div>
    </aside>
  );
}
