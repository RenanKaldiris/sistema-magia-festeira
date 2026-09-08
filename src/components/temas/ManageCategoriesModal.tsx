'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Check, Tag, AlertCircle } from 'lucide-react';
import { Category } from '@/types/database';
import { store } from '@/lib/store';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ManageCategoriesModal({
  isOpen,
  onClose,
  onSuccess,
}: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCategories = () => {
    setCategories(store.getCategories());
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setErrorMsg(null);
      setEditingId(null);
      setDeleteConfirmId(null);
      setNewCatName('');
      setNewCatDesc('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setErrorMsg('Informe o nome da categoria.');
      return;
    }

    try {
      store.createCategory(newCatName.trim(), newCatDesc.trim() || undefined);
      setNewCatName('');
      setNewCatDesc('');
      setErrorMsg(null);
      loadCategories();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao adicionar categoria.');
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
    setDeleteConfirmId(null);
    setErrorMsg(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      setErrorMsg('O nome da categoria não pode ficar vazio.');
      return;
    }

    try {
      store.updateCategory(id, {
        name: editName.trim(),
        description: editDesc.trim() || null,
      });
      setEditingId(null);
      setErrorMsg(null);
      loadCategories();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar categoria.');
    }
  };

  const handleDeleteCategory = (id: string) => {
    try {
      store.deleteCategory(id);
      setDeleteConfirmId(null);
      setErrorMsg(null);
      loadCategories();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir categoria.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Gerenciar Categorias
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Crie, edite ou remova categorias do catálogo e estoque
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form: Add new category */}
          <form onSubmit={handleAddCategory} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-pink-500" />
              Nova Categoria
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nome da categoria *"
                className="px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Descrição breve (opcional)"
                className="px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium text-xs rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 ml-auto"
            >
              <Plus className="w-4 h-4" />
              Adicionar Categoria
            </button>
          </form>

          {/* List of current categories */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Categorias Existentes ({categories.length})
            </h3>

            {categories.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-sm">
                Nenhuma categoria cadastrada.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                {categories.map((cat) => {
                  const isEditing = editingId === cat.id;
                  const isConfirmingDelete = deleteConfirmId === cat.id;

                  if (isEditing) {
                    return (
                      <div key={cat.id} className="p-3 bg-pink-50/50 dark:bg-pink-950/20 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nome"
                            className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Descrição"
                            className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat.id)}
                            className="px-3 py-1 text-xs bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Salvar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            /{cat.slug}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/50 p-1 rounded-lg border border-red-200 dark:border-red-900/60">
                            <span className="text-[11px] font-medium text-red-600 dark:text-red-400 px-1">
                              Excluir?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded"
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] rounded"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                              title="Editar categoria"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(cat.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                              title="Excluir categoria"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
