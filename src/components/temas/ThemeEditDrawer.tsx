'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Trash2,
  Star,
  UploadCloud,
  FolderPlus,
  Link2,
  Smartphone,
} from 'lucide-react';
import { Theme, EntityStatus, Media } from '@/types/database';
import { store, DEFAULT_THEME_DESCRIPTION } from '@/lib/store';
import { fileToDataUrl, convertHeicToJpeg, convertImageToWebP, getFallbackImageDataUrl, isHeicFile } from '@/lib/imageUtils';

interface ThemeEditDrawerProps {
  theme: (Theme & { imageUrl?: string }) | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Theme) => void;
  isPreApproval?: boolean;
  onApprove?: (themeData: {
    name: string;
    base_price: number;
    stock_quantity: number;
    characters: string[];
    description: string;
    imageUrl?: string;
  }) => void;
}

export function ThemeEditDrawer({
  theme,
  isOpen,
  onClose,
  onSave,
  isPreApproval = false,
  onApprove,
}: ThemeEditDrawerProps) {
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState<number | string>(179.9);
  const [stockQuantity, setStockQuantity] = useState<number>(1);
  const [characters, setCharacters] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EntityStatus>('active');
  const [featured, setFeatured] = useState(false);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sub-modal do Google Drive
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveUrlInput, setDriveUrlInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const refreshMedia = (themeId: string) => {
    const list = store.getMediaByEntity('theme', themeId);
    setMediaList(list);
  };

  useEffect(() => {
    if (theme) {
      setName(theme.name || '');
      setBasePrice(theme.base_price !== undefined ? theme.base_price : 179.9);
      setStockQuantity(theme.stock_quantity || 1);
      setCharacters(theme.characters?.join(', ') || '');
      setDescription(theme.description || DEFAULT_THEME_DESCRIPTION);
      setStatus(theme.status || 'active');
      setFeatured(!!theme.featured);

      if (isPreApproval) {
        // Modo pré-aprovação: inicializa media list com a foto original se houver
        if (theme.imageUrl) {
          setMediaList([
            {
              id: 'pre-media-1',
              tenant_id: 'a0000000-0000-0000-0000-000000000001',
              entity_type: 'theme',
              entity_id: theme.id,
              storage_path: theme.imageUrl,
              original_name: `${theme.name || 'foto'}_capa.jpg`,
              mime_type: 'image/jpeg',
              file_size: 450000,
              fingerprint: `pre-${Date.now()}`,
              sort_order: 1,
              is_primary: true,
              ai_tags: theme.characters || [],
              created_at: new Date().toISOString(),
            },
          ]);
        } else {
          setMediaList([]);
        }
      } else {
        refreshMedia(theme.id);
      }
    }
  }, [theme, isPreApproval]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

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

  if (!isOpen || !theme) return null;

  // File Upload Handler (Device & Gallery)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    if (e.target) {
      e.target.value = '';
    }

    files.forEach(async (rawFile) => {
      const isHeic = isHeicFile(rawFile);
      const instantPreview = isHeic
        ? getFallbackImageDataUrl(rawFile.name)
        : URL.createObjectURL(rawFile);
      const isFirst = mediaList.length === 0;
      const mediaId = '20000000-' + Math.random().toString(36).substring(2, 14);

      const tempMedia: Media = {
        id: mediaId,
        tenant_id: 'a0000000-0000-0000-0000-000000000001',
        entity_type: 'theme',
        entity_id: theme.id,
        storage_path: instantPreview,
        original_name: rawFile.name,
        mime_type: 'image/webp',
        file_size: rawFile.size,
        fingerprint: `sha256-${theme.id.substring(0, 6)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sort_order: mediaList.length + 1,
        is_primary: isFirst,
        ai_tags: characters.split(',').map((c) => c.trim()).filter(Boolean),
        created_at: new Date().toISOString(),
      };

      if (isPreApproval) {
        setMediaList((prev) => [...prev, tempMedia]);
      }

      // Converte mandatória e automaticamente qualquer foto para .WEBP com 70% de qualidade
      try {
        const { file: webpFile, dataUrl: webpDataUrl } = await convertImageToWebP(rawFile, 0.70);
        const webpMedia: Media = {
          ...tempMedia,
          storage_path: webpDataUrl,
          original_name: webpFile.name,
          mime_type: 'image/webp',
          file_size: webpFile.size,
        };

        setMediaList((prev) =>
          prev.map((m) => (m.id === mediaId ? webpMedia : m))
        );

        if (!isPreApproval) {
          store.addMediaToEntity({
            ...webpMedia,
            storage_path: webpDataUrl,
            original_name: webpFile.name,
            mime_type: 'image/webp',
          });
          refreshMedia(theme.id);
        }
        showNotification(`Foto "${webpFile.name}" convertida para .WEBP (70%) e vinculada ao tema.`);
      } catch (err) {
        console.warn('Erro ao converter para WebP, aplicando fallback:', err);
        const file = await convertHeicToJpeg(rawFile);
        const permanentUrl = await fileToDataUrl(file);
        if (permanentUrl) {
          setMediaList((prev) =>
            prev.map((m) => (m.id === mediaId ? { ...m, storage_path: permanentUrl, mime_type: 'image/webp' } : m))
          );
          if (!isPreApproval) {
            store.addMediaToEntity({
              ...tempMedia,
              storage_path: permanentUrl,
              original_name: file.name,
              mime_type: 'image/webp',
            });
            refreshMedia(theme.id);
          }
        }
      }
    });
  };

  // Google Drive Add Handler
  const handleAddDriveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrlInput.trim()) return;

    const isFirst = mediaList.length === 0;
    const newMedia: Media = {
      id: '20000000-' + Math.random().toString(36).substring(2, 14),
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      entity_type: 'theme',
      entity_id: theme.id,
      storage_path: driveUrlInput.trim(),
      original_name: `drive_photo_${Date.now()}.jpg`,
      mime_type: 'image/jpeg',
      file_size: 500000,
      fingerprint: `sha256-drive-${theme.id.substring(0, 6)}-${Date.now()}`,
      sort_order: mediaList.length + 1,
      is_primary: isFirst,
      ai_tags: characters.split(',').map((c) => c.trim()).filter(Boolean),
      created_at: new Date().toISOString(),
    };

    if (isPreApproval) {
      setMediaList((prev) => [...prev, newMedia]);
    } else {
      store.addMediaToEntity(newMedia);
      refreshMedia(theme.id);
    }

    setDriveUrlInput('');
    setIsDriveModalOpen(false);
    showNotification('Foto do Google Drive adicionada ao tema.');
  };

  // Set Primary Image
  const handleSetPrimary = (mediaId: string) => {
    if (isPreApproval) {
      setMediaList((prev) =>
        prev.map((m) => ({
          ...m,
          is_primary: m.id === mediaId,
        }))
      );
    } else {
      store.setPrimaryMedia('theme', theme.id, mediaId);
      refreshMedia(theme.id);
    }
    showNotification('Foto definida como capa principal!');
  };

  // Delete Media
  const handleDeleteMedia = (mediaId: string) => {
    if (isPreApproval) {
      setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
    } else {
      store.deleteMedia(mediaId);
      refreshMedia(theme.id);
    }
    showNotification('Foto removida do tema.');
  };

  // Submit Changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const charsArray = characters
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const primary = mediaList.find((m) => m.is_primary) || mediaList[0];

      if (isPreApproval) {
        onSave({
          ...theme,
          name: name.trim(),
          base_price: Number(basePrice) || 179.9,
          stock_quantity: Number(stockQuantity) || 1,
          characters: charsArray,
          description: description.trim() || DEFAULT_THEME_DESCRIPTION,
          status: status === 'inactive' ? 'inactive' : 'active',
          featured,
          imageUrl: primary?.storage_path || (theme as any).imageUrl,
        } as any);
        showNotification('Alterações na fila de revisão salvas com sucesso!');
        setTimeout(() => onClose(), 400);
        return;
      }

      const updated = store.updateTheme(theme.id, {
        name: name.trim(),
        base_price: Number(basePrice),
        stock_quantity: Number(stockQuantity),
        characters: charsArray,
        description: description.trim() || DEFAULT_THEME_DESCRIPTION,
        status: status === 'inactive' ? 'inactive' : 'active',
        featured,
        imageUrl: primary?.storage_path,
      });

      onSave(updated);
    } catch (err) {
      console.error('[Error updating theme]', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveAction = () => {
    if (!name.trim()) return;
    setIsSaving(true);
    const charsArray = characters
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const primary = mediaList.find((m) => m.is_primary) || mediaList[0];

    if (onApprove) {
      onApprove({
        name: name.trim(),
        base_price: Number(basePrice) || 179.9,
        stock_quantity: Number(stockQuantity) || 1,
        characters: charsArray,
        description: description.trim() || DEFAULT_THEME_DESCRIPTION,
        imageUrl: primary?.storage_path || (theme as any).imageUrl,
      });
    }
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-rose-600 text-white text-[10px] font-bold">
                  {theme.code || 'MF-NOVO'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isPreApproval
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                      : status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                  }`}
                >
                  {isPreApproval
                    ? 'Aguardando Aprovação'
                    : status === 'active'
                    ? 'Ativo no Catálogo'
                    : 'Inativo (Oculto)'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1 truncate max-w-[320px]">
                {theme.name || 'Tema Sem Nome'}
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                {isPreApproval
                  ? 'Revisão Pré-Aprovação: ajuste dados e fotos antes de publicar'
                  : 'Edição Rápida de Tema & Acervo'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar gaveta de edição"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {notification && (
            <div className="mx-5 mt-4 p-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
            {/* Gestão de Fotos do Tema */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  Foto de Capa do Tema & Galeria ({mediaList.length})
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Defina a capa principal ou adicione mais fotos
                </span>
              </div>

              {/* Botões de Upload Múltiplo */}
              <div className="grid grid-cols-3 gap-2">
                {/* Dispositivo */}
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

                {/* Google Drive */}
                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(true)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <Link2 className="w-4 h-4 text-blue-500" />
                  <span>Google Drive</span>
                </button>

                {/* Galeria */}
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

              {/* Modal Google Drive */}
              {isDriveModalOpen && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                    Adicionar Imagem do Google Drive:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={driveUrlInput}
                      onChange={(e) => setDriveUrlInput(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="flex-1 px-3 py-1.5 border border-blue-300 dark:border-blue-800 rounded-xl bg-white dark:bg-slate-900 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddDriveUrl}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
                    >
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDriveModalOpen(false)}
                      className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Grade de Fotos do Tema */}
              {mediaList.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                  Nenhuma foto cadastrada para este tema. Carregue fotos pelos botões acima.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {mediaList.map((media) => (
                    <div
                      key={media.id}
                      className={`relative group rounded-xl overflow-hidden border-2 aspect-square bg-slate-100 dark:bg-slate-800 ${
                        media.is_primary
                          ? 'border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900/60'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <img
                        src={media.storage_path}
                        alt={media.original_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImageDataUrl(media.original_name);
                        }}
                      />

                      {/* Capa Principal Badge */}
                      {media.is_primary && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold flex items-center gap-0.5 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Capa</span>
                        </div>
                      )}

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        {!media.is_primary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(media.id)}
                            className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white text-[10px] font-bold shadow-xs"
                            title="Definir como capa principal"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(media.id)}
                          className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs"
                          title="Excluir esta foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nome do Tema */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Tema *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Safari Baby, Barbie Princesa"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Preço e Estoque */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preço Base (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estoque (un.) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Personagens / Tags */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Personagens / Tags (separados por vírgula)
              </label>
              <input
                type="text"
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                placeholder="Ex: Leãozinho, Girafa, Elefante"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Status Operacional & Destaque (APENAS ATIVO E INATIVO) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Operacional *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EntityStatus)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="active">Ativo (Visível no Catálogo)</option>
                  <option value="inactive">Inativo (Oculto do Catálogo)</option>
                </select>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                  {status === 'active'
                    ? 'O tema está publicado e disponível para os clientes.'
                    : 'O tema fica oculto do catálogo público imediatamente.'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destaque no Catálogo
                </label>
                <button
                  type="button"
                  onClick={() => setFeatured(!featured)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    featured
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{featured ? 'Em Destaque' : 'Padrão'}</span>
                </button>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Legenda / Itens Inclusos
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={DEFAULT_THEME_DESCRIPTION}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs leading-relaxed"
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
                Se não informado, será preenchido automaticamente com a lista padrão de itens inclusos.
              </span>
            </div>

            {/* Footer Buttons inside drawer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Cancelar
              </button>

              {isPreApproval && onApprove ? (
                <>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-xl font-semibold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer text-xs sm:text-sm"
                  >
                    <Save className="w-4 h-4 text-slate-500" />
                    <span>Salvar na Fila</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveAction}
                    disabled={isSaving}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer text-xs sm:text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprovar & Publicar no Catálogo</span>
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
