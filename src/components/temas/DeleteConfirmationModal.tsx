'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  themeNames?: string[];
  itemNames?: string[];
  entityLabel?: string;
  isSubmitting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  themeNames = [],
  itemNames = [],
  entityLabel = 'Tema',
  isSubmitting = false,
}: DeleteConfirmationModalProps) {
  const names = themeNames.length > 0 ? themeNames : itemNames;
  const count = names.length;

  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMulti = count > 1;
  const canConfirm = !isMulti || confirmText.trim().toUpperCase() === 'EXCLUIR';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-delete-title"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 id="modal-delete-title" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Confirmar Exclusão {isMulti ? `em Lote (${count} ${entityLabel}s)` : `de ${entityLabel}`}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Tem certeza de que deseja excluir{' '}
            <strong className="text-rose-600 dark:text-rose-400">
              {count} {isMulti ? `${entityLabel.toLowerCase()}s selecionados` : `${entityLabel.toLowerCase()} selecionado`}
            </strong>
            ? Esta ação removerá permanentemente os registros e não pode ser desfeita.
          </p>
        </div>

        {/* Selected names list */}
        {count > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-32 overflow-y-auto space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              {entityLabel}s a serem excluídos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {names.map((name, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Typed Confirmation for Multiple Items (Exigência de Segurança 3.3) */}
        {isMulti && (
          <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200">
              Digite <span className="font-mono font-black text-rose-600 dark:text-rose-400">EXCLUIR</span> para habilitar a confirmação:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="EXCLUIR"
              className="w-full px-3 py-2 border border-amber-300 dark:border-amber-800/80 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold placeholder:font-normal uppercase tracking-wider focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || !canConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Excluindo...' : `Sim, Excluir (${count})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
