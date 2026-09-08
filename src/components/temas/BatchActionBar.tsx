'use client';

import React from 'react';
import { Trash2, X, CheckSquare, Tag, Sparkles, TagIcon } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onApplyPromotion: () => void;
  onRemovePromotion: () => void;
  onGenerateCustomCatalog: () => void;
  itemTypeLabel?: string;
}

export function BatchActionBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onApplyPromotion,
  onRemovePromotion,
  onGenerateCustomCatalog,
  itemTypeLabel = 'selecionado(s)',
}: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <aside
      aria-label="Barra de ações em lote"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-3xl bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Selection counter & clear button */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-400 flex items-center justify-center shrink-0">
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
          <span>Desmarcar</span>
        </button>
      </div>

      {/* Action Buttons: Exactly 4 options */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
        {/* 1. Excluir */}
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title="Excluir selecionados"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Excluir</span>
        </button>

        {/* 2. Aplicar promoção */}
        <button
          type="button"
          onClick={onApplyPromotion}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          title="Aplicar desconto promocional em lote"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Aplicar promoção</span>
        </button>

        {/* 3. Remover promoção */}
        <button
          type="button"
          onClick={onRemovePromotion}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          title="Remover desconto promocional dos itens selecionados"
        >
          <TagIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>Remover promoção</span>
        </button>

        {/* 4. Gerar catálogo personalizado */}
        <button
          type="button"
          onClick={onGenerateCustomCatalog}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          title="Gerar catálogo personalizado com os itens selecionados"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gerar catálogo personalizado</span>
        </button>
      </div>
    </aside>
  );
}
