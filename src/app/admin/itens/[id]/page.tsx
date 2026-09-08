'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Star,
  Check,
  Package,
  Settings,
  DollarSign,
  Percent,
} from 'lucide-react';
import { Item, Media } from '@/types/database';
import { store } from '@/lib/store';
import { uploadImageToServer, convertImageToWebP, isHeicFile, getFallbackImageDataUrl } from '@/lib/imageUtils';
import { ManageCategoriesModal } from '@/components/temas/ManageCategoriesModal';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ItemEditPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const itemId = resolvedParams.id;
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [quantityTotal, setQuantityTotal] = useState<number>(1);
  const [quantityAvailable, setQuantityAvailable] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number | string>(45.0);
  const [promotionalPrice, setPromotionalPrice] = useState<number | string>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    const found = store.getItemById(itemId);
    if (!found) return;

    setItem(found);
    setName(found.name || '');
    setCode(found.code || '');
    setCategory(found.category || '');
    setDescription(found.description || '');
    setQuantityTotal(found.quantity_total || 1);
    setQuantityAvailable(found.quantity_available || 1);
    setUnitPrice(found.unit_price !== undefined ? found.unit_price : 45.0);
    setPromotionalPrice(
      found.promotional_price !== null && found.promotional_price !== undefined ? found.promotional_price : ''
    );
    setStatus(found.status || 'active');

    setMediaList(store.getMediaByEntity('item', found.id));
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = store.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [itemId]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  if (!item) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Item não encontrado
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          O item solicitado não existe ou foi removido do estoque.
        </p>
        <button
          type="button"
          onClick={() => router.push('/admin/temas')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Estoque
        </button>
      </div>
    );
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      showNotification('O nome do item é obrigatório.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      store.updateItem(item.id, {
        name: name.trim(),
        code: code.trim() || item.code,
        category: category.trim() || null,
        description: description.trim() || null,
        quantity_total: Number(quantityTotal) || 1,
        quantity_available: Number(quantityAvailable) || 1,
        unit_price: Number(unitPrice) || 0,
        promotional_price: promotionalPrice !== '' ? Number(promotionalPrice) : null,
        status,
      });
      showNotification('Item atualizado com sucesso!');
    } catch (err: any) {
      showNotification(err.message || 'Erro ao salvar item.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    if (e.target) e.target.value = '';

    fileArray.forEach(async (rawFile) => {
      const isHeic = isHeicFile(rawFile);
      const instantPreview = isHeic
        ? getFallbackImageDataUrl(rawFile.name)
        : URL.createObjectURL(rawFile);
      const isFirst = mediaList.length === 0;
      const mediaId = 'item-media-' + Math.random().toString(36).substring(2, 12);

      const tempMedia: Media = {
        id: mediaId,
        tenant_id: item.tenant_id,
        entity_type: 'item',
        entity_id: item.id,
        storage_path: instantPreview,
        original_name: rawFile.name,
        mime_type: 'image/webp',
        file_size: rawFile.size,
        fingerprint: `sha256-item-${item.id.substring(0, 6)}-${Date.now()}`,
        sort_order: mediaList.length + 1,
        is_primary: isFirst,
        created_at: new Date().toISOString(),
      };

      setMediaList((prev) => [...prev, tempMedia]);

      try {
        const uploaded = await uploadImageToServer(rawFile);
        const webpMedia: Media = {
          ...tempMedia,
          storage_path: uploaded.url,
          original_name: uploaded.fileName,
          mime_type: 'image/webp',
          file_size: uploaded.size,
        };
        store.addMediaToEntity(webpMedia);
        setMediaList(store.getMediaByEntity('item', item.id));
        showNotification(`Foto "${uploaded.fileName}" convertida para WebP (60%) e salva.`);
      } catch (err) {
        console.warn('Fallback para conversão local:', err);
        try {
          const { file: webpFile, dataUrl } = await convertImageToWebP(rawFile, 0.60);
          const webpMedia: Media = {
            ...tempMedia,
            storage_path: dataUrl,
            original_name: webpFile.name,
            mime_type: 'image/webp',
            file_size: webpFile.size,
          };
          store.addMediaToEntity(webpMedia);
          setMediaList(store.getMediaByEntity('item', item.id));
          showNotification(`Foto "${webpFile.name}" salva.`);
        } catch {
          showNotification('Erro ao processar imagem.', 'error');
        }
      }
    });
  };

  const handleSetPrimaryMedia = (mediaId: string) => {
    store.setPrimaryMedia('item', item.id, mediaId);
    setMediaList(store.getMediaByEntity('item', item.id));
    showNotification('Foto principal definida.');
  };

  const handleDeleteMedia = (mediaId: string) => {
    store.deleteMedia(mediaId);
    setMediaList(store.getMediaByEntity('item', item.id));
    showNotification('Foto removida.');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/temas')}
              className="p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Itens</span>
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-pink-600 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md">
                {item.code}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[240px] sm:max-w-md">
                {item.name}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {notification && (
        <div
          className={`fixed top-16 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Dados do Item */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Dados da Peça / Item
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nome da Peça *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Código SKU
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Categoria
                </label>
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(true)}
                  className="text-xs text-pink-600 hover:underline font-medium"
                >
                  Gerenciar
                </button>
              </div>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Mobília, Displays, Painéis..."
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Estoque Total
              </label>
              <input
                type="number"
                min="0"
                value={quantityTotal}
                onChange={(e) => setQuantityTotal(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Estoque Disponível
              </label>
              <input
                type="number"
                min="0"
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Preço Unitário de Locação (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Preço Promocional (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={promotionalPrice}
                onChange={(e) => setPromotionalPrice(e.target.value)}
                placeholder="R$ sem desconto"
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Status no Estoque
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="active">Ativo / Disponível</option>
                <option value="inactive">Inativo / Em Manutenção</option>
              </select>
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Descrição e Especificações
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Material MDF laqueado branco, medidas 90x40x80cm, acompanha parafusos borboleta..."
                className="w-full p-3 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

        {/* Fotos do Item */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Fotos da Peça ({mediaList.length})
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Fotos convertidas para .WEBP (60%) para carregamento ultrarrápido
              </p>
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadPhoto}
                multiple
                accept="image/*,.heic,.heif"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Adicionar Fotos</span>
              </button>
            </div>
          </div>

          {mediaList.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 text-xs">
              Nenhuma foto cadastrada para esta peça de acervo.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {mediaList.map((media) => (
                <div
                  key={media.id}
                  className="group relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex flex-col"
                >
                  <div className="aspect-square relative w-full overflow-hidden">
                    <Image
                      src={media.storage_path}
                      alt={media.original_name || 'Foto da peça'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {media.is_primary && (
                      <span className="absolute top-2 left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                        Capa
                      </span>
                    )}
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-900 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                    {!media.is_primary ? (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryMedia(media.id)}
                        className="text-[11px] font-semibold text-zinc-500 hover:text-pink-600 transition"
                      >
                        Definir Capa
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-pink-600">Principal</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(media.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Categorias */}
      <ManageCategoriesModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
      />
    </div>
  );
}
