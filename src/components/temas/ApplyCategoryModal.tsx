'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Plus, CheckCircle2, Tag, Layers } from 'lucide-react';
import { Category } from '@/types/database';
import { store } from '@/lib/store';

interface ApplyCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedThemeIds: string[];
  themeNames: string[];
  categories: Category[];
  onApplied: (msg: string) => void;
}

export function ApplyCategoryModal({
  isOpen,
  onClose,
  selectedThemeIds,
  themeNames,
  categories,
  onApplied,
}: ApplyCategoryModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedThemeIds.length === 0) return;

    setIsSubmitting(true);
    try {
      let finalCategoryId: string | null = selectedCategoryId || null;

      if (isCreatingNew && newCategoryName.trim()) {
        const created = store.createCategory(newCategoryName.trim());
        finalCategoryId = created.id;
      }

      const tagsArray = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const count = store.applyCategoryToThemes(selectedThemeIds, finalCategoryId, tagsArray);

      const catName = isCreatingNew
        ? newCategoryName.trim()
        : categories.find((c) => c.id === finalCategoryId)?.name || 'Categoria';

      onApplied(`Categoria "${catName}" aplicada a ${count} tema(s) com sucesso!`);
      onClose();
      // Reset
      setSelectedCategoryId('');
      setIsCreatingNew(false);
      setNewCategoryName('');
      setTagsInput('');
    } catch (err: any) {
      alert(err.message || 'Erro ao aplicar categoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Aplicar Categoria e Tags
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedThemeIds.length} tema(s) selecionado(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected themes list preview */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 max-h-24 overflow-y-auto space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Temas que receberão a alteração:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {themeNames.map((name, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-xs"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Seletor ou Criação de Categoria */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Categoria de Destino *
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNew(!isCreatingNew)}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {isCreatingNew ? 'Escolher existente' : '+ Criar nova categoria'}
              </button>
            </div>

            {isCreatingNew ? (
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nome da nova categoria (ex: Temas de Verão, Jogos...)"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
                />
              </div>
            ) : (
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-semibold cursor-pointer"
              >
                <option value="">Selecione uma categoria...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Adicionar Tags / Personagens adicionais em lote */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Incluir Tags / Personagens adicionais (opcional)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex: Meninos, Heróis, Aventura (separados por vírgula)"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 block">
              Estas tags serão somadas às tags já existentes nos temas selecionados sem duplicá-las.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!selectedCategoryId && (!isCreatingNew || !newCategoryName.trim()))}
              className="px-4 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aplicar para {selectedThemeIds.length} tema(s)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
