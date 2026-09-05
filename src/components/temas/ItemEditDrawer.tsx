'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Package2,
  CheckCircle2,
  Trash2,
  UploadCloud,
  FolderPlus,
  Link2,
  Smartphone,
} from 'lucide-react';
import { Item, Media } from '@/types/database';
import { store } from '@/lib/store';
import { fileToDataUrl, convertImageToWebP, getFallbackImageDataUrl } from '@/lib/imageUtils';

interface ItemEditDrawerProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Item) => void;
}

export function ItemEditDrawer({
  item,
  isOpen,
  onClose,
  onSave,
}: ItemEditDrawerProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Mobília');
  const [quantityTotal, setQuantityTotal] = useState<number>(1);
  const [quantityAvailable, setQuantityAvailable] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Media Gallery State
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshMedia = (itemId: string) => {
    setMediaList(store.getMediaByEntity('item', itemId));
  };

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.category || 'Mobília');
      setQuantityTotal(item.quantity_total || 1);
      setQuantityAvailable(item.quantity_available !== undefined ? item.quantity_available : item.quantity_total);
      setUnitPrice(item.unit_price || 0);
      setStatus(item.status === 'inactive' ? 'inactive' : 'active');
      setDescription(item.description || '');
      refreshMedia(item.id);
    }
  }, [item]);

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

  if (!isOpen || !item) return null;

  // File Upload Handler (Device & Gallery)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    if (e.target) {
      e.target.value = '';
    }

    files.forEach(async (file) => {
      const instantPreview = URL.createObjectURL(file);
      const isFirst = mediaList.length === 0;

      try {
        const { file: webpFile, dataUrl: webpDataUrl } = await convertImageToWebP(file, 0.70);
        store.addMediaToEntity({
          entity_type: 'item',
          entity_id: item.id,
          storage_path: webpDataUrl,
          original_name: webpFile.name,
          mime_type: 'image/webp',
          file_size: webpFile.size,
          fingerprint: `sha256-item-${item.id.substring(0, 6)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          is_primary: isFirst,
          ai_tags: [item.name, category],
        });
        refreshMedia(item.id);
        showNotification(`Foto "${webpFile.name}" convertida para .WEBP (70%) e anexada com sucesso!`);
      } catch {
        const permanent = await fileToDataUrl(file);
        store.addMediaToEntity({
          entity_type: 'item',
          entity_id: item.id,
          storage_path: permanent || instantPreview,
          original_name: file.name,
          mime_type: 'image/webp',
          file_size: file.size,
          fingerprint: `sha256-item-${item.id.substring(0, 6)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          is_primary: isFirst,
          ai_tags: [item.name, category],
        });
        refreshMedia(item.id);
        showNotification('Foto anexada com sucesso!');
      }
    });
  };

  // Google Drive Add
  const handleAddDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrlInput.trim()) return;

    const isFirst = mediaList.length === 0;
    store.addMediaToEntity({
      entity_type: 'item',
      entity_id: item.id,
      storage_path: driveUrlInput.trim(),
      original_name: 'Google Drive Asset',
      mime_type: 'image/jpeg',
      file_size: 400000,
      fingerprint: `sha256-item-drive-${Date.now()}`,
      is_primary: isFirst,
      ai_tags: [item.name, category],
    });

    setDriveUrlInput('');
    setIsDriveModalOpen(false);
    refreshMedia(item.id);
    showNotification('Link do Google Drive associado ao item!');
  };

  const handleSetPrimary = (mediaId: string) => {
    store.setPrimaryMedia('item', item.id, mediaId);
    refreshMedia(item.id);
    showNotification('Capa do item atualizada com sucesso!');
  };

  const handleDeleteMedia = (mediaId: string) => {
    store.deleteMedia(mediaId);
    refreshMedia(item.id);
    showNotification('Foto removida do acervo.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const updated = store.updateItem(item.id, {
        name: name.trim(),
        category,
        quantity_total: Number(quantityTotal),
        quantity_available: Math.min(Number(quantityAvailable), Number(quantityTotal)),
        unit_price: Number(unitPrice),
        status,
        description: description.trim() || null,
      });

      onSave(updated);
      onClose();
    } catch (err) {
      console.error('[UpdateItem Error]', err);
      showNotification('Erro ao salvar item.');
    } finally {
      setIsSaving(false);
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
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-250">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Package2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Edição Rápida de Item
                </h3>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 block">
                  {item.code}
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
            {/* Operational Status (Ativo / Inativo) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Status Operacional no Estoque
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    status === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300" />
                  <span>Ativo / Em linha</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    status === 'inactive'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Inativo</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Peça *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Mobília">Mobília</option>
                  <option value="Painéis">Painéis</option>
                  <option value="Displays">Displays</option>
                  <option value="Cenografia">Cenografia</option>
                  <option value="Pisos">Pisos</option>
                  <option value="Louças">Louças</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preço Unitário (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quantities (Total vs Available) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estoque Total *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantityTotal}
                  onChange={(e) => setQuantityTotal(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estoque Disponível *
                </label>
                <input
                  type="number"
                  min="0"
                  max={quantityTotal}
                  required
                  value={quantityAvailable}
                  onChange={(e) => setQuantityAvailable(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observações / Detalhes do Acervo
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dimensões, material, estado de conservação..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Photos & Media Management */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Fotos Associadas ({mediaList.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Clique na foto para definir como Capa
                </span>
              </div>

              {/* Upload Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.heic,.heif,.HEIC,.HEIF"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-rose-500" />
                  <span>Do Dispositivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(!isDriveModalOpen)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <Link2 className="w-4 h-4 text-blue-500" />
                  <span>Google Drive</span>
                </button>

                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.heic,.heif,.HEIC,.HEIF"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Da Galeria</span>
                </button>
              </div>

              {/* Google Drive Sub-modal */}
              {isDriveModalOpen && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                    Inserir Link do Google Drive:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={driveUrlInput}
                      onChange={(e) => setDriveUrlInput(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="flex-1 px-3 py-1.5 border border-blue-300 dark:border-blue-800 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddDrive}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              )}

              {/* Media Thumbnails Grid */}
              {mediaList.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                  {mediaList.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSetPrimary(m.id)}
                      className={`relative group rounded-xl overflow-hidden border aspect-square bg-slate-100 dark:bg-slate-800 cursor-pointer ${
                        m.is_primary
                          ? 'border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900/60'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                      title={m.is_primary ? 'Foto de Capa' : 'Clique para definir como Capa'}
                    >
                      <img
                        src={m.storage_path}
                        alt={m.original_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImageDataUrl(m.original_name);
                        }}
                      />
                      {m.is_primary && (
                        <span className="absolute bottom-1 left-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          Capa
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMedia(m.id);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
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
          </form>
        </div>
      </div>
    </div>
  );
}
