'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Image as ImageIcon,
  Tag,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Star,
  DollarSign,
  Percent,
  Check,
  Settings,
} from 'lucide-react';
import { Theme, Category, Media, ThemeVariant, Kit, EntityStatus, ThemeWithDetails } from '@/types/database';
import { store, DEFAULT_THEME_DESCRIPTION } from '@/lib/store';
import { uploadImageToServer, convertImageToWebP, isHeicFile, getFallbackImageDataUrl } from '@/lib/imageUtils';
import { ManageCategoriesModal } from '@/components/temas/ManageCategoriesModal';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ThemeEditPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const themeId = resolvedParams.id;
  const router = useRouter();

  const [theme, setTheme] = useState<ThemeWithDetails | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [variantsList, setVariantsList] = useState<ThemeVariant[]>([]);
  const [kitsList, setKitsList] = useState<Kit[]>([]);

  const [activeTab, setActiveTab] = useState<'dados' | 'fotos' | 'variaveis' | 'kits' | 'promocoes'>('dados');

  // Form Fields - Dados Gerais
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState<number | string>(179.9);
  const [stockQuantity, setStockQuantity] = useState<number>(1);
  const [characters, setCharacters] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EntityStatus>('active');
  const [featured, setFeatured] = useState(false);

  // Notifications & State
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  // New Variable State
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [varName, setVarName] = useState('');
  const [varDesc, setVarDesc] = useState('');
  const [varPhoto, setVarPhoto] = useState<{ file?: File; previewUrl: string; name: string } | null>(null);
  const [isSavingVariant, setIsSavingVariant] = useState(false);
  const varFileInputRef = useRef<HTMLInputElement>(null);

  // New Kit State
  const [isAddingKit, setIsAddingKit] = useState(false);
  const [editingKitId, setEditingKitId] = useState<string | null>(null);
  const [kitName, setKitName] = useState('');
  const [kitPrice, setKitPrice] = useState<number | string>('');
  const [kitPromoPrice, setKitPromoPrice] = useState<number | string>('');
  const [kitDesc, setKitDesc] = useState('');
  const [kitPhotoUrl, setKitPhotoUrl] = useState('');
  const [isSavingKit, setIsSavingKit] = useState(false);

  // Promotion State
  const [promoDiscountType, setPromoDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [promoDiscountValue, setPromoDiscountValue] = useState<number | string>('15');

  const galleryInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    const allThemes = store.getThemes();
    const found = allThemes.find((t) => t.id === themeId || t.slug === themeId || t.code === themeId);
    if (!found) {
      return;
    }

    setTheme(found);
    setName(found.name || '');
    setCategoryId(found.category_id || '');
    setBasePrice(found.base_price !== undefined ? found.base_price : 179.9);
    setStockQuantity(found.stock_quantity || 1);
    setCharacters(found.characters?.join(', ') || '');
    setDescription(found.description || DEFAULT_THEME_DESCRIPTION);
    setStatus(found.status || 'active');
    setFeatured(!!found.featured);

    setCategories(store.getCategories());
    setMediaList(store.getMediaByEntity('theme', found.id));
    setVariantsList(store.getThemeVariants(found.id));
    setKitsList(store.getKitsByTheme(found.id));
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = store.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [themeId]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  if (!theme) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Tema não encontrado
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          O tema solicitado não existe ou foi removido do catálogo.
        </p>
        <Link
          href="/admin/temas"
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Temas
        </Link>
      </div>
    );
  }

  // Save General Theme Data
  const handleSaveGeneral = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      showNotification('O nome do tema é obrigatório.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      store.updateTheme(theme.id, {
        name: name.trim(),
        category_id: categoryId || null,
        base_price: Number(basePrice) || 0,
        stock_quantity: Number(stockQuantity) || 1,
        characters: characters.split(',').map((c) => c.trim()).filter(Boolean),
        description: description.trim() || DEFAULT_THEME_DESCRIPTION,
        status,
        featured,
      });
      showNotification('Alterações salvas com sucesso!');
    } catch (err: any) {
      showNotification(err.message || 'Erro ao salvar tema.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Theme Photo (Mandatory WebP 60%)
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
      const mediaId = '20000000-' + Math.random().toString(36).substring(2, 14);

      const tempMedia: Media = {
        id: mediaId,
        tenant_id: theme.tenant_id,
        entity_type: 'theme',
        entity_id: theme.id,
        storage_path: instantPreview,
        original_name: rawFile.name,
        mime_type: 'image/webp',
        file_size: rawFile.size,
        fingerprint: `sha256-sub-${theme.id.substring(0, 6)}-${Date.now()}`,
        sort_order: mediaList.length + 1,
        is_primary: isFirst,
        ai_tags: characters.split(',').map((c) => c.trim()).filter(Boolean),
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
        setMediaList(store.getMediaByEntity('theme', theme.id));
        showNotification(`Foto "${uploaded.fileName}" convertida para WebP (60%) e salva.`);
      } catch (err) {
        console.warn('Fallback para conversão local WebP 60%:', err);
        try {
          const { file: webpFile, dataUrl: webpDataUrl } = await convertImageToWebP(rawFile, 0.60);
          const webpMedia: Media = {
            ...tempMedia,
            storage_path: webpDataUrl,
            original_name: webpFile.name,
            mime_type: 'image/webp',
            file_size: webpFile.size,
          };
          store.addMediaToEntity(webpMedia);
          setMediaList(store.getMediaByEntity('theme', theme.id));
          showNotification(`Foto "${webpFile.name}" salva.`);
        } catch {
          showNotification('Erro ao processar imagem.', 'error');
        }
      }
    });
  };

  const handleSetPrimaryMedia = (mediaId: string) => {
    store.setPrimaryMedia('theme', theme.id, mediaId);
    setMediaList(store.getMediaByEntity('theme', theme.id));
    showNotification('Foto de capa definida com sucesso!');
  };

  const handleDeleteMedia = (mediaId: string) => {
    store.deleteMedia(mediaId);
    setMediaList(store.getMediaByEntity('theme', theme.id));
    showNotification('Foto removida.');
  };

  // Add / Manage Variants
  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varName.trim()) return;

    setIsSavingVariant(true);
    try {
      let finalImageUrl: string | undefined = undefined;
      if (varPhoto?.file) {
        try {
          const uploaded = await uploadImageToServer(varPhoto.file);
          finalImageUrl = uploaded.url;
        } catch {
          finalImageUrl = varPhoto.previewUrl;
        }
      } else if (varPhoto?.previewUrl) {
        finalImageUrl = varPhoto.previewUrl;
      }

      const created = store.createThemeVariant(
        theme.id,
        varName.trim(),
        varDesc.trim() || undefined,
        finalImageUrl
      );

      if (finalImageUrl) {
        store.addMediaToEntity({
          entity_type: 'variant',
          entity_id: created.id,
          storage_path: finalImageUrl,
          original_name: varPhoto?.name || `${varName.trim()}_foto.webp`,
          mime_type: 'image/webp',
          file_size: varPhoto?.file?.size || 400000,
          fingerprint: `sha256-var-${created.id.substring(0, 6)}-${Date.now()}`,
          is_primary: true,
          ai_tags: [varName.trim()],
        });
      }

      setVarName('');
      setVarDesc('');
      setVarPhoto(null);
      setIsAddingVariant(false);
      setVariantsList(store.getThemeVariants(theme.id));
      showNotification(`Variável "${varName}" incluída com sucesso no tema!`);
    } catch (err: any) {
      showNotification(err.message || 'Erro ao adicionar variável.', 'error');
    } finally {
      setIsSavingVariant(false);
    }
  };

  const handleDeleteVariant = (variantId: string, vName: string) => {
    if (confirm(`Tem certeza que deseja excluir a variável "${vName}"?`)) {
      store.deleteThemeVariant(variantId);
      setVariantsList(store.getThemeVariants(theme.id));
      showNotification(`Variável "${vName}" removida.`);
    }
  };

  // Add / Manage Kits
  const handleSaveKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitName.trim() || !kitPrice) return;

    setIsSavingKit(true);
    try {
      if (editingKitId) {
        store.updateKit(editingKitId, {
          name: kitName.trim(),
          price: Number(kitPrice),
          promotional_price: kitPromoPrice ? Number(kitPromoPrice) : null,
          description: kitDesc.trim() || null,
          image_url: kitPhotoUrl || null,
        });
        showNotification(`Kit "${kitName}" atualizado com sucesso!`);
      } else {
        const created = store.createKit(
          theme.id,
          kitName.trim(),
          Number(kitPrice),
          kitDesc.trim() || undefined
        );
        if (kitPromoPrice || kitPhotoUrl) {
          store.updateKit(created.id, {
            promotional_price: kitPromoPrice ? Number(kitPromoPrice) : null,
            image_url: kitPhotoUrl || null,
          });
        }
        showNotification(`Kit "${kitName}" criado com sucesso!`);
      }

      setEditingKitId(null);
      setKitName('');
      setKitPrice('');
      setKitPromoPrice('');
      setKitDesc('');
      setKitPhotoUrl('');
      setIsAddingKit(false);
      setKitsList(store.getKitsByTheme(theme.id));
    } catch (err: any) {
      showNotification(err.message || 'Erro ao salvar kit.', 'error');
    } finally {
      setIsSavingKit(false);
    }
  };

  const handleStartEditKit = (kit: Kit) => {
    setEditingKitId(kit.id);
    setKitName(kit.name);
    setKitPrice(kit.price);
    setKitPromoPrice(kit.promotional_price !== null && kit.promotional_price !== undefined ? kit.promotional_price : '');
    setKitDesc(kit.description || '');
    setKitPhotoUrl(kit.image_url || '');
    setIsAddingKit(true);
  };

  const handleDeleteKit = (kitId: string, kName: string) => {
    if (confirm(`Tem certeza que deseja excluir o kit "${kName}"?`)) {
      store.deleteKit(kitId);
      setKitsList(store.getKitsByTheme(theme.id));
      showNotification(`Kit "${kName}" removido.`);
    }
  };

  // Promotion Handlers
  const handleApplyPromotion = () => {
    const val = Number(promoDiscountValue);
    if (isNaN(val) || val <= 0) {
      showNotification('Informe um valor de desconto válido.', 'error');
      return;
    }

    store.applyDiscountToThemes([theme.id], promoDiscountType, val);
    refreshData();
    showNotification('Promoção aplicada com sucesso ao tema!');
  };

  const handleRemovePromotion = () => {
    store.removeDiscountFromThemes([theme.id]);
    refreshData();
    showNotification('Promoção removida do tema.');
  };

  const calculatedPromoPrice = () => {
    const base = Number(basePrice) || 0;
    const val = Number(promoDiscountValue) || 0;
    if (promoDiscountType === 'percentage') {
      const discount = base * (Math.max(0, Math.min(100, val)) / 100);
      return Math.max(0, Math.round((base - discount) * 100) / 100);
    } else {
      return Math.max(0, Math.round((base - val) * 100) / 100);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.push('/admin/temas')}
              className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1 text-xs font-semibold shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-pink-600 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md shrink-0">
                {theme.code}
              </span>
              <h1 className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {theme.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href={`/catalogo/${theme.slug}`}
              target="_blank"
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 shrink-0"
              title="Ver no Catálogo"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Catálogo</span>
            </Link>

            <button
              type="button"
              onClick={() => handleSaveGeneral()}
              disabled={isSaving}
              className="px-3 sm:px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-16 right-4 sm:right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-lg border text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
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

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-2.5 sm:px-6 pt-4 sm:pt-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 overflow-x-auto pb-px mb-4 sm:mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 sm:gap-2 border-b-2 ${
              activeTab === 'dados'
                ? 'border-pink-600 text-pink-600 dark:text-pink-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Dados</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fotos')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 sm:gap-2 border-b-2 ${
              activeTab === 'fotos'
                ? 'border-pink-600 text-pink-600 dark:text-pink-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Fotos ({mediaList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variaveis')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 sm:gap-2 border-b-2 ${
              activeTab === 'variaveis'
                ? 'border-pink-600 text-pink-600 dark:text-pink-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Variáveis ({variantsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kits')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 sm:gap-2 border-b-2 ${
              activeTab === 'kits'
                ? 'border-pink-600 text-pink-600 dark:text-pink-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Kits ({kitsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promocoes')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 sm:gap-2 border-b-2 ${
              activeTab === 'promocoes'
                ? 'border-pink-600 text-pink-600 dark:text-pink-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Promoção</span>
            {theme.promotional_price && theme.promotional_price < theme.base_price && (
              <span className="w-2 h-2 rounded-full bg-pink-500" />
            )}
          </button>
        </div>

        {/* TAB 1: DADOS GERAIS */}
        {activeTab === 'dados' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Informações do Tema
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nome do Tema *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Ex: Circo Mágico, Vingadores..."
                />
              </div>

              {/* Categoria + Botão Gerenciar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Categoria
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCatModalOpen(true)}
                    className="text-xs text-pink-600 dark:text-pink-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    Gerenciar categorias
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="">Sem categoria definida</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preço Base */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Preço Base de Locação (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-zinc-400 font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Quantidade em Estoque */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Quantidade em Estoque (Kits completos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              {/* Personagens / Tags */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Personagens / Tags (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={characters}
                  onChange={(e) => setCharacters(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Ex: Homem de Ferro, Capitão América, Hulk"
                />
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Descrição dos Itens Inclusos
                </label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Status & Destaque */}
              <div className="flex items-center gap-6 md:col-span-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status === 'active'}
                    onChange={(e) => setStatus(e.target.checked ? 'active' : 'inactive')}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Tema Ativo no Catálogo
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Destacar Tema na Página Inicial
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveGeneral()}
                disabled={isSaving}
                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: FOTOS & GALERIA */}
        {activeTab === 'fotos' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Galeria de Fotos do Tema
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Todas as fotos enviadas são convertidas automaticamente para .WEBP com 60% de qualidade
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={handleUploadPhoto}
                  multiple
                  accept="image/*,.heic,.heif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Adicionar Fotos</span>
                </button>
              </div>
            </div>

            {mediaList.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <ImageIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Nenhuma foto cadastrada para este tema.
                </p>
                <p className="text-xs text-zinc-400 mt-1 mb-4">
                  Adicione fotos no formato retrato ou horizontal para o catálogo.
                </p>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-4 py-2 bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 text-xs font-semibold rounded-xl hover:bg-pink-100 transition"
                >
                  Fazer Upload Agora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaList.map((media) => {
                  const isPrimary = !!media.is_primary;
                  return (
                    <div
                      key={media.id}
                      className={`group relative rounded-2xl overflow-hidden border bg-zinc-100 dark:bg-zinc-800 flex flex-col ${
                        isPrimary
                          ? 'border-pink-500 ring-2 ring-pink-500/20 shadow-md'
                          : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <div className="aspect-[3/4] relative w-full overflow-hidden bg-zinc-900/5">
                        <Image
                          src={media.storage_path}
                          alt={media.original_name || 'Foto'}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          unoptimized
                        />
                        {isPrimary && (
                          <span className="absolute top-2 left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" />
                            Capa
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1 border-t border-zinc-100 dark:border-zinc-800">
                        {!isPrimary ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryMedia(media.id)}
                            className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-pink-600 transition flex items-center gap-1"
                            title="Tornar esta a foto de capa"
                          >
                            <Star className="w-3 h-3" />
                            Definir Capa
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-pink-600 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Foto Principal
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(media.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                          title="Excluir foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VARIÁVEIS DO TEMA */}
        {activeTab === 'variaveis' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Variáveis & Versões do Tema
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Ex: Vingadores Baby, Vingadores Clássico, Tardezinha Tropical...
                </p>
              </div>

              {!isAddingVariant && (
                <button
                  type="button"
                  onClick={() => setIsAddingVariant(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Incluir Variável</span>
                </button>
              )}
            </div>

            {/* Form to add variable */}
            {isAddingVariant && (
              <form
                onSubmit={handleSaveVariant}
                className="p-5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-2xl space-y-4 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Cadastrar Nova Variável
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingVariant(false);
                      setVarPhoto(null);
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-600 font-semibold"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nome da Variável *
                    </label>
                    <input
                      type="text"
                      value={varName}
                      onChange={(e) => setVarName(e.target.value)}
                      placeholder="Ex: Vingadores Baby, Versão Rústica..."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Descrição da Variável (opcional)
                    </label>
                    <input
                      type="text"
                      value={varDesc}
                      onChange={(e) => setVarDesc(e.target.value)}
                      placeholder="Ex: Tons pastéis para aniversário de 1 ano"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                {/* Upload Foto da Variável */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Foto Específica da Variável (Convertida para .WEBP 60%)
                  </label>
                  <input
                    type="file"
                    ref={varFileInputRef}
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const { file: webpFile, dataUrl } = await convertImageToWebP(file, 0.60);
                        setVarPhoto({
                          file: webpFile,
                          previewUrl: dataUrl,
                          name: webpFile.name,
                        });
                      } catch {
                        setVarPhoto({
                          file,
                          previewUrl: URL.createObjectURL(file),
                          name: file.name,
                        });
                      }
                    }}
                  />

                  {varPhoto ? (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="w-12 h-14 relative rounded-lg overflow-hidden shrink-0 border">
                        <Image
                          src={varPhoto.previewUrl}
                          alt="Prévia"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {varPhoto.name}
                        </p>
                        <p className="text-[11px] text-purple-600 font-medium">
                          Convertida para .WEBP 60%
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVarPhoto(null)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => varFileInputRef.current?.click()}
                      className="w-full py-3 border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-950/30 transition flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Anexar foto da versão
                    </button>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingVariant(false);
                      setVarPhoto(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingVariant || !varName.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingVariant ? 'Salvando...' : 'Salvar Variável'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of variables */}
            {variantsList.length === 0 ? (
              <div className="text-center py-10 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-sm">
                Nenhuma variável cadastrada para este tema.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variantsList.map((v) => {
                  const photo =
                    v.image_url ||
                    store.getMediaByEntity('variant', v.id)[0]?.storage_path ||
                    theme.primary_media?.storage_path;

                  return (
                    <div
                      key={v.id}
                      className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {photo && (
                          <div className="w-12 h-14 rounded-lg overflow-hidden relative shrink-0 border border-zinc-200 dark:border-zinc-700">
                            <Image
                              src={photo}
                              alt={v.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {v.name}
                          </h4>
                          {v.description && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                              {v.description}
                            </p>
                          )}
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1 inline-block">
                            Disponível no catálogo público
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(v.id, v.name)}
                        className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition shrink-0"
                        title="Excluir variável"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: KITS DO TEMA */}
        {activeTab === 'kits' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Kits da Decoração
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Cadastre opções de pacotes (ex: Kit Pegue e Monte, Kit Pocket, Kit Master)
                </p>
              </div>

              {!isAddingKit && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingKitId(null);
                    setKitName('');
                    setKitPrice('');
                    setKitPromoPrice('');
                    setKitDesc('');
                    setKitPhotoUrl('');
                    setIsAddingKit(true);
                  }}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Kit</span>
                </button>
              )}
            </div>

            {/* Form to add / edit kit */}
            {isAddingKit && (
              <form
                onSubmit={handleSaveKit}
                className="p-5 bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/50 rounded-2xl space-y-4 animate-in fade-in duration-200"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-pink-900 dark:text-pink-300">
                  {editingKitId ? 'Editar Kit' : 'Novo Kit para este Tema'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nome do Kit *
                    </label>
                    <input
                      type="text"
                      value={kitName}
                      onChange={(e) => setKitName(e.target.value)}
                      placeholder="Ex: Kit Pegue e Monte"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Preço Normal (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={kitPrice}
                      onChange={(e) => setKitPrice(e.target.value)}
                      placeholder="120.00"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
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
                      value={kitPromoPrice}
                      onChange={(e) => setKitPromoPrice(e.target.value)}
                      placeholder="99.00"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Descrição do que inclui no Kit
                    </label>
                    <input
                      type="text"
                      value={kitDesc}
                      onChange={(e) => setKitDesc(e.target.value)}
                      placeholder="Ex: Painel redondo, 3 cilindros e 1 boleira de mesa"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingKit(false);
                      setEditingKitId(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingKit || !kitName.trim() || !kitPrice}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingKit ? 'Salvando...' : 'Salvar Kit'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Kits */}
            {kitsList.length === 0 ? (
              <div className="text-center py-10 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-sm">
                Nenhum kit cadastrado para este tema.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {kitsList.map((kit) => (
                  <div
                    key={kit.id}
                    className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {kit.name}
                        </h4>
                      </div>
                      {kit.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {kit.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-baseline gap-2">
                        {kit.promotional_price ? (
                          <>
                            <span className="text-xs text-zinc-400 line-through">
                              R$ {kit.price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-sm font-bold text-pink-600">
                              R$ {kit.promotional_price.toFixed(2).replace('.', ',')}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            R$ {kit.price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditKit(kit)}
                        className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                        title="Editar kit"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKit(kit.id, kit.name)}
                        className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                        title="Excluir kit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROMOÇÕES */}
        {activeTab === 'promocoes' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Motor de Promoção do Tema
            </h2>

            {/* Status Atual */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Preço Base Atual</p>
                <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                  R$ {theme.base_price.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Preço Promocional Cadastrado</p>
                {theme.promotional_price && theme.promotional_price < theme.base_price ? (
                  <p className="text-xl font-black text-emerald-600">
                    R$ {theme.promotional_price.toFixed(2).replace('.', ',')}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-zinc-400">Nenhuma promoção ativa</p>
                )}
              </div>

              {theme.promotional_price && theme.promotional_price < theme.base_price && (
                <button
                  type="button"
                  onClick={handleRemovePromotion}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold rounded-xl transition"
                >
                  Remover Promoção Atual
                </button>
              )}
            </div>

            {/* Calculadora de Nova Promoção */}
            <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Aplicar ou Atualizar Desconto Promocional
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de Desconto */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Tipo de Desconto
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPromoDiscountType('percentage')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                        promoDiscountType === 'percentage'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Porcentagem (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoDiscountType('fixed')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                        promoDiscountType === 'fixed'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Valor Fixo (R$)
                    </button>
                  </div>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {promoDiscountType === 'percentage' ? 'Porcentagem de Desconto (%)' : 'Valor do Desconto (R$)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={promoDiscountValue}
                    onChange={(e) => setPromoDiscountValue(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Resultado previsto */}
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500">Preço com desconto no catálogo:</span>
                  <p className="text-base font-black text-amber-600 dark:text-amber-400">
                    R$ {calculatedPromoPrice().toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromotion}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Aplicar Desconto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Gerenciar Categorias */}
      <ManageCategoriesModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onSuccess={() => setCategories(store.getCategories())}
      />
    </div>
  );
}
