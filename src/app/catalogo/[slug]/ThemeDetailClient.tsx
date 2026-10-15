'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  CheckCircle2,
  Sparkles,
  Package,
  Layers,
  ShieldAlert,
  Maximize2,
  X,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { store, DEFAULT_THEME_DESCRIPTION } from '@/lib/store';
import { getWhatsAppUrl, formatWhatsAppDisplay } from '@/lib/whatsapp';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ThemeWithDetails } from '@/types/database';

interface ThemeDetailClientProps {
  slug: string;
  initialTheme?: ThemeWithDetails | null;
}

export function ThemeDetailClient({ slug, initialTheme }: ThemeDetailClientProps) {
  const [theme, setTheme] = useState<ThemeWithDetails | null>(
    initialTheme || store.getThemeBySlug(slug)
  );
  const [showPrices, setShowPrices] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('magia_festeira_show_prices');
      if (saved !== null) return saved === 'true';
    }
    return store.getShowPrices();
  });
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const sync = () => {
      const found = store.getThemeBySlug(slug);
      if (found) setTheme(found);
      setShowPrices(store.getShowPrices());
    };
    sync();
    const unsubscribe = store.subscribe(sync);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'magia_festeira_show_prices') {
        setShowPrices(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, [slug]);

  const defaultImage =
    theme?.primary_media?.storage_path ||
    (theme?.media && theme.media.length > 0 ? theme.media[0].storage_path : '') ||
    (theme as any)?.imageUrl ||
    '';

  const [activeImage, setActiveImage] = useState<string>(defaultImage);
  const [copied, setCopied] = useState(false);

  // Sync activeImage if theme loads or media updates
  useEffect(() => {
    if (defaultImage) {
      const belongsToTheme = theme?.media?.some((m) => m.storage_path === activeImage);
      if (!activeImage || !belongsToTheme) {
        setActiveImage(defaultImage);
      }
    }
  }, [defaultImage, theme?.media]);

  if (!theme || theme.status !== 'active') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar />
        <div className="max-w-md mx-auto my-auto text-center p-8">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Tema Indisponível no Momento</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            O tema solicitado não está disponível no catálogo público no momento.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Catálogo</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const hasPromo = showPrices && theme.promotional_price && theme.promotional_price < theme.base_price;

  const activeDescription = useMemo(() => {
    if (!theme) return '';
    if (!selectedVariantId) {
      return theme.description?.trim() || '';
    }
    if (selectedVariantId.startsWith('kit-')) {
      const kitId = selectedVariantId.replace('kit-', '');
      const foundKit = theme.kits?.find((k) => k.id === kitId);
      return foundKit?.description?.trim() || '';
    }
    if (selectedVariantId.startsWith('var-')) {
      const varId = selectedVariantId.replace('var-', '');
      const foundVar = theme.variants?.find((v) => v.id === varId);
      return foundVar?.description?.trim() || '';
    }
    return '';
  }, [selectedVariantId, theme]);

  // Fotos mapeadas dinamicamente para o tema e versão/kit selecionado
  const currentPhotos = useMemo(() => {
    if (!theme) return [];

    const baseMedia = (theme.media || []).map((m) => ({
      id: m.id,
      url: m.storage_path,
      name: m.original_name,
      variantKey: 'default',
    }));

    if (selectedVariantId?.startsWith('var-')) {
      const varId = selectedVariantId.replace('var-', '');
      const foundVar = theme.variants?.find((v) => v.id === varId);
      const varMedia = store.getMediaByEntity('variant', varId);
      const list: { id: string; url: string; name: string; variantKey: string }[] = [];

      if (foundVar?.image_url) {
        list.push({
          id: `var-img-${foundVar.id}`,
          url: foundVar.image_url,
          name: foundVar.name,
          variantKey: selectedVariantId,
        });
      }
      varMedia.forEach((m) => {
        if (!list.some((existing) => existing.url === m.storage_path)) {
          list.push({
            id: m.id,
            url: m.storage_path,
            name: m.original_name || foundVar?.name || 'Variante',
            variantKey: selectedVariantId,
          });
        }
      });

      if (list.length > 0) return list;
      return baseMedia;
    }

    if (selectedVariantId?.startsWith('kit-')) {
      const kitId = selectedVariantId.replace('kit-', '');
      const foundKit = theme.kits?.find((k) => k.id === kitId);
      const kitMedia = store.getMediaByEntity('kit', kitId);
      const list: { id: string; url: string; name: string; variantKey: string }[] = [];

      if (foundKit?.image_url) {
        list.push({
          id: `kit-img-${foundKit.id}`,
          url: foundKit.image_url,
          name: foundKit.name,
          variantKey: selectedVariantId,
        });
      }
      kitMedia.forEach((m) => {
        if (!list.some((existing) => existing.url === m.storage_path)) {
          list.push({
            id: m.id,
            url: m.storage_path,
            name: m.original_name || foundKit?.name || 'Kit',
            variantKey: selectedVariantId,
          });
        }
      });

      if (list.length > 0) return list;
      return baseMedia;
    }

    const all = [...baseMedia];
    theme.variants?.forEach((v) => {
      if (v.image_url && !all.some((m) => m.url === v.image_url)) {
        all.push({
          id: `var-${v.id}`,
          url: v.image_url,
          name: v.name,
          variantKey: `var-${v.id}`,
        });
      }
    });
    theme.kits?.forEach((k) => {
      if (k.image_url && !all.some((m) => m.url === k.image_url)) {
        all.push({
          id: `kit-${k.id}`,
          url: k.image_url,
          name: k.name,
          variantKey: `kit-${k.id}`,
        });
      }
    });
    return all;
  }, [theme, selectedVariantId]);

  const selectedKit = selectedVariantId?.startsWith('kit-')
    ? theme.kits?.find((k) => `kit-${k.id}` === selectedVariantId)
    : null;
  const selectedVariant = selectedVariantId?.startsWith('var-')
    ? theme.variants?.find((v) => `var-${v.id}` === selectedVariantId)
    : null;
  const selectionInfo = selectedKit
    ? ` (Kit: ${selectedKit.name})`
    : selectedVariant
    ? ` (Variação: ${selectedVariant.name})`
    : '';

  const whatsappMsg = showPrices
    ? `Olá! Tenho interesse no tema ${theme.name} (${theme.code})${selectionInfo}${currentUrl ? `: ${currentUrl}` : ''}. Gostaria de consultar datas e disponibilidade!`
    : `Olá! Tenho interesse no tema ${theme.name} (${theme.code})${selectionInfo}${currentUrl ? `: ${currentUrl}` : ''}. Gostaria de solicitar um orçamento e consultar disponibilidade de datas!`;

  // Gera link wa.me oficial com mensagem contextualizada
  const whatsappUrl = getWhatsAppUrl(whatsappMsg);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${theme.name} - Magia Festeira`,
          text: `Confira a decoração do tema ${theme.name} na Magia Festeira:`,
          url: window.location.href,
        });
        return;
      } catch {
        // Usuário cancelou share nativo, fallback para clipboard
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      {/* Breadcrumb Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Todos os Temas</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link Copiado!' : 'Compartilhar Tema'}</span>
          </button>
        </div>
      </div>

      {/* Main Theme Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Image Showcase & Gallery (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Photo Showcase - Formato Retrato / Proporção Natural da Foto Original */}
            <div className="w-full flex justify-center">
              <div
                onClick={() => setIsLightboxOpen(true)}
                className="relative w-full max-w-md sm:max-w-lg aspect-3/4 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-md group cursor-zoom-in"
              >
                {activeImage ? (
                  <OptimizedImage
                    src={activeImage}
                    alt={theme.name}
                    aspectRatio="3/4"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Sparkles className="w-12 h-12 mb-2 stroke-1" />
                    <span className="text-sm font-medium">Foto em Produção</span>
                  </div>
                )}



                {/* Botão de Zoom */}
                <div className="absolute bottom-4 right-4 z-10 p-2.5 rounded-2xl bg-slate-950/70 backdrop-blur-md text-white/90 hover:text-white hover:bg-slate-950/90 transition-all shadow-lg pointer-events-none group-hover:scale-110">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Thumbnail Carousel / Grid */}
            {currentPhotos.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 max-w-md sm:max-w-lg mx-auto scrollbar-thin">
                {currentPhotos.map((photo, idx) => {
                  const isCurrent = activeImage === photo.url;
                  return (
                    <button
                      key={photo.id || `thumb-${idx}`}
                      onClick={() => setActiveImage(photo.url)}
                      className={`relative w-20 h-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-rose-600 dark:border-rose-500 scale-102 shadow-md'
                          : 'border-transparent opacity-65 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.name || theme.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Information, Pricing, Kits & WhatsApp CTA (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Tema Exclusivo
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {theme.piece_count > 0 ? `${theme.piece_count} Peças Decorativas` : 'Decoração Completa'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {theme.name}
              </h1>
            </div>

            {/* Pricing Section (se showPrices = true) */}
            {showPrices && (
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-baseline gap-3">
                  {hasPromo ? (
                    <>
                      <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        R$ {theme.promotional_price?.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        R$ {theme.base_price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                        Promoção
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      R$ {theme.base_price.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Valor para locação e montagem conforme especificações. Consulte frete e montagem no local.
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sobre este Tema
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeDescription || theme.description || DEFAULT_THEME_DESCRIPTION}
              </p>
            </div>

            {/* Personagens / Elementos em Destaque */}
            {theme.characters && theme.characters.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Elementos e Personagens
                </h3>
                <div className="flex flex-wrap gap-2">
                  {theme.characters.map((char, idx) => (
                    <span
                      key={`char-${idx}`}
                      className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/60 dark:border-slate-800"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Kits Disponíveis */}
            {theme.kits && theme.kits.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Opções de Kits
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {theme.kits.map((kit) => {
                    const isSelected = selectedVariantId === `kit-${kit.id}`;
                    return (
                      <button
                        key={kit.id}
                        onClick={() => setSelectedVariantId(isSelected ? null : `kit-${kit.id}`)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {kit.name}
                          </span>
                          {showPrices && (
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                              R$ {kit.price.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                        {kit.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {kit.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variações de Estilo (Baby, Clássico, etc.) */}
            {theme.variants && theme.variants.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Variações & Estilos
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {theme.variants.map((v) => {
                    const isSelected = selectedVariantId === `var-${v.id}`;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariantId(isSelected ? null : `var-${v.id}`)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {v.name}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                        </div>
                        {v.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {v.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WhatsApp Call to Action */}
            <div className="pt-4 space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Consultar Disponibilidade no WhatsApp</span>
              </a>
              <p className="text-center text-xs text-slate-400">
                Atendimento rápido pelo WhatsApp Oficial: {formatWhatsAppDisplay()}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal com Zoom */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            {activeImage && (
              <Image
                src={activeImage}
                alt={theme.name}
                width={1200}
                height={1600}
                unoptimized
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
