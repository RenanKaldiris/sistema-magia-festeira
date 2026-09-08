'use client';

import React from 'react';
import { FileText, Trash2, X, CheckSquare, Tag, Layers, Edit3 } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onGenerateQuote: () => void;
  onDelete: () => void;
  onApplyPromotion?: () => void;
  onAddVariant?: () => void;
  onEditTheme?: () => void;
  itemTypeLabel?: string;
}

export function BatchActionBar({
  selectedCount,
  onClearSelection,
  onGenerateQuote,
  onDelete,
  onApplyPromotion,
  onAddVariant,
  onEditTheme,
  itemTypeLabel = 'selecionado(s)',
}: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <aside
      aria-label="Barra de ações em lote"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl sm:rounded-full border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Selection counter & clear button */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap">
            {selectedCount} {itemTypeLabel}
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

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
        {/* Editar Tema (quando 1 item selecionado) */}
        {selectedCount === 1 && onEditTheme && (
          <button
            type="button"
            onClick={onEditTheme}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
            title="Editar dados e variáveis do tema selecionado"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Tema</span>
          </button>
        )}

        {/* Incluir Variável */}
        {onAddVariant && (
          <button
            type="button"
            onClick={onAddVariant}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
            title="Incluir variável/variação para o tema selecionado"
          >
            <Layers className="w-4 h-4" />
            <span>Incluir Variável</span>
          </button>
        )}

        {/* Aplicar Promoção */}
        {onApplyPromotion && (
          <button
            type="button"
            onClick={onApplyPromotion}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
            title="Aplicar desconto promocional em lote"
          >
            <Tag className="w-4 h-4" />
            <span>Aplicar Promoção</span>
          </button>
        )}

        {/* Gerar Orçamento */}
        <button
          type="button"
          onClick={onGenerateQuote}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-100 border border-slate-700 hover:border-slate-600 shadow-xs transition-colors cursor-pointer"
          title="Montar proposta de orçamento com os itens selecionados"
        >
          <FileText className="w-4 h-4 text-rose-400" />
          <span>Orçamento</span>
        </button>

        {/* Excluir Selecionados */}
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          title="Excluir selecionados"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir</span>
        </button>
      </div>
    </aside>
  );
}
