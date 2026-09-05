'use client';

import React from 'react';
import { Trash2, X, CheckSquare, CheckCircle2 } from 'lucide-react';
import { RentalStatus } from '@/types/database';

interface RentalBatchActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onUpdateStatus: (newStatus: RentalStatus) => void;
  onDelete: () => void;
}

export function RentalBatchActionBar({
  selectedCount,
  onClearSelection,
  onUpdateStatus,
  onDelete,
}: RentalBatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <aside
      aria-label="Barra de ações em lote de locações"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl sm:rounded-full border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Contador de seleção e botão desmarcar */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap">
            {selectedCount} {selectedCount > 1 ? 'locações selecionadas' : 'locação selecionada'}
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

      {/* Ações em Lote */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
        {/* Alterar Status em Lote */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateStatus('alugado')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors cursor-pointer"
            title="Marcar selecionadas como Alugado"
          >
            <span>Marcar Alugado</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateStatus('devolvido')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
            title="Marcar selecionadas como Devolvido"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Devolvido</span>
          </button>
        </div>

        {/* Excluir Selecionadas */}
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          title="Excluir locações selecionadas"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir</span>
        </button>
      </div>
    </aside>
  );
}
